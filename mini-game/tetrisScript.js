// --- 1. 게임 설정 및 전역 변수 ---
        const canvas = document.getElementById("tetrisCanvas");
        const ctx = canvas.getContext("2d");

        const nextCanvas = document.getElementById("nextCanvas");
        const nextCtx = nextCanvas.getContext("2d");

        const BLOCK_SIZE = 24; 
        const ROWS = 20;       
        const COLS = 10;       

        const SHAPES = {
            'I': [[1,1,1,1]],
            'J': [[1,0,0],[1,1,1]],
            'L': [[0,0,1],[1,1,1]],
            'O': [[1,1],[1,1]],
            'S': [[0,1,1],[1,1,0]],
            'T': [[0,1,0],[1,1,1]],
            'Z': [[1,1,0],[0,1,1]]
        };

        const COLORS = {
            'I': '#00f0f0', 'J': '#0000f0', 'L': '#f0a000',
            'O': '#f0f000', 'S': '#00f000', 'T': '#a000f0', 'Z': '#f00000'
        };

        let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

        let currentPiece = { shape: null, color: '', x: 0, y: 0 };
        let nextPiece = { shape: null, color: '' };

        let score = 0;
        let isPaused = false;
        let isGameOver = true; 
        let gameInterval;
        let dropCounter = 0;
        let lastTime = 0;
        let level = 1;
        const MAX_LEVEL = 10;
        let dropInterval = 1000; 

        // 게임 설정 옵션 변수
        let currentDifficulty = '중';
        let currentObstacleMode = '일반';

        // UI 요소
        const scoreDisplay = document.getElementById("current-score");
        const statusDisplay = document.getElementById("game-status");
        const rankingList = document.getElementById("ranking-list");
        const btnContinue = document.getElementById("btn-continue");
        const btnStartContinue = document.getElementById("btn-start-continue"); 
        const btnPause = document.getElementById("btn-pause");
        const selectDifficulty = document.getElementById("select-difficulty");
        const selectObstacle = document.getElementById("select-obstacle");
        const startScreen = document.getElementById("start-screen");

        // --- 2. 초기화 및 이벤트 등록 ---
        window.onload = function() {
            updateRankingUI();
            checkSavedGame();

            document.addEventListener("keydown", handleKeyDown);
            btnPause.addEventListener("click", function(e) {
                togglePause();
                this.blur(); 
            });
            btnContinue.addEventListener("click", function(e) {
                loadGame();
                this.blur(); 
            });
            
            draw();
        };

        function pressStartGame(e) {
            if (e && e.target) e.target.blur();
            startScreen.classList.remove("show"); 
            initGame();
        }

        function showStartScreen(e) {
            if (e && e.target) e.target.blur();
            cancelAnimationFrame(gameInterval);
            isGameOver = true;
            document.getElementById("gameover-screen").classList.remove("show");
            startScreen.classList.add("show");
            statusDisplay.innerText = "게임 대기 중";
            checkSavedGame(); 
        }

        // --- [신규 추가] 게임 화면 우측에 상태 하이라이트를 업데이트 해주는 함수 ---
        function updateStatusHighlightUI() {
            // 난이도 하이라이트 제어
            document.querySelectorAll("[data-diff]").forEach(el => {
                if (el.getAttribute("data-diff") === currentDifficulty) {
                    el.classList.add("active");
                } else {
                    el.classList.remove("active");
                }
            });

            // 장애물 모드 하이라이트 제어
            document.querySelectorAll("[data-obs]").forEach(el => {
                if (el.getAttribute("data-obs") === currentObstacleMode) {
                    el.classList.add("active");
                } else {
                    el.classList.remove("active");
                }
            });
        }

        function initGame() {
            cancelAnimationFrame(gameInterval); 
            
            currentDifficulty = selectDifficulty.value;
            currentObstacleMode = selectObstacle.value;

            // 게임 시작 시 상태창 업데이트 적용
            updateStatusHighlightUI();

            board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
            score = 0;
            level = 1;         
            
            if (currentDifficulty === '하') dropInterval = 1200;
            else if (currentDifficulty === '상') dropInterval = 600;
            else dropInterval = 1000; 

            dropCounter = 0;
            isPaused = false;
            isGameOver = false; 

            scoreDisplay.innerText = score;
            document.getElementById("current-level").innerText = level; 
            statusDisplay.innerText = "게임 중";
            statusDisplay.style.color = "#ffeb3b";
            
            document.getElementById("levelup-alert").classList.remove("show");
            document.getElementById("gameover-screen").classList.remove("show");
            btnPause.disabled = false;
            btnPause.innerText = "일시정지 (저장)";

            setNextPiece();
            createNewPiece();
            
            lastTime = performance.now(); 
            gameInterval = requestAnimationFrame(gameLoop);
        }

        // --- 3. 메인 게임 루프 ---
        function gameLoop(time = 0) {
            if (isPaused || isGameOver) return;

            const deltaTime = time - lastTime;
            lastTime = time;

            dropCounter += deltaTime;
            if (dropCounter > dropInterval) {
                moveDown(); 
            }

            draw();
            gameInterval = requestAnimationFrame(gameLoop);
        }

        // --- 4. 블록 생성 및 이동 로직 ---
        function setNextPiece() {
            const types = ['I','J','L','O','S','T','Z'];
            const randomType = types[Math.floor(Math.random() * types.length)];
            nextPiece.shape = SHAPES[randomType];
            nextPiece.color = COLORS[randomType];
        }

        function createNewPiece() {
            currentPiece.shape = nextPiece.shape;
            currentPiece.color = nextPiece.color;
            
            currentPiece.x = Math.floor((COLS - currentPiece.shape[0].length) / 2);
            currentPiece.y = 0;

            setNextPiece();

            if (checkCollision(currentPiece.x, currentPiece.y, currentPiece.shape)) {
                gameOver();
            }
        }

        function moveLeft() {
            if (!checkCollision(currentPiece.x - 1, currentPiece.y, currentPiece.shape)) {
                currentPiece.x--;
            }
        }

        function moveRight() {
            if (!checkCollision(currentPiece.x + 1, currentPiece.y, currentPiece.shape)) {
                currentPiece.x++;
            }
        }

        function moveDown() {
            if (isGameOver) return;
            if (!checkCollision(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
                currentPiece.y++;
                dropCounter = 0;
            } else {
                lockPiece();
                clearLines();
                
                if (currentObstacleMode === '장애물') {
                    triggerObstacleSystem();
                }

                createNewPiece();
            }
        }

        function hardDrop() {
            while (!checkCollision(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
                currentPiece.y++;
            }
            moveDown();
        }

        function rotatePiece() {
            const r = currentPiece.shape.length;
            const c = currentPiece.shape[0].length;
            const rotated = Array.from({ length: c }, () => Array(r).fill(0));
            
            for (let y = 0; y < r; y++) {
                for (let x = 0; x < c; x++) {
                    rotated[x][r - 1 - y] = currentPiece.shape[y][x];
                }
            }
            
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

        // --- 5. 충돌 감지 및 라인 삭제 ---
        function checkCollision(nextX, nextY, shape) {
            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) { 
                        const boardX = nextX + x;
                        const boardY = nextY + y;

                        if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                            return true;
                        }
                        if (boardY >= 0 && board[boardY][boardX] !== 0) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

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

        function clearLines() {
            let linesCleared = 0;
            for (let y = ROWS - 1; y >= 0; y--) {
                if (board[y].every(value => value !== 0)) {
                    board.splice(y, 1); 
                    board.unshift(Array(COLS).fill(0)); 
                    linesCleared++;
                    y++; 
                }
            }

            if (linesCleared > 0) {
                const scoreTable = [0, 100, 300, 500, 800];
                score += scoreTable[linesCleared] || 1000;
                scoreDisplay.innerText = score;
                updateLevelAndSpeed();
            }
        }

        function updateLevelAndSpeed() {
            let calculatedLevel = Math.floor(score / 500) + 1;
            if (calculatedLevel > MAX_LEVEL) calculatedLevel = MAX_LEVEL;

            if (calculatedLevel !== level) {
                level = calculatedLevel;
                document.getElementById("current-level").innerText = level;

                if (currentDifficulty === '하') {
                    dropInterval = 1200 - (level - 1) * 80;
                } else if (currentDifficulty === '상') {
                    dropInterval = 600 - (level - 1) * 50;
                } else {
                    dropInterval = 1000 - (level - 1) * 100;
                }

                const popUp = document.getElementById("levelup-alert");
                document.getElementById("pop-level").innerText = level;
                popUp.classList.add("show");

                setTimeout(() => {
                    popUp.classList.remove("show");
                }, 1000);
            }
        }

        function triggerObstacleSystem() {
            if (Math.random() < 0.20) {
                if (Math.random() < 0.50) {
                    board.shift(); 
                    let earthquakeRow = Array(COLS).fill('#555555');
                    let holeCount = Math.floor(Math.random() * 2) + 1;
                    for(let h=0; h<holeCount; h++) {
                        let randX = Math.floor(Math.random() * COLS);
                        earthquakeRow[randX] = 0;
                    }
                    board.push(earthquakeRow);
                } else {
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

        // --- 6. 화면 그리기 (Render) ---
        function draw() {
            ctx.fillStyle = "#111";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = "rgba(255, 255, 255, 0.06)"; // 은은한 격자 선 색상 (투명도 0.06)
            ctx.lineWidth = 1; // 선 두께

            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            }

            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    if (board[y][x]) {
                        drawBlock(ctx, x, y, board[y][x]);
                    }
                }
            }

            if (currentPiece.shape && !isGameOver) {
                for (let y = 0; y < currentPiece.shape.length; y++) {
                    for (let x = 0; x < currentPiece.shape[y].length; x++) {
                        if (currentPiece.shape[y][x]) {
                            drawBlock(ctx, currentPiece.x + x, currentPiece.y + y, currentPiece.color);
                        }
                    }
                }
            }

            drawNextPiece();
        }

        function drawBlock(context, x, y, color) {
            context.fillStyle = color;
            context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            context.strokeStyle = "#222";
            context.lineWidth = 1;
            context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }

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

        // --- 7. 입력 및 시스템 제어 ---
        function handleKeyDown(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                return;
            }

            if (e.key === 'p' || e.key === 'P') {
                togglePause();
                return;
            }

            if (isPaused || isGameOver) return;

            switch(e.key) {
                case "ArrowLeft":  moveLeft(); break;
                case "ArrowRight": moveRight(); break;
                case "ArrowDown":  moveDown(); break;
                case "ArrowUp":    rotatePiece(); break;
                case " ":          hardDrop(); e.preventDefault(); break; 
            }
            draw();
        }

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

        // --- 8. 일시정지 및 세이브기능 ---
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

        function saveGame() {
            const gameState = {
                board: board,
                currentPiece: currentPiece,
                nextPiece: nextPiece, 
                score: score,
                level: level,
                currentDifficulty: currentDifficulty,   
                currentObstacleMode: currentObstacleMode 
            };
            localStorage.setItem("savedTetrisGame", JSON.stringify(gameState));
            checkSavedGame();
        }

        // --- [수정] 게임 로드(세이브 불러오기) 시에도 UI가 연동되도록 수정 ---
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
            selectDifficulty.value = currentDifficulty;
            selectObstacle.value = currentObstacleMode;

            // 저장 데이터 로드 시 상태창 하이라이트 적용
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

        function checkSavedGame() {
            const savedData = localStorage.getItem("savedTetrisGame");
            btnContinue.disabled = !savedData;
            btnStartContinue.disabled = !savedData;
        }

        // --- 9. 랭킹 관리 ---
        function saveScoreToRanking(finalScore) {
            if (finalScore === 0) return;
            let ranking = JSON.parse(localStorage.getItem("tetrisRanking")) || [];
            ranking.push(finalScore);
            ranking.sort((a, b) => b - a);
            ranking = ranking.slice(0, 5);
            localStorage.setItem("tetrisRanking", JSON.stringify(ranking));
            updateRankingUI();
        }

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