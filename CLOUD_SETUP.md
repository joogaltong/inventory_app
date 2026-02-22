# 재고앱 24시간(클라우드) 운영 설정

## 0) Render 블루프린트 사용 (권장)
- 이 폴더에 `render.yaml`이 있으므로 Render에서 레포 연결 후 Blueprint 배포 가능
- `APP_TOKEN`은 Render가 자동 생성하도록 설정됨
- 배포 후 Render 대시보드에서 `APP_TOKEN` 값을 확인해 앱 설정에 동일하게 입력

## 1) 서버 배포
- 서비스 타입: Node.js Web Service
- 시작 명령어: `npm start`
- Node 버전: 18 이상

## 2) 환경변수
- `APP_TOKEN`: 앱-서버 인증 토큰(직접 랜덤 문자열 생성)
- `INVENTORY_DATA_DIR`: 서버 데이터 저장 경로
  - 예: Render 디스크를 `/data`에 마운트했다면 `/data`
- `PORT`: 플랫폼 자동 주입값 사용(직접 고정하지 않아도 됨)
- `HOST`: 기본값 `0.0.0.0` 그대로 사용

## 3) 영구 저장소(중요)
- 반드시 Persistent Disk(영구 디스크) 연결
- `INVENTORY_DATA_DIR`를 영구 디스크 경로로 설정
- 이렇게 해야 서버 재시작 후에도 데이터/기준표가 유지됨

## 4) 앱 설정
`/Users/joowon/Documents/New project/inventory-app/user-config.js`에서 아래를 채움:

```js
window.APP_CONFIG = {
  defaultGoogleSheetUrl: "",
  autoSyncOnLoad: false,
  cloudSync: {
    enabled: true,
    baseUrl: "https://배포된-서버-도메인",
    token: "APP_TOKEN과-동일값",
    pullOnInit: true,
    autoPush: true,
    pushDebounceMs: 1200,
    timeoutMs: 15000,
  },
};
```

## 5) 앱 반영
- 웹: `npm run build:web`
- iOS 캡슐 앱: `npm run cap:sync` 후 Xcode 재실행

## 6) 동작 방식
- 앱 실행 시: 서버 상태를 먼저 가져옴
- 입력/수정 시: 로컬 저장 + 서버 자동 저장
- 기준표 업로드 시: 템플릿도 서버에 저장
- 서버 템플릿이 있으면 내보내기 시 재사용 가능
