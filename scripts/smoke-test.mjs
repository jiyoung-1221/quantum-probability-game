import { spawn } from 'node:child_process';

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const debuggingPort = 9333;
const appUrl = 'http://127.0.0.1:5173/';

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

  const expectText = async (text) => {
    await sleep(100);
    const hasText = await evaluate(
      `document.body.innerText.includes(${JSON.stringify(text)})`,
    );
    if (!hasText) {
      throw new Error(`Expected text was not found: ${text}`);
    }
  };

  await client.call('Runtime.enable');
  await expectText('확률적 분포');

  await clickByText('확률적 분포');
  await expectText('1번 · 먼저 생각해보기');

  await clickByText('X');
  await clickByText('결과 확인');
  await expectText('정답 피드백');
  await clickByText('다음 문제');

  await expectText('2번 · 순서 맞추기');
  await expectText('순서 배열 카드');
  await clickByText('전자 하나 발사');
  await clickByText('확률적으로 도착');
  await clickByText('점들이 점점 쌓임');
  await clickByText('간섭무늬 형성');
  await clickByText('결과 확인');
  await expectText('정답 피드백');
  await clickByText('다음 문제');

  await expectText('3번 · 핵심 개념 도전');
  await clickByText('A. 이중슬릿 실험은 간섭무늬를 형성한다.');
  await clickByText('결과 확인');
  await clickByText('다음 문제');

  await expectText('4번 · 결과 예상하기');
  await clickByText('C. 간섭무늬가 점점 형성된다.');
  await clickByText('결과 확인');
  await clickByText('다음 문제');

  await expectText('5번 · ⚠️ 이런 생각, 맞을까?');
  await clickByText('B. 적절하지 않다.');
  await clickByText('결과 확인');
  await clickByText('완료하고 허브로 돌아가기');

  await expectText('1/4개 탐험 완료');
  await expectText('25%');

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
