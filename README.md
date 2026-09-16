# ⏳ 시간의 틈 (Gap of Time)

> **"캘린더-시간표 일체형 스케줄러, 가중치 우선순위 계산기 & Gemini AI 학습 코치"**

---

## 📌 프로젝트 개요
- **서비스명:** 시간의 틈 (Gap of Time)
- **주요 목적:** 단순 시간표 및 일정 기록을 넘어, 캘린더 동기화·성적 반영 비율 가중치 계산·학습 스프린트 타이머·Gemini AI 코칭을 결합하여 학생들의 스케줄 관리 효율성을 극대화합니다.
- **배포 구성:** `index.html`, `style.css`, `README.md` (3개 핵심 파일 구조)

---

## 💡 주요 기능 및 특장점

### 1. 📅 캘린더 & 시간표 완벽 통합 (Calendar-Timetable Hybrid)
- **날짜별 시간표 동기화:** 캘린더 날짜 이동 시 해당 주차의 요일/날짜가 시간표 헤더에 자동으로 계산되어 표시됩니다.
- **수행평가 D-Day 자동 배지:** 등록된 수행평가의 마감 날짜 및 과목이 시간표의 해당 요일/교시 셀에 `🔥 [반영비율%] 내용` 태그로 자동 표출됩니다.

### 2. ⚖️ 성적 반영 비율(Grade Weighting) 우선순위 계산기
- **우선순위 산출 공식:** $\text{Priority Score} = \frac{\text{성적 반영 비율 (\%)}}{\text{남은 일수 (Days Left)} + 1}$
- 단순 날짜순 정렬이 아닌, **시간 대비 성적 가치가 가장 높은 수행평가**를 최상단에 자동으로 배치해 줍니다.

### 3. ⏱️ 뽀모도로(Pomodoro) 25분 몰입 타이머
- 마감 임박 또는 고가중치 수행평가를 선택한 후 **25분 공부 + 5분 휴식** 스프린트를 실행할 수 있습니다.
- 타임아웃 시 Web Audio API 경고음이 울립니다.

### 4. 📤 친구 간 반 전체 스케줄 공유 (JSON Code Sharing)
- 단 한 번의 클릭으로 내 시간표와 수행평가 목록을 **암호화된 문자열 코드**로 내보내거나(Export), 친구의 코드를 복사해 불러올 수(Import) 있습니다.

### 5. 🤖 Google Gemini AI 모델 직접 연동 (`gemini-1.5-flash`)
- Google AI Studio의 Gemini API 키를 저장하여 수행평가 주제 탐구, 보고서 개요 및 발표 대본을 매번 새롭게 도움받습니다.

### 🌓 라이트 / 다크 모드 지원
- CSS Variable 기반 다크 모드 토글을 지원하여 야간 학습 시 눈의 피로도를 최소화합니다.

---

## 🛠️ 기술 스택 (Tech Stack)
- **Frontend:** HTML5, CSS3 (Custom CSS Variables), JavaScript (Vanilla JS ES6+)
- **AI Engine:** Google Gemini API (`gemini-1.5-flash`)
- **Data Architecture:** Browser LocalStorage, Base64 JSON Data Encoding
- **Audio:** Web Audio API Frequency Synthesizer
- **Hosting:** GitHub Pages
