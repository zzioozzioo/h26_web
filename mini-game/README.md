# 🕹️ Retro Tetris Web Game

 **JavaScript와 HTML5로 구현한 웹 브라우저 테트리스 게임입니다.**  

---
## 화면 구성
**1. 게임 시작 화면**

<img width="383" height="499" alt="스크린샷(231)" src="https://github.com/user-attachments/assets/eefa9e25-5009-48ed-8fea-df3491657d99" />

**2. 플레이 화면**

<img width="383" height="560" alt="스크린샷(232)" src="https://github.com/user-attachments/assets/5266dec8-28c2-44ae-87b8-5a96eb15d8ea" />

**3. 콤보 및 레벨업 화면**

<img width="383" height="560" alt="스크린샷(234)" src="https://github.com/user-attachments/assets/9a7d125b-7157-4a9e-81d1-c83f0acc26f9" />


---
## 🚀 주요 기능 (Key Features)

* **🎯 맞춤형 게임 모드 (난이도 & 장애물)**
  * **3단계 난이도**: 하/중/상 선택에 따른 블록 낙하 속도 차등 및 레벨업 시스템
  * **장애물 모드**: 일반 모드 외에 일정 확률로 지진(판 밀어올리기) 및 랜덤 블록이 생성되는 하드코어 모드 지원
* **💾 저장 및 이어하기**
  * 일시정지(`P`) 시 현재 게임판의 2차원 배열 데이터와 점수, 진행 상태를 `localStorage`에 JSON으로 저장
  * 브라우저를 새로고침하거나 나중에 다시 접속해도 기존 플레이와 연동
* **🏆 로컬 랭킹 시스템**
  * 게임 종료 시 유저의 최종 점수를 기존 기록과 비교하여 실시간 갱신
  * 로컬 스토리지 기반으로 상위 5개의 최고 기록 노출
* **👁️ 가이드선 On/Off 토글**
  * 블록이 수직 하강할 착지 지점을 미리 투명하게 보여주는 가이드라인 기능
  * UI 스위치를 통해 실시간으로 켜고 끌 수 있어 유저 편의성 및 게임성 최적화
* **💥 콤보 & 이펙트 효과**
  * 줄 제거 시 화면 흔들림 애니메이션 적용
  * 연속으로 줄 제거 시 화면 중앙에 콤보 알림 토스트 팝업 등장

---

## 🎮 조작 방법

| 키보드 입력 | 기능 설명 |
| :--- | :--- |
| `←` / `→` | 블록 왼쪽 / 오른쪽 이동 |
| `↑` | 블록 90도 회전 |
| `↓` | 소프트 드롭 (한 칸 내리기) |
| `Spacebar` | 하드 드롭 (바닥으로 즉시 떨어뜨리기) |
| `P` | 게임 일시정지 및 현재 상태 자동 저장 |
| `Enter` / `Space` | 대기/게임오버 화면에서 즉시 게임 시작/재시작 |

---

## 🛠️ 기술 스택

* **Frontend**: HTML5 Canvas, CSS3
* **Language**: Vanilla JavaScript (ES6+)
* **Storage**: Web Storage API (`localStorage`)
