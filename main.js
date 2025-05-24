/**
 * 棋盘配置
 * rows/cols: 棋盘行列数
 * cellSize: 每格像素大小
 * boardPadding: 棋盘边距
 */
const config = {
    rows: 5,
    cols: 5,
    cellSize: 80,
    boardPadding: 30
};

// 棋子类型
const EMPTY = 0;
const PAO = 1;
const BING = 2;

// 棋盘状态
let board = [];
// 棋子坐标集合
let paos = [];
let bings = [];
// 当前选中棋子
let selected = null;
// 当前回合（true为炮方，false为兵方）
let paoTurn = true;
// 游戏是否结束
let gameOver = false;

const canvas = document.getElementById('board');
canvas.width = 450;
canvas.height = 450;
const ctx = canvas.getContext('2d');
const info = document.getElementById('info');
const restartBtn = document.getElementById('restart');

/**
 * 初始化棋盘和棋子
 */
// 新增：角色选择相关变量
let playerRole = null; // 'pao' 或 'bing'
let boardRotated = false; // 是否旋转棋盘

// 新增：角色选择按钮和容器
const roleSelectContainer = document.getElementById('role-select-container');
const gameContainer = document.getElementById('game-container');
const choosePaoBtn = document.getElementById('choose-pao');
const chooseBingBtn = document.getElementById('choose-bing');

// 新增：角色选择事件绑定
choosePaoBtn.onclick = function () {
    if (!gameParams || !gameParams.rows || !gameParams.cols || !gameParams.paoCount) {
        alert('请先选择游戏参数！');
        return;
    }
    playerRole = 'pao';
    boardRotated = true;
    // 统计初始化
    gameStartTime = Date.now();
    paoSteps = 0;
    bingSteps = 0;
    paoThinkTime = 0;
    bingThinkTime = 0;
    thinkStartTime = Date.now();
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    gameTimerInterval = setInterval(updateStats, 1000);
    updateStats();
    initGame();
    roleSelectContainer.style.display = 'none';
    gameContainer.style.display = '';
    document.querySelector('h2').innerText = '炮打洋鬼子';
};
chooseBingBtn.onclick = function () {
    if (!gameParams || !gameParams.rows || !gameParams.cols || !gameParams.paoCount) {
        alert('请先选择游戏参数！');
        return;
    }
    playerRole = 'bing';
    boardRotated = false;
    // 统计初始化
    gameStartTime = Date.now();
    paoSteps = 0;
    bingSteps = 0;
    paoThinkTime = 0;
    bingThinkTime = 0;
    thinkStartTime = Date.now();
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    gameTimerInterval = setInterval(updateStats, 1000);
    updateStats();
    initGame();
    roleSelectContainer.style.display = 'none';
    gameContainer.style.display = '';
    document.querySelector('h2').innerText = '炮打洋鬼子';
};

// 修改：初始化时隐藏游戏区，显示角色选择
window.onload = function () {
    roleSelectContainer.style.display = '';
    gameContainer.style.display = 'none';
    document.querySelector('h2').innerText = '炮打洋鬼子';
};

// 修改：初始化棋盘和棋子，支持旋转
// 新增：参数选择按钮
const param5x5Btn = document.getElementById('param-5x5');
const param7x7Btn = document.getElementById('param-7x7');

// 新增：参数选择事件绑定
let gameParams = { rows: 5, cols: 5, paoCount: 3 };
param5x5Btn.onclick = function () {
    gameParams = { rows: 5, cols: 5, paoCount: 3 };
    config.rows = 5;
    config.cols = 5;
    canvas.width = 450;
    canvas.height = 450;
    playerRole = null;
    boardRotated = false;
    roleSelectContainer.style.display = '';
    gameContainer.style.display = 'none';
    document.querySelector('h2').innerText = '炮打洋鬼子';
    info.innerText = '请选择角色开始游戏';
    drawBoard();
};
param7x7Btn.onclick = function () {
    gameParams = { rows: 7, cols: 7, paoCount: 5 };
    config.rows = 7;
    config.cols = 7;
    canvas.width = 610;
    canvas.height = 610;
    playerRole = null;
    boardRotated = false;
    roleSelectContainer.style.display = '';
    gameContainer.style.display = 'none';
    document.querySelector('h2').innerText = '炮打洋鬼子';
    info.innerText = '请选择角色开始游戏';
    drawBoard();
};

// 修改：绘制棋盘和棋子，支持旋转
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = 1;
    const boardWidth = (config.cols - 1) * config.cellSize * scale;
    const boardHeight = (config.rows - 1) * config.cellSize * scale;
    const offsetX = (canvas.width - boardWidth) / 2;
    const offsetY = (canvas.height - boardHeight) / 2;
    // 绘制棋盘背景渐变
    let grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grd.addColorStop(0, '#f7e9c2');
    grd.addColorStop(1, '#e0c68e');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // 旋转棋盘（视觉）
    if (boardRotated) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(Math.PI);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }
    // 绘制棋盘线
    for (let i = 0; i < config.rows; i++) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + i * config.cellSize * scale);
        ctx.lineTo(offsetX + (config.cols - 1) * config.cellSize * scale, offsetY + i * config.cellSize * scale);
        ctx.strokeStyle = '#b58863';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#e0c68e';
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.restore();
    }
    for (let j = 0; j < config.cols; j++) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(offsetX + j * config.cellSize * scale, offsetY);
        ctx.lineTo(offsetX + j * config.cellSize * scale, offsetY + (config.rows - 1) * config.cellSize * scale);
        ctx.strokeStyle = '#b58863';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#e0c68e';
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.restore();
    }
    // 只有选择角色后才绘制棋子
    if (playerRole) {
        for (let r = 0; r < config.rows; r++) {
            for (let c = 0; c < config.cols; c++) {
                if (board[r][c] !== EMPTY) {
                    const pieceOffsetX = (canvas.width - (config.cols - 1) * config.cellSize) / 2;
                    const pieceOffsetY = (canvas.height - (config.rows - 1) * config.cellSize) / 2;
                    drawPiece(r, c, board[r][c], selected && selected.r === r && selected.c === c, pieceOffsetX, pieceOffsetY);
                }
            }
        }
    }
    if (boardRotated) ctx.restore();
}

// 修改：点击事件，支持旋转后坐标映射
function handleBoardClick(e) {
    if (gameOver) return;
    const scale = 1;
    const boardWidth = (config.cols - 1) * config.cellSize * scale;
    const boardHeight = (config.rows - 1) * config.cellSize * scale;
    const offsetX = (canvas.width - boardWidth) / 2;
    const offsetY = (canvas.height - boardHeight) / 2;
    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    // 旋转坐标
    if (boardRotated) {
        x = canvas.width - x;
        y = canvas.height - y;
    }
    let c = Math.round((x - offsetX) / (config.cellSize * scale));
    let r = Math.round((y - offsetY) / (config.cellSize * scale));
    if (r < 0 || r >= config.rows || c < 0 || c >= config.cols) return;
    const pieceOffsetX = offsetX;
    const pieceOffsetY = offsetY;
    const pieceCenterX = pieceOffsetX + c * config.cellSize;
    const pieceCenterY = pieceOffsetY + r * config.cellSize;
    let dist = Math.sqrt(Math.pow(x - pieceCenterX, 2) + Math.pow(y - pieceCenterY, 2));
    if (dist > config.cellSize / 3) return;
    handleCellClick(r, c);
}

// 修改：重新开始按钮，自动归位并回到角色选择
restartBtn.onclick = function () {
    playerRole = null;
    boardRotated = false;
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    gameTimerInterval = null;
    gameStartTime = null;
    paoSteps = 0;
    bingSteps = 0;
    paoThinkTime = 0;
    bingThinkTime = 0;
    thinkStartTime = null;
    updateStats();
    roleSelectContainer.style.display = '';
    gameContainer.style.display = 'none';
    document.querySelector('h2').innerText = '炮打洋鬼子';
};

/**
 * 绘制单个棋子
 * @param {number} r 行
 * @param {number} c 列
 * @param {number} type 棋子类型
 * @param {boolean} highlight 是否高亮
 * @param {number} offsetX 棋盘x偏移
 * @param {number} offsetY 棋盘y偏移
 */
function drawPiece(r, c, type, highlight, offsetX = (canvas.width - (config.cols - 1) * config.cellSize) / 2, offsetY = (canvas.height - (config.rows - 1) * config.cellSize) / 2) {
    const x = offsetX + c * config.cellSize;
    const y = offsetY + r * config.cellSize;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, config.cellSize / 3, 0, 2 * Math.PI);
    // 阴影和渐变
    let grad = ctx.createRadialGradient(x, y, config.cellSize / 5, x, y, config.cellSize / 3);
    if (type === PAO) {
        grad.addColorStop(0, '#ff7961');
        grad.addColorStop(1, '#f44336');
    } else {
        grad.addColorStop(0, '#64b5f6');
        grad.addColorStop(1, '#2196f3');
    }
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = grad;
    ctx.globalAlpha = highlight ? 0.7 : 1;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = highlight ? 5 : 3;
    ctx.strokeStyle = highlight ? '#ffd600' : '#222';
    ctx.stroke();
    // 绘制内圈
    ctx.beginPath();
    ctx.arc(x, y, config.cellSize / 4, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = type === PAO ? '#fff3e0' : '#e3f2fd';
    ctx.stroke();
    ctx.restore();
    // 棋子文字
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px 微软雅黑,Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 4;
    // 新增：如果棋盘旋转则棋子文字反向旋转
    if (boardRotated) {
        ctx.translate(x, y);
        ctx.rotate(Math.PI);
        ctx.translate(-x, -y);
    }
    ctx.fillText(type === PAO ? '炮' : '兵', x, y);
    ctx.restore();
}

/**
 * 检查是否为合法移动
 * @param {number} fromR 起始行
 * @param {number} fromC 起始列
 * @param {number} toR 目标行
 * @param {number} toC 目标列
 * @returns {boolean}
 */
// 新增9x9参数按钮
const param9x9Btn = document.getElementById('param-9x9');
if (param9x9Btn) {
    param9x9Btn.onclick = function () {
        gameParams = { rows: 9, cols: 9, paoCount: 7 };
        config.rows = 9;
        config.cols = 9;
        canvas.width = 730;
        canvas.height = 730;
        playerRole = null;
        boardRotated = false;
        roleSelectContainer.style.display = '';
        gameContainer.style.display = 'none';
        document.querySelector('h2').innerText = '炮打洋鬼子';
        info.innerText = '请选择角色开始游戏';
        drawBoard();
    };
}
// 修改initGame，支持9x9和7炮
function initGame() {
    // 初始化棋盘
    board = [];
    for (let r = 0; r < config.rows; r++) {
        board[r] = [];
        for (let c = 0; c < config.cols; c++) {
            board[r][c] = EMPTY;
        }
    }
    paos = [];
    bings = [];
    selected = null;
    // 兵方先手
    paoTurn = (playerRole === 'pao') ? false : true;
    gameOver = false;
    if (!playerRole) {
        drawBoard();
        info.innerText = '请选择角色开始游戏';
        return;
    }
    // 5x5
    if (config.rows === 5 && config.cols === 5 && gameParams.paoCount === 3) {
        for (let c = 1; c <= 3; c++) {
            board[0][c] = PAO;
            paos.push({ r: 0, c });
        }
        for (let r = 2; r <= 4; r++) {
            for (let c = 0; c < 5; c++) {
                board[r][c] = BING;
                bings.push({ r, c });
            }
        }
    } else if (config.rows === 7 && config.cols === 7 && gameParams.paoCount === 5) {
        for (let c = 1; c <= 5; c++) {
            board[0][c] = PAO;
            paos.push({ r: 0, c });
        }
        for (let r = 2; r <= 6; r++) {
            for (let c = 0; c < 7; c++) {
                board[r][c] = BING;
                bings.push({ r, c });
            }
        }
    } else if (config.rows === 9 && config.cols === 9 && gameParams.paoCount === 7) {
        for (let c = 1; c <= 7; c++) {
            board[0][c] = PAO;
            paos.push({ r: 0, c });
        }
        for (let r = 2; r <= 8; r++) {
            for (let c = 0; c < 9; c++) {
                board[r][c] = BING;
                bings.push({ r, c });
            }
        }
    }
    drawBoard();
    updateInfo();
}
function isValidMove(fromR, fromC, toR, toC) {
    if (gameOver) return false;
    if (toR < 0 || toR >= config.rows || toC < 0 || toC >= config.cols) return false;
    if (board[toR][toC] !== EMPTY) return false;
    // 只能上下左右移动一格
    return (Math.abs(fromR - toR) + Math.abs(fromC - toC)) === 1;
}
// 适配新布局，info和restart按钮移动到规则区下方
restartBtn.onclick = function () {
    playerRole = null;
    boardRotated = false;
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    gameTimerInterval = null;
    gameStartTime = null;
    paoSteps = 0;
    bingSteps = 0;
    paoThinkTime = 0;
    bingThinkTime = 0;
    thinkStartTime = null;
    updateStats();
    roleSelectContainer.style.display = '';
    gameContainer.style.display = 'none';
    document.querySelector('h2').innerText = '炮打洋鬼子';
};

/**
 * 检查炮是否可以吃子
 * @param {number} fromR 炮行
 * @param {number} fromC 炮列
 * @param {number} toR 目标兵行
 * @param {number} toC 目标兵列
 * @returns {boolean}
 */
function canPaoEat(fromR, fromC, toR, toC) {
    if (board[fromR][fromC] !== PAO || board[toR][toC] !== BING) return false;
    // 必须在同一行或同一列
    if (fromR !== toR && fromC !== toC) return false;
    // 之间必须只隔一个空点
    let midR = (fromR + toR) / 2;
    let midC = (fromC + toC) / 2;
    if (fromR === toR && Math.abs(fromC - toC) === 2) {
        return board[fromR][midC] === EMPTY;
    }
    if (fromC === toC && Math.abs(fromR - toR) === 2) {
        return board[midR][fromC] === EMPTY;
    }
    return false;
}

/**
 * 检查炮是否被困
 * @returns {boolean}
 */
function isPaoBlocked() {
    for (const p of paos) {
        const { r, c } = p;
        // 检查四个方向是否有空位或可吃
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of dirs) {
            let nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
                if (board[nr][nc] === EMPTY) return false;
            }
            // 检查是否可吃
            let er = r + dr * 2, ec = c + dc * 2;
            if (er >= 0 && er < config.rows && ec >= 0 && ec < config.cols) {
                if (canPaoEat(r, c, er, ec)) return false;
            }
        }
    }
    return true;
}

/**
 * 检查胜负
 */
function checkWin() {
    if (bings.length === 0) {
        gameOver = true;
        info.innerText = '炮方胜利！';
        if (gameTimerInterval) clearInterval(gameTimerInterval);
        gameTimerInterval = null;
        updateStats();
        return;
    }
    if (isPaoBlocked()) {
        gameOver = true;
        info.innerText = '兵方胜利！';
        if (gameTimerInterval) clearInterval(gameTimerInterval);
        gameTimerInterval = null;
        updateStats();
        return;
    }
}

/**
 * 更新提示信息
 */
function updateInfo() {
    if (gameOver) return;
    info.innerText = paoTurn ? '炮方行动' : '兵方行动';
}

/**
 * 处理棋盘点击事件
 * @param {MouseEvent} e 
 */
// 修改：点击事件，支持旋转后坐标映射
function handleBoardClick(e) {
    if (gameOver) return;
    const scale = 1;
    const boardWidth = (config.cols - 1) * config.cellSize * scale;
    const boardHeight = (config.rows - 1) * config.cellSize * scale;
    const offsetX = (canvas.width - boardWidth) / 2;
    const offsetY = (canvas.height - boardHeight) / 2;
    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    // 旋转坐标
    if (boardRotated) {
        x = canvas.width - x;
        y = canvas.height - y;
    }
    let c = Math.round((x - offsetX) / (config.cellSize * scale));
    let r = Math.round((y - offsetY) / (config.cellSize * scale));
    if (r < 0 || r >= config.rows || c < 0 || c >= config.cols) return;
    const pieceOffsetX = offsetX;
    const pieceOffsetY = offsetY;
    const pieceCenterX = pieceOffsetX + c * config.cellSize;
    const pieceCenterY = pieceOffsetY + r * config.cellSize;
    const dist = Math.sqrt(Math.pow(x - pieceCenterX, 2) + Math.pow(y - pieceCenterY, 2));
    if (dist > config.cellSize / 3) return; // 判定半径与棋子绘制半径一致
    handleCellClick(r, c);
}

// 绑定事件
canvas.addEventListener('click', handleBoardClick);
restartBtn.addEventListener('click', initGame);

// 初始化游戏
initGame();

/**
 * 处理棋盘格点点击事件，实现选中、移动、吃子等逻辑
 */
/**
 * 初始化棋盘和棋子
 * 根据当前gameParams和playerRole初始化棋盘状态
 */
function initGame() {
    // 初始化棋盘
    board = [];
    for (let r = 0; r < config.rows; r++) {
        board[r] = [];
        for (let c = 0; c < config.cols; c++) {
            board[r][c] = EMPTY;
        }
    }
    paos = [];
    bings = [];
    selected = null;
    paoTurn = (playerRole === 'pao'); // 兵方先手时paoTurn为false
    gameOver = false;
    // 检查是否已选择角色
    if (!playerRole) {
        drawBoard();
        info.innerText = '请选择角色开始游戏';
        return;
    }
    // 初始化炮和兵的位置
    if (config.rows === 5 && config.cols === 5 && gameParams.paoCount === 3) {
        // 5x5模式
        if (playerRole === 'pao' || playerRole === 'bing') {
            // 炮方：第一行中间三个点
            for (let c = 1; c <= 3; c++) {
                board[0][c] = PAO;
                paos.push({ r: 0, c });
            }
            // 兵方：第3-5行（整体下移一格）
            for (let r = 2; r <= 4; r++) {
                for (let c = 0; c < 5; c++) {
                    board[r][c] = BING;
                    bings.push({ r, c });
                }
            }
        }
    } else if (config.rows === 7 && config.cols === 7 && gameParams.paoCount === 5) {
        // 7x7模式
        if (playerRole === 'pao' || playerRole === 'bing') {
            // 炮方：第一行中间五个点
            for (let c = 1; c <= 5; c++) {
                board[0][c] = PAO;
                paos.push({ r: 0, c });
            }
            // 兵方：第3-7行（整体下移一格）
            for (let r = 2; r <= 6; r++) {
                for (let c = 0; c < 7; c++) {
                    board[r][c] = BING;
                    bings.push({ r, c });
                }
            }
        }
    } else if (config.rows === 9 && config.cols === 9 && gameParams.paoCount === 7) {
        // 9x9模式
        if (playerRole === 'pao' || playerRole === 'bing') {
            // 炮方：第一行中间七个点
            for (let c = 1; c <= 7; c++) {
                board[0][c] = PAO;
                paos.push({ r: 0, c });
            }
            // 兵方：第3-9行（整体下移一格）
            for (let r = 2; r <= 8; r++) {
                for (let c = 0; c < 9; c++) {
                    board[r][c] = BING;
                    bings.push({ r, c });
                }
            }
        }
    }
    drawBoard();
    updateInfo();
}
/**
 * 处理棋盘格点点击事件
 * @param {number} r 行
 * @param {number} c 列
 */
function handleCellClick(r, c) {
    if (gameOver) return;
    // 未选中棋子，点击炮或兵选中
    if (!selected) {
        if ((paoTurn && board[r][c] === PAO) || (!paoTurn && board[r][c] === BING)) {
            selected = { r, c };
            drawBoard();
        }
        return;
    }
    // 已选中棋子
    if (selected) {
        // 再次点击同一棋子取消选中
        if (selected.r === r && selected.c === c) {
            selected = null;
            drawBoard();
            return;
        }
        // 炮方操作
        if (paoTurn && board[selected.r][selected.c] === PAO) {
            // 移动
            if (isValidMove(selected.r, selected.c, r, c)) {
                // 统计步数和思考时间
                paoSteps++;
                let now = Date.now();
                paoThinkTime += (now - thinkStartTime);
                thinkStartTime = now;
                updateStats();
                board[selected.r][selected.c] = EMPTY;
                board[r][c] = PAO;
                for (let i = 0; i < paos.length; i++) {
                    if (paos[i].r === selected.r && paos[i].c === selected.c) {
                        paos[i] = { r, c };
                        break;
                    }
                }
                selected = null;
                paoTurn = false;
                thinkStartTime = Date.now();
                drawBoard();
                checkWin();
                updateInfo();
                updateStats();
                // 兵方AI或手动走棋
                if (!gameOver && playerRole === 'pao') {
                    setTimeout(bingAIAutoMove, 500);
                }
                return;
            }
            // 吃子
            if (canPaoEat(selected.r, selected.c, r, c)) {
                // 统计步数和思考时间
                paoSteps++;
                let now = Date.now();
                paoThinkTime += (now - thinkStartTime);
                thinkStartTime = now;
                updateStats();
                board[selected.r][selected.c] = EMPTY;
                board[r][c] = PAO;
                for (let i = 0; i < paos.length; i++) {
                    if (paos[i].r === selected.r && paos[i].c === selected.c) {
                        paos[i] = { r, c };
                        break;
                    }
                }
                for (let i = 0; i < bings.length; i++) {
                    if (bings[i].r === r && bings[i].c === c) {
                        bings.splice(i, 1);
                        break;
                    }
                }
                selected = null;
                paoTurn = false;
                thinkStartTime = Date.now();
                drawBoard();
                checkWin();
                updateInfo();
                updateStats();
                // 兵方AI或手动走棋
                if (!gameOver && playerRole === 'pao') {
                    setTimeout(bingAIAutoMove, 500);
                }
                return;

            }
        }
        // 兵方操作
        if (!paoTurn && board[selected.r][selected.c] === BING) {
            // 兵只能移动，不能吃子
            if (isValidMove(selected.r, selected.c, r, c)) {
                // 统计步数和思考时间
                bingSteps++;
                let now = Date.now();
                bingThinkTime += (now - thinkStartTime);
                thinkStartTime = now;
                updateStats();
                board[selected.r][selected.c] = EMPTY;
                board[r][c] = BING;
                for (let i = 0; i < bings.length; i++) {
                    if (bings[i].r === selected.r && bings[i].c === selected.c) {
                        bings[i] = { r, c };
                        break;
                    }
                }
                selected = null;
                paoTurn = true;
                thinkStartTime = Date.now();
                drawBoard();
                checkWin();
                updateInfo();
                updateStats();
                // 炮方AI或手动走棋
                if (!gameOver && playerRole === 'bing') {
                    setTimeout(paoAIAutoMove, 500);
                }
                return;
            }
        }
        // 其他情况，取消选中
        selected = null;
        drawBoard();
    }
}














// 统计相关变量
let gameStartTime = null; // 游戏开始时间
let gameTimerInterval = null; // 游戏计时器
let paoSteps = 0;
let bingSteps = 0;
let paoThinkTime = 0; // 单位：毫秒
let bingThinkTime = 0; // 单位：毫秒
let thinkStartTime = null; // 当前思考开始时间

/**
 * 刷新右侧统计信息显示
 */
function updateStats() {
    // 游戏总时长
    let now = Date.now();
    let totalMs = gameStartTime ? (now - gameStartTime) : 0;
    let min = Math.floor(totalMs / 60000);
    let sec = Math.floor((totalMs % 60000) / 1000);
    document.getElementById('game-time').innerText = (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec;
    // 步数
    document.getElementById('pao-steps').innerText = paoSteps;
    document.getElementById('bing-steps').innerText = bingSteps;
    // 思考时间
    let paoMin = Math.floor(paoThinkTime / 60000);
    let paoSec = Math.floor((paoThinkTime % 60000) / 1000);
    document.getElementById('pao-think').innerText = (paoMin < 10 ? '0' : '') + paoMin + ':' + (paoSec < 10 ? '0' : '') + paoSec;
    let bingMin = Math.floor(bingThinkTime / 60000);
    let bingSec = Math.floor((bingThinkTime % 60000) / 1000);
    document.getElementById('bing-think').innerText = (bingMin < 10 ? '0' : '') + bingMin + ':' + (bingSec < 10 ? '0' : '') + bingSec;
}












