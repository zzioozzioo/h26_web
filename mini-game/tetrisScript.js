// ==========================================
// 1. 게임 화면 크기 및 블록 모양 설정
// ==========================================
const canvas = document.getElementById("tetrisCanvas");
const ctx = canvas.getContext("2d");

const nextCanvas = document.getElementById("nextCanvas");
const nextCtx = nextCanvas.getContext("2d");

const BLOCK_SIZE = 24; // 블록 한 칸의 픽셀 크기
const ROWS = 20;       // 게임판 세로 줄 수
const COLS = 10;       // 게임판 가로 칸 수

// 블록 모양 (1: 채워진 칸, 0: 빈 공간)
const SHAPES = {
    'I': [[1,1,1,1]],
    'J': [[1,0,0],[1,1,1]],
    'L': [[0,0,1],[1,1,1]],
    'O': [[1,1],[1,1]],
    'S': [[0,1,1],[1,1,0]],
    'T': [[0,1,0],[1,1,1]],
    'Z': [[1,1,0],[0,1,1]]
};

// 블록별 색상
const COLORS = {
    'I': '#00f0f0', 'J': '#0000f0', 'L': '#f0a000',
    'O': '#f0f000', 'S': '#00f000', 'T': '#a000f0', 'Z': '#f00000'
};

// ==========================================
// 2. 게임 중 업데이트되는 데이터
// ==========================================
// 20x10 게임판 배열 
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

// 현재 블록과 다음 블록 정보
let currentPiece = { shape: null, color: '', x: 0, y: 0 };
let nextPiece = { shape: null, color: '' };

// 점수, 난이도, 속도 조절용 변수
let score = 0;
let isPaused = false;
let isGameOver = true;   // 게임 시작 전에는 대기 상태로 둠
let gameInterval;        // 화면 실시간 새로고침 타이머 ID
let dropCounter = 0;     // 아래로 떨어지기 전까지 누적되는 시간 (ms)
let lastTime = 0;        // 직전 화면을 그렸던 시각
let level = 1;
const MAX_LEVEL = 10;
let dropInterval = 1000; // 블록 한 칸 떨어지는 시간 (기본: 1초)

// 블록 제거 시 이펙트 관련 변수
let clearingRows = [];
let clearAnimationTimer = 0;

// 난이도 및 모드 설정 데이터
let currentDifficulty = '중';
let currentObstacleMode = '일반';
let showGhostMode = true;

// HTML 화면 요소들 가져오기
const ghostToggle = document.getElementById("ghost-toggle");
const scoreDisplay = document.getElementById("current-score");
const statusDisplay = document.getElementById("game-status");
const rankingList = document.getElementById("ranking-list");
const btnContinue = document.getElementById("btn-continue");
const btnStartContinue = document.getElementById("btn-start-continue"); 
const btnPause = document.getElementById("btn-pause");
const selectDifficulty = document.getElementById("select-difficulty");
const selectObstacle = document.getElementById("select-obstacle");
const startScreen = document.getElementById("start-screen");

// ==========================================
// 3. 첫 화면 로드 및 버튼 클릭 이벤트 세팅
// ==========================================
window.onload = function() {
    updateRankingUI(); // 저장된 점수 랭킹 표시
    checkSavedGame();  // 이어서 하기 버튼 활성화 확인 (세이브 파일 유무 검사)

    document.addEventListener("keydown", handleKeyDown); // 키보드 누르면 이동
    
    btnPause.addEventListener("click", function(e) {
        togglePause();
        this.blur(); 
    });
    
    btnContinue.addEventListener("click", function(e) {
        loadGame();
        this.blur(); 
    });
    
    draw(); // 게임판 기본 화면 그리기
};

// 게임 시작 버튼을 눌렀을 때
function pressStartGame(e) {
    if (e && e.target) e.target.blur();
    startScreen.classList.remove("show"); 
    initGame();
}

// 게임 오버 후 대기 화면으로 되돌아가기
function showStartScreen(e) {
    if (e && e.target) e.target.blur();
    cancelAnimationFrame(gameInterval);
    isGameOver = true;
    document.getElementById("gameover-screen").classList.remove("show");
    startScreen.classList.add("show");
    statusDisplay.innerText = "게임 대기 중";
    statusDisplay.style.color = "";
    checkSavedGame(); 
}

// 선택한 난이도/모드 버튼 하이라이팅
function updateStatusHighlightUI() {
    document.querySelectorAll("[data-diff]").forEach(el => {
        if (el.getAttribute("data-diff") === currentDifficulty) {
            el.classList.add("active");
        } else {
            el.classList.remove("active");
        }
    });

    document.querySelectorAll("[data-obs]").forEach(el => {
        if (el.getAttribute("data-obs") === currentObstacleMode) {
            el.classList.add("active");
        } else {
            el.classList.remove("active");
        }
    });
}

// ==========================================
// 4. 게임 시작 및 메인 실시간 루프
// ==========================================
// 게임 시작 시 데이터 초기화
function initGame() {
    cancelAnimationFrame(gameInterval); 
    
    currentDifficulty = selectDifficulty.value;
    currentObstacleMode = selectObstacle.value;

    updateStatusHighlightUI();

    // 게임판 초기화 및 변수 리셋
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    score = 0;
    level = 1;    
    clearingRows = [];
    clearAnimationTimer = 0;
    
    // 난이도별 떨어지는 기본 속도 설정
    if (currentDifficulty === '하') dropInterval = 1200;
    else if (currentDifficulty === '상') dropInterval = 600;
    else dropInterval = 1000; 

    dropCounter = 0;
    isPaused = false;
    isGameOver = false; 

    // 화면 점수판 글자 초기화
    scoreDisplay.innerText = score;
    document.getElementById("current-level").innerText = level; 
    statusDisplay.innerText = "게임 중";
    statusDisplay.style.color = "#ffeb3b";
    
    document.getElementById("levelup-alert").classList.remove("show");
    document.getElementById("gameover-screen").classList.remove("show");
    btnPause.disabled = false;
    btnPause.innerText = "일시정지 (저장)";

    setNextPiece();   // 다음 블록 생성
    createNewPiece(); // 현재 블록 생성
    
    lastTime = performance.now(); 
    gameInterval = requestAnimationFrame(gameLoop);
}

// 게임 화면 실시간 업데이트 및 블록을 떨어뜨리기
function gameLoop(time = 0) {
    if (isPaused || isGameOver) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    // 블록 제거 중일 때 이펙트
    if (clearAnimationTimer > 0) {
        clearAnimationTimer--;
        if (clearAnimationTimer === 0) {
            executeLineClear(); // 이펙트 끝나면 블록 삭제
            if (currentObstacleMode === '장애물') {
                triggerObstacleSystem(); // 장애물 모드면 방해 블록 생성 검사
            }
            createNewPiece(); // 다음 블록 등장
        }
    } else {
        // 일반 플레이 상태: 시간이 흐르면 블록을 아래로 한 칸 내림
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            moveDown(); 
        }
    }

    draw();
    gameInterval = requestAnimationFrame(gameLoop);
}

// ==========================================
// 5. 블록 생성 및 움직임 조작
// ==========================================
// 랜덤으로 다음 대기 블록 선택
function setNextPiece() {
    const types = ['I','J','L','O','S','T','Z'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    nextPiece.shape = SHAPES[randomType];
    nextPiece.color = COLORS[randomType];
}

// 다음 블록을 현재 블록으로 설정, 화면 정중앙 맨 위에 위치
function createNewPiece() {
    currentPiece.shape = nextPiece.shape;
    currentPiece.color = nextPiece.color;
    
    // 블록 크기에 맞춰서 가운데 위치 계산
    currentPiece.x = Math.floor((COLS - currentPiece.shape[0].length) / 2);
    currentPiece.y = 0;

    setNextPiece(); // 그 다음 블록 미리 설정

    // 블록 생성되자마자 충돌 -> 게임오버 
    if (checkCollision(currentPiece.x, currentPiece.y, currentPiece.shape)) {
        gameOver();
    }
}

// 왼쪽 이동
function moveLeft() {
    if (!checkCollision(currentPiece.x - 1, currentPiece.y, currentPiece.shape)) {
        currentPiece.x--;
    }
}

// 오른쪽 이동
function moveRight() {
    if (!checkCollision(currentPiece.x + 1, currentPiece.y, currentPiece.shape)) {
        currentPiece.x++;
    }
}

// 아래로 한 칸 내리기 (아래 방향키 클릭 or 시간 지나면)
function moveDown() {
    if (isGameOver) return;
    if (!checkCollision(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
        currentPiece.y++;
        dropCounter = 0;
    } else {
        lockPiece();
        clearLines();
        
        if (clearingRows.length === 0) {
            if (currentObstacleMode === '장애물') {
                triggerObstacleSystem();
            }
            createNewPiece();
        }
    }
}

// 스페이스바 -> 블록 한번에 내리기
function hardDrop() {
    while (!checkCollision(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
        currentPiece.y++;
    }
    moveDown();
}

// 블록 방향 전환
function rotatePiece() {
    const r = currentPiece.shape.length;
    const c = currentPiece.shape[0].length;
    const rotated = Array.from({ length: c }, () => Array(r).fill(0));
    
    // 2차원 배열 오른쪽으로 90도 회전
    for (let y = 0; y < r; y++) {
        for (let x = 0; x < c; x++) {
            rotated[x][r - 1 - y] = currentPiece.shape[y][x];
        }
    }
    
    // 회전 시 벽이나 다른 블록에 끼이면 양옆으로 피해 갈 수 있는지 체크할 범위
    const offsets = [0, -1, 1, -2, 2];
    
    for (let i = 0; i < offsets.length; i++) {
        const testX = currentPiece.x + offsets[i];
        if (!checkCollision(testX, currentPiece.y, rotated)) {
            currentPiece.x = testX;
            currentPiece.shape = rotated;
            break;
        }
    }
}

// 충돌 검사 
function checkCollision(nextX, nextY, shape) {
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) { 
                const boardX = nextX + x;
                const boardY = nextY + y;

                // 게임판 왼쪽, 오른쪽, 아래 바닥 선을 넘었는지 확인
                if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                    return true;
                }
                // 빈 칸(0)이 아니고 이미 다른 블록 색상이 칠해져 있는지 확인
                if (boardY >= 0 && board[boardY][boardX] !== 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 움직이던 블록을 게임판 배열 데이터에 영구적으로 고정
function lockPiece() {
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
                if (currentPiece.y + y >= 0) {
                    board[currentPiece.y + y][currentPiece.x + x] = currentPiece.color;
                }
            }
        }
    }
}

// ==========================================
// 6. 줄 지우기 및 장애물(방해 블록) 시스템
// ==========================================
// 제거할 줄 대상으로 이펙트 및 점수 계산
function clearLines() {
    let linesCleared = 0;
    clearingRows = [];

    for (let y = 0; y < ROWS; y++) {
        if (board[y].every(value => value !== 0)) {
            clearingRows.push(y); // 지워질 세로 줄 번호 저장
            linesCleared++;
        }
    }

    if (linesCleared > 0) {
        clearAnimationTimer = 12;

        // 동시에 지운 줄 수에 따라 점수 주기
        const scoreTable = [0, 100, 300, 500, 800];
        score += scoreTable[linesCleared] || 1000;
        scoreDisplay.innerText = score;
        updateLevelAndSpeed(); // 레벨업 검사
        
        // 한 번에 여러 줄 제거 -> 콤보 알림 팝업 띄우기
        if (linesCleared >= 2) {
            const comboAlert = document.getElementById("combo-alert");
            document.getElementById("pop-combo").innerText = linesCleared;
            comboAlert.classList.add("show");
            setTimeout(() => {
                comboAlert.classList.remove("show");
            }, 500); 
        }

        // 줄 제거 시 게임판 화면 지진 효과
        const boardWrapper = document.querySelector(".board-wrapper");
        boardWrapper.classList.add("shake");
        setTimeout(() => boardWrapper.classList.remove("shake"), 150);
    }
}

// 줄 제거 후 맨 위에 새로운 빈 줄 추가
function executeLineClear() {
    clearingRows.sort((a, b) => a - b); 
    for (let i = 0; i < clearingRows.length; i++) {
        let y = clearingRows[i];
        board.splice(y, 1); // 해당 줄 삭제
        board.unshift(Array(COLS).fill(0)); // 맨 위에 빈 줄 추가
    }
    clearingRows = []; 
}

// 레벨업 및 속도 향상
function updateLevelAndSpeed() {
    let calculatedLevel = Math.floor(score / 500) + 1;
    if (calculatedLevel > MAX_LEVEL) calculatedLevel = MAX_LEVEL;

    if (calculatedLevel !== level) {
        level = calculatedLevel;
        document.getElementById("current-level").innerText = level;

        // 난이도별로 레벨업 시 속도 향상 조절
        if (currentDifficulty === '하') {
            dropInterval = 1200 - (level - 1) * 80;
        } else if (currentDifficulty === '상') {
            dropInterval = 600 - (level - 1) * 50;
        } else {
            dropInterval = 1000 - (level - 1) * 60;
        }

        // 레벨업 알림 팝업
        const popUp = document.getElementById("levelup-alert");
        document.getElementById("pop-level").innerText = level;
        popUp.classList.add("show");

        setTimeout(() => {
            popUp.classList.remove("show");
        }, 1000);
    }
}

// 장애물(방해 블록) 시스템 (지진 효과 또는 랜덤 블록 생성)
function triggerObstacleSystem() {
    if (Math.random() < 0.20) {
        if (Math.random() < 0.50) {
            // 1. 지진: 모든 블록을 위로 한 칸씩 밀어 올리고, 맨 밑에 구멍 뚫린 회색 방해 줄 추가
            board.shift(); 
            let earthquakeRow = Array(COLS).fill('#555555');
            let holeCount = Math.floor(Math.random() * 2) + 1;
            for(let h=0; h<holeCount; h++) {
                let randX = Math.floor(Math.random() * COLS);
                earthquakeRow[randX] = 0;
            }
            board.push(earthquakeRow);
        } else {
            // 2. 랜덤 드롭: 바닥 근처 8줄 중에서 비어있는 칸에 무작위로 회색 방해 블록 생성
            let blocksToCreate = Math.floor(Math.random() * 3) + 1; 
            let emptySpots = [];

            for (let y = ROWS - 8; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    if (board[y][x] === 0) {
                        emptySpots.push({x: x, y: y});
                    }
                }
            }

            for (let i = 0; i < blocksToCreate; i++) {
                if (emptySpots.length === 0) break;
                let randomIndex = Math.floor(Math.random() * emptySpots.length);
                let spot = emptySpots.splice(randomIndex, 1)[0];
                board[spot.y][spot.x] = '#555555'; 
            }
        }
    }
}

// ==========================================
// 7. 화면에 그리기
// ==========================================
// 화면 초기화 및 블록들을 순서대로 새로 그리는 함수
function draw() {
    // 배경 
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 배경에 바둑판 모양 격자선
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1; 
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
    }

    // 1. 이미 쌓은 블록 그리기
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                drawBlock(ctx, x, y, board[y][x]);
            }
        }
    }

    // 2. 블록 착지 예상 위치에 가이드선 그리기
    if (showGhostMode && currentPiece.shape && !isGameOver) {
        let ghostY = currentPiece.y;
        while (!checkCollision(currentPiece.x, ghostY + 1, currentPiece.shape)) {
            ghostY++;
        }
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x]) {
                    ctx.fillStyle = "rgba(255, 255, 255, 0.05)"; 
                    ctx.fillRect((currentPiece.x + x) * BLOCK_SIZE, (ghostY + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.strokeStyle = currentPiece.color; 
                    ctx.lineWidth = 1;
                    ctx.strokeRect((currentPiece.x + x) * BLOCK_SIZE, (ghostY + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }
    }

    // 3. 현재 움직이는 블록 그리기
    if (currentPiece.shape && !isGameOver) {
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x]) {
                    drawBlock(ctx, currentPiece.x + x, currentPiece.y + y, currentPiece.color);
                }
            }
        }
    }

    // 4. 줄 제거 시 이펙트 그리기
    if (clearAnimationTimer > 0 && clearingRows.length > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${clearAnimationTimer / 12})`;
        for (let i = 0; i < clearingRows.length; i++) {
            let y = clearingRows[i];
            ctx.fillRect(0, y * BLOCK_SIZE, canvas.width, BLOCK_SIZE);
        }
    }

    // 오른쪽 사이드바에 다음 블록 업데이트
    drawNextPiece();
}

// 네모 한 칸 그리는 공통 함수
function drawBlock(context, x, y, color) {
    context.fillStyle = color;
    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    context.strokeStyle = "#222";
    context.lineWidth = 1;
    context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

// 오른쪽 사이드바에 다음 블록 그리기
function drawNextPiece() {
    nextCtx.fillStyle = "#111";
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (!nextPiece.shape) return;

    const shapeRows = nextPiece.shape.length;
    const shapeCols = nextPiece.shape[0].length;
    
    const offsetX = Math.floor((4 - shapeCols) / 2);
    const offsetY = Math.floor((4 - shapeRows) / 2);

    for (let y = 0; y < shapeRows; y++) {
        for (let x = 0; x < shapeCols; x++) {
            if (nextPiece.shape[y][x]) {
                drawBlock(nextCtx, x + offsetX, y + offsetY, nextPiece.color);
            }
        }
    }
}

// ==========================================
// 8. 키보드 입력 처리
// ==========================================
function handleKeyDown(e) {
    // 대기 화면이나 게임오버 화면에서 엔터/스페이스바 누르면 바로 시작하도록 처리
    if (e.key === 'Enter' || e.key === ' ') {
        if (isGameOver) {
            const gameoverScreen = document.getElementById("gameover-screen");
            if (gameoverScreen.classList.contains("show")) {
                e.preventDefault();
                showStartScreen(e);
                return;
            }
            if (startScreen.classList.contains("show")) {
                e.preventDefault();
                pressStartGame(e);
                return;
            }
        }
    }

    if (e.key === 'Enter') {
        e.preventDefault();
        return;
    }

    // 알파벳 P 키 누르면 일시정지 및 자동 저장
    if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
    }

    if (isPaused || isGameOver) return;

    // 게임 진행 중 키 조작
    switch(e.key) {
        case "ArrowLeft":  moveLeft(); break;   // 왼쪽 이동
        case "ArrowRight": moveRight(); break;  // 오른쪽 이동
        case "ArrowDown":  moveDown(); break;   // 소프트 드롭 (한 칸 내리기)
        case "ArrowUp":    rotatePiece(); break;// 블록 회전
        case " ":          hardDrop(); e.preventDefault(); break; // 하드 드롭(전체 내리기)
    }
    draw();
}

// ==========================================
// 9. 브라우저 저장소 연동 (게임 저장/불러오기/랭킹)
// ==========================================
// 게임 오버 시 실행되는 함수
function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(gameInterval); 

    statusDisplay.innerText = "게임 오버!";
    statusDisplay.style.color = "#f44336";
    btnPause.disabled = true; 

    document.getElementById("final-score-text").innerText = score;
    document.getElementById("gameover-screen").classList.add("show");

    saveScoreToRanking(score);
    localStorage.removeItem("savedTetrisGame");
    checkSavedGame();
}

// 일시정지 버튼 켜고 끌 때 처리
function togglePause() {
    if (isGameOver) return;

    isPaused = !isPaused;
    if (isPaused) {
        btnPause.innerText = "게임 재개";
        statusDisplay.innerText = "일시 정지 (저장됨)";
        statusDisplay.style.color = "#ff9800";
        saveGame();
    } else {
        btnPause.innerText = "일시정지 (저장)";
        statusDisplay.innerText = "게임 중";
        statusDisplay.style.color = "#ffeb3b";
        lastTime = performance.now();
        gameLoop();
    }
}

// 현재 게임 상태 로컬스토리지에 저장
function saveGame() {
    const gameState = {
        board: board,
        currentPiece: currentPiece,
        nextPiece: nextPiece, 
        score: score,
        level: level,
        currentDifficulty: currentDifficulty,   
        currentObstacleMode: currentObstacleMode,
        showGhostMode: showGhostMode
    };
    localStorage.setItem("savedTetrisGame", JSON.stringify(gameState));
    checkSavedGame();
}

// 로컬스토리지에 저장해둔 세이브 데이터를 다시 읽어서 원래 게임 상태 객체로 복원
function loadGame() {
    const savedData = localStorage.getItem("savedTetrisGame");
    if (!savedData) return;

    const state = JSON.parse(savedData);
    board = state.board;
    currentPiece = state.currentPiece;
    nextPiece = state.nextPiece || { shape: null, color: '' }; 
    score = state.score;
    level = state.level || 1;
    
    currentDifficulty = state.currentDifficulty || '중';
    currentObstacleMode = state.currentObstacleMode || '일반';

    showGhostMode = state.showGhostMode !== undefined ? state.showGhostMode : true;
    ghostToggle.checked = showGhostMode;

    selectDifficulty.value = currentDifficulty;
    selectObstacle.value = currentObstacleMode;

    updateStatusHighlightUI();
    startScreen.classList.remove("show");

    scoreDisplay.innerText = score;
    document.getElementById("current-level").innerText = level;
    updateLevelAndSpeed();

    isPaused = false;
    isGameOver = false;

    btnPause.disabled = false;
    btnPause.innerText = "일시정지 (저장)";
    statusDisplay.innerText = "게임 중";
    statusDisplay.style.color = "#ffeb3b";

    localStorage.removeItem("savedTetrisGame");
    checkSavedGame();

    lastTime = performance.now();
    gameLoop();
}

// 저장된 게임 데이터가 로컬스토리지에 존재 -> 화면의 '이어서 하기' 버튼을 활성화
function checkSavedGame() {
    const savedData = localStorage.getItem("savedTetrisGame");
    btnContinue.disabled = !savedData;
    btnStartContinue.disabled = !savedData;
}

// 게임 종료 시 점수 기록 및 TOP5 랭킹 업데이트
function saveScoreToRanking(finalScore) {
    if (finalScore === 0) return;
    let ranking = JSON.parse(localStorage.getItem("tetrisRanking")) || [];
    ranking.push(finalScore);
    ranking.sort((a, b) => b - a);
    ranking = ranking.slice(0, 5); 
    localStorage.setItem("tetrisRanking", JSON.stringify(ranking));
    updateRankingUI();
}

// 업데이트된 TOP5 랭킹을 화면에 표시
function updateRankingUI() {
    let ranking = JSON.parse(localStorage.getItem("tetrisRanking")) || [];
    rankingList.innerHTML = "";
    if (ranking.length === 0) {
        rankingList.innerHTML = "<span style='color:#aaa; font-size:14px;'>기록 없음</span>";
        return;
    }
    ranking.forEach((score) => {
        const li = document.createElement("li");
        li.innerText = `${score} 점`;
        rankingList.appendChild(li);
    });
}

ghostToggle.addEventListener("change", (e) => {
    showGhostMode = e.target.checked;
});