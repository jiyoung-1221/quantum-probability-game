import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const debuggingPort = 9333;
const appUrl = 'http://127.0.0.1:5173/';
const concepts = JSON.parse(
  await readFile(new URL('../src/data/concepts.json', import.meta.url), 'utf8'),
);

const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${debuggingPort}`,
    '--user-data-dir=C:/tmp/quantum-probability-game-smoke',
    appUrl,
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getDebuggerUrl() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debuggingPort}/json/list`);
      const pages = await response.json();
      const page = pages.find((entry) => entry.url.includes('127.0.0.1:5173'));
      if (page?.webSocketDebuggerUrl) {
        return page.webSocketDebuggerUrl;
      }
    } catch {
      await sleep(250);
    }
  }

  throw new Error('Chrome DevTools endpoint was not available.');
}

function connect(url) {
  const socket = new WebSocket(url);
  let id = 0;
  const pending = new Map();

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolve(message.result);
      }
    }
  });

  return new Promise((resolve, reject) => {
    socket.addEventListener('open', () => {
      resolve({
        call(method, params = {}) {
          id += 1;
          socket.send(JSON.stringify({ id, method, params }));
          return new Promise((callResolve, callReject) => {
            pending.set(id, { resolve: callResolve, reject: callReject });
          });
        },
        close() {
          socket.close();
        },
      });
    });
    socket.addEventListener('error', () => reject(new Error('WebSocket failed.')));
  });
}

async function run() {
  const client = await connect(await getDebuggerUrl());

  const evaluate = async (expression) => {
    const result = await client.call('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });

    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text);
    }

    return result.result.value;
  };

  const clickByText = (text) =>
    evaluate(`
      (() => {
        const button = [...document.querySelectorAll('button')]
          .find((node) => node.textContent.includes(${JSON.stringify(text)}));
        if (!button) throw new Error('Button not found: ${text}');
        button.click();
        return true;
      })()
    `);

  const clickLastButtonByText = (text) =>
    evaluate(`
      (() => {
        const buttons = [...document.querySelectorAll('button')]
          .filter((node) => node.textContent.includes(${JSON.stringify(text)}));
        const button = buttons.at(-1);
        if (!button) throw new Error('Button not found: ${text}');
        button.click();
        return true;
      })()
    `);

  const expectText = async (text) => {
    await sleep(100);
    const hasText = await evaluate(
      `document.body.innerText.includes(${JSON.stringify(text)})`,
    );
    if (!hasText) {
      throw new Error(`Expected text was not found: ${text}`);
    }
  };

  const expectNoText = async (text) => {
    await sleep(100);
    const hasText = await evaluate(
      `document.body.innerText.includes(${JSON.stringify(text)})`,
    );
    if (hasText) {
      throw new Error(`Unexpected text was found: ${text}`);
    }
  };

  const expectButton = async (text) => {
    const hasButton = await evaluate(`
      [...document.querySelectorAll('button')]
        .some((node) => node.textContent.includes(${JSON.stringify(text)}))
    `);
    if (!hasButton) {
      throw new Error(`Expected button was not found: ${text}`);
    }
  };

  await client.call('Runtime.enable');
  await expectText('양자역학 속 확률 탐험실');

  for (let conceptIndex = 0; conceptIndex < concepts.length; conceptIndex += 1) {
    const concept = concepts[conceptIndex];
    await clickByText(concept.title);

    for (
      let questionIndex = 0;
      questionIndex < concept.questions.length;
      questionIndex += 1
    ) {
      const question = concept.questions[questionIndex];
      await expectText(`${questionIndex + 1}번 ·`);

      if (conceptIndex === 0 && questionIndex === 0) {
        const wrongChoice = question.choices.find(
          (choice) => choice.id !== question.correctAnswer,
        );

        await clickByText(wrongChoice.text);
        await clickLastButtonByText('결과 확인');
        await expectText('오답 피드백');
        await expectButton('다시 풀어보기');
        await expectButton('다음 문제로 넘어가기');
        await clickByText('다시 풀어보기');
        await expectNoText('오답 피드백');
        await expectButton('결과 확인');
      }

      if (question.type === 'branching') {
        await expectText('결과 흐름 완성하기');

        for (const card of [
          question.correctAnswer.start,
          question.correctAnswer.middle,
          question.correctAnswer.rightResult,
          question.correctAnswer.leftResult,
        ]) {
          await clickByText(card);
        }
      } else {
        const correctChoiceIds = Array.isArray(question.correctAnswer)
          ? question.correctAnswer
          : [question.correctAnswer];

        for (const choiceId of correctChoiceIds) {
          const choice = question.choices.find((item) => item.id === choiceId);
          await clickByText(choice.text);
        }
      }

      await clickLastButtonByText('결과 확인');
      try {
        await expectText('정답 피드백');
      } catch {
        throw new Error(
          `Correct answer was not accepted: ${concept.title} / ${question.id}`,
        );
      }
      await clickByText(
        questionIndex === concept.questions.length - 1
          ? '완료하고 허브로 돌아가기'
          : '다음 문제',
      );
    }

    if (conceptIndex < concepts.length - 1) {
      await expectText(`${conceptIndex + 1}/${concepts.length} 탐험 완료`);
    }
  }

  await expectText('양자 확률 탐험 완료!');
  await expectText(
    '이중슬릿, 중첩, 터널 효과, 전자구름을 통해 양자역학 속 ‘확률’의 의미를 모두 탐험했어요.',
  );
  await expectButton('허브로 돌아가기');
  await expectButton('다시 탐험하기');
  await expectText('응답 결과 제출');
  await expectText('반 선택');
  await expectText('번호 선택');
  await expectButton('결과 제출하기');
  await expectButton('CSV 다운로드');
  await clickByText('결과 제출하기');
  await expectText('반과 번호를 먼저 선택해주세요.');
  await clickByText('다시 탐험하기');
  await expectText('0/4 탐험 완료');
  await expectText('0%');
  await expectNoText('양자 확률 탐험 완료!');

  client.close();
}

run()
  .then(() => {
    chrome.kill();
    console.log('Smoke test passed.');
  })
  .catch((error) => {
    chrome.kill();
    console.error(error);
    process.exitCode = 1;
  });
