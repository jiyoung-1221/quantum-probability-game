# Quantum Probability Game

React, Vite, TypeScript, Tailwind CSS 기반의 고등학교 과학 형성평가 웹앱입니다.

## 학습 구조

학생은 메인 허브에서 네 가지 확률 개념 영역을 자유롭게 선택할 수 있습니다.

- 확률적 분포
- 확률적 상태
- 확률적 사건
- 확률적 존재

각 영역은 5문항 형성평가로 구성되어 있으며, 완료 여부는 허브의 진행률과 체크 표시로 확인합니다. 전체 문항 데이터는 `src/data/concepts.json`에서 관리합니다.

## 로컬 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

## 테스트

```bash
npm run lint
npm run build
npm run test:smoke
```

## Render Static Site 배포

`render.yaml`에 Static Site 설정을 포함했습니다.

- Build Command: `npm install && npm run build`
- Publish Directory: `./dist`
- SPA Rewrite: `/*` -> `/index.html`

Render Dashboard에서 Static Site 또는 Blueprint로 연결하면 됩니다.
