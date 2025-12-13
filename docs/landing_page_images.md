# 랜딩 페이지 이미지 가이드

## 개요

이 문서는 랜딩 페이지에 필요한 이미지들의 위치, 크기, 비율 및 컨셉을 정리한 가이드입니다.

## 이미지 목록

### 1. Hero Background Images (3개)

**위치:** 섹션 1 - Hero Section
**자동 전환:** 5초마다 페이드 효과로 전환
**투명도:** 30% (텍스트 가독성 확보)

#### Hero Background 1
- **파일명 제안:** `hero-bg-1.jpg`
- **권장 크기:** `1920x1080px` (16:9 비율)
- **대체 크기:** `2560x1080px` (21:9 초광각, 더 몰입감 있는 효과)
- **파일 형식:** JPG 또는 WebP (최적화)
- **컨셉:**
  - 추상적이고 기술적인 배경 (예: 서버 네트워크 시각화, 코드 패턴)
  - 어두운 톤 (그라데이션: 회색~검정)
  - 최소한의 디테일로 텍스트 방해하지 않기

#### Hero Background 2
- **파일명 제안:** `hero-bg-2.jpg`
- **권장 크기:** `1920x1080px` (16:9)
- **컨셉:**
  - API 연결 개념 시각화 (노드와 선으로 연결된 구조)
  - 블루/그레이 톤

#### Hero Background 3
- **파일명 제안:** `hero-bg-3.jpg`
- **권장 크기:** `1920x1080px` (16:9)
- **컨셉:**
  - 데이터 플로우 또는 대시보드 시각화
  - 그린/블랙 톤 (터미널 느낌)

---

### 2. 프로젝트 목록 화면

**위치:** 섹션 2 - 프로젝트 관리 (우측 상단)
**설명:** "직관적인 프로젝트 생성과 관리"

- **파일명 제안:** `feature-project-list.png`
- **권장 크기:** `1024x640px` (16:10 비율)
- **대체 크기:** `800x600px` (4:3)
- **파일 형식:** PNG (UI 스크린샷)
- **컨셉:**
  - 프로젝트 카드 목록이 그리드로 나열된 화면
  - 각 카드에 프로젝트 이름, 멤버 수, 상태 표시
  - 깔끔한 Minimalist 디자인
  - 실제 대시보드 UI 스크린샷 또는 목업

---

### 3. 팀원 초대 UI

**위치:** 섹션 2 - 프로젝트 관리 (우측 하단)
**설명:** "팀원 초대만으로 즉시 협업 시작"

- **파일명 제안:** `feature-team-invite.png`
- **권장 크기:** `1024x640px` (16:10)
- **파일 형식:** PNG
- **컨셉:**
  - 팀원 초대 모달/팝업 UI
  - 이메일 입력 필드, 초대 링크 생성 버튼
  - 현재 팀원 목록 (프로필 사진 + 이름 + 역할)
  - 깔끔한 테이블 또는 리스트 형태

---

### 4. Mock API 설정 화면

**위치:** 섹션 3 - Mock API (좌측 상단)
**설명:** "클릭 한 번으로 모든 응답을 시뮬레이션"

- **파일명 제안:** `feature-mock-api-settings.png`
- **권장 크기:** `1024x640px` (16:10)
- **파일 형식:** PNG
- **컨셉:**
  - Mock API 생성/편집 폼
  - URL 패턴 입력 필드 (예: `/api/users/:id`)
  - HTTP Method 선택 (GET, POST, PUT, DELETE)
  - 응답 코드 선택 (200, 201, 404, 500 등)
  - 깔끔한 폼 디자인

---

### 5. JSON 응답 에디터

**위치:** 섹션 3 - Mock API (좌측 하단)
**설명:** "실제와 똑같은 JSON 데이터 제공"

- **파일명 제안:** `feature-json-editor.png`
- **권장 크기:** `1024x640px` (16:10)
- **파일 형식:** PNG
- **컨셉:**
  - 코드 에디터 UI (Monaco Editor 또는 유사)
  - Syntax highlighting이 적용된 JSON 데이터
  - 라인 넘버 표시
  - 예시 JSON:
    ```json
    {
      "success": true,
      "result": {
        "id": 123,
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
    ```

---

### 6. 서버 상태 카드

**위치:** 섹션 4 - 헬스 체크 (우측 상단)
**설명:** "실시간 상태 변화를 직관적인 색상으로"

- **파일명 제안:** `feature-server-status.png`
- **권장 크기:** `1024x640px` (16:10)
- **파일 형식:** PNG
- **컨셉:**
  - 여러 도메인 서버 카드가 그리드로 배치
  - 각 카드에 상태 인디케이터:
    - 🟢 녹색: 정상 (HEALTHY)
    - 🟡 노란색: 경고 (WARNING)
    - 🔴 빨간색: 실패 (FAILED)
  - 서버 이름, URL, 마지막 체크 시간 표시
  - 카드 스타일: 그림자 효과, 둥근 모서리

---

### 7. 헬스 체크 실패 로그

**위치:** 섹션 4 - 헬스 체크 (우측 하단)
**설명:** "실패 지점까지 상세 로그 추적"

- **파일명 제안:** `feature-health-check-logs.png`
- **권장 크기:** `1024x640px` (16:10)
- **파일 형식:** PNG
- **컨셉:**
  - 테이블 형태의 로그 리스트
  - 컬럼: 시각, 서버명, 응답 코드, 상태, 에러 메시지
  - 실패 항목은 빨간색으로 하이라이트
  - 페이징 UI (커서 기반 페이징 버튼)

---

### 8. 웹훅 설정 UI

**위치:** 섹션 5 - 웹훅 & 슬랙 알림 (좌측 상단)
**설명:** "단순한 웹훅 연동으로 배포 알림 자동화"

- **파일명 제안:** `feature-webhook-settings.png`
- **권장 크기:** `1024x640px` (16:10)
- **파일 형식:** PNG
- **컨셉:**
  - Minimalist 폼 디자인
  - Webhook URL 입력 필드
  - Secret Key 입력 필드 (비밀번호 형태)
  - 저장 버튼
  - 깔끔한 카드 형태 레이아웃

---

### 9. 슬랙 알림 예시

**위치:** 섹션 5 - 웹훅 & 슬랙 알림 (좌측 하단)
**설명:** "팀이 사용하는 곳, 어디든 중요 이벤트 즉시 전송"

- **파일명 제안:** `feature-slack-notification.png`
- **권장 크기:** `800x600px` (4:3 비율)
- **파일 형식:** PNG
- **컨셉:**
  - 실제 슬랙 메시지 카드 디자인
  - 메시지 예시:
    - 제목: "🚀 배포 시작 알림"
    - 내용: "프로젝트 MockOps의 서버 `api.example.com`이 배포를 시작했습니다."
    - 시간: "2024-01-15 14:30:25"
  - 슬랙의 실제 UI 스타일 반영 (회색 배경, 둥근 모서리)

---

## 이미지 최적화 가이드

### 파일 형식 선택
- **JPG/JPEG**: 사진, 복잡한 그라데이션 (Hero 배경)
- **PNG**: UI 스크린샷, 투명 배경 필요 시
- **WebP**: 최신 브라우저 지원, 파일 크기 작음 (권장)

### 압축
- JPG: 80-85% 품질
- PNG: TinyPNG 또는 ImageOptim 사용
- WebP: Squoosh 사용 (75-80% 품질)

### 반응형 대응
- `@2x` 버전 준비 (레티나 디스플레이 대응)
- 예: `hero-bg-1.jpg` → `hero-bg-1@2x.jpg` (3840x2160px)

---

## 이미지 파일 구조 제안

```
public/
└── images/
    └── landing/
        ├── hero/
        │   ├── hero-bg-1.jpg
        │   ├── hero-bg-2.jpg
        │   └── hero-bg-3.jpg
        ├── features/
        │   ├── project-list.png
        │   ├── team-invite.png
        │   ├── mock-api-settings.png
        │   ├── json-editor.png
        │   ├── server-status.png
        │   ├── health-check-logs.png
        │   ├── webhook-settings.png
        │   └── slack-notification.png
        └── placeholder/
            └── (현재 사용 중인 임시 placeholder)
```

---

## 구현 시 참고사항

### Next.js Image 컴포넌트 사용

이미지를 추가할 때는 Next.js의 `<Image />` 컴포넌트를 사용하여 자동 최적화를 활용하세요:

```tsx
import Image from 'next/image';

<Image
  src="/images/landing/features/project-list.png"
  alt="프로젝트 목록 화면"
  width={1024}
  height={640}
  className="border-2 border-gray-300"
  priority={false} // Hero는 true, 나머지는 false
/>
```

### Lazy Loading

Hero Section 이외의 이미지는 자동으로 lazy loading 적용됩니다.

---

## 총 이미지 수

- **Hero 배경**: 3개
- **Feature 스크린샷**: 8개
- **총**: 11개

각 이미지의 최적 크기와 컨셉을 따라 제작하면 랜딩 페이지의 시각적 완성도를 높일 수 있습니다.
