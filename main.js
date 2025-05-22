// 炮打洋鬼子主逻辑脚本
// 作者：AI助手
// 日期：2024年

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
    playerRole = 'pao';
    boardRotated = false;
    roleSelectContainer.style.display = 'none';
    gameContainer.style.display = '';
    document.querySelector('h1').innerText = '炮打洋鬼子';
    initGame();
};
chooseBingBtn.onclick = function () {
    playerRole = 'bing';
    boardRotated = false;
    roleSelectContainer.style.display = 'none';
    gameContainer.style.display = '';
    document.querySelector('h1').innerText = '炮打洋鬼子';
    initGame();
};

// 修改：初始化时隐藏游戏区，显示角色选择
window.onload = function () {
    roleSelectContainer.style.display = '';
    gameContainer.style.display = 'none';
    document.querySelector('h1').innerText = '炮打洋鬼子';
};

// 修改：初始化棋盘和棋子，支持旋转
function initGame() {
    board = Array.from({ length: config.rows }, () => Array(config.cols).fill(EMPTY));
    paos = [];
    bings = [];
    if (playerRole === 'bing') {
        // 兵方初始化：第2-4行填满
        for (let r = 2; r < 5; r++) {
            for (let c = 0; c < config.cols; c++) {
                board[r][c] = BING;
                bings.push({ r, c });
            }
        }
        // 炮方初始化：第一行中间三个点
        let paoRow = 0;
        for (let c = 1; c <= 3; c++) {
            board[paoRow][c] = PAO;
            paos.push({ r: paoRow, c });
        }
    } else {
        // 兵方初始化：前三行填满
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < config.cols; c++) {
                board[r][c] = BING;
                bings.push({ r, c });
            }
        }
        // 炮方初始化：最后一行中间三个点
        let paoRow = config.rows - 1;
        for (let c = 1; c <= 3; c++) {
            board[paoRow][c] = PAO;
            paos.push({ r: paoRow, c });
        }
    }
    selected = null;
    paoTurn = true;
    gameOver = false;
    updateInfo();
    drawBoard();
    // 如果玩家选兵，AI先手（不旋转棋盘）
    if (playerRole === 'bing') {
        paoTurn = false; // 兵方先手
        updateInfo();
        setTimeout(bingAIAutoMove, 500);
    }
}

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
    roleSelectContainer.style.display = '';
    gameContainer.style.display = 'none';
    document.querySelector('h1').innerText = '炮打洋鬼子';
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
    ctx.restore();
    // 棋子文字
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px 微软雅黑,Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 4;
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
function isValidMove(fromR, fromC, toR, toC) {
    if (gameOver) return false;
    if (toR < 0 || toR >= config.rows || toC < 0 || toC >= config.cols) return false;
    if (board[toR][toC] !== EMPTY) return false;
    // 只能上下左右移动一格
    return (Math.abs(fromR - toR) + Math.abs(fromC - toC)) === 1;
}

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
        return;
    }
    if (isPaoBlocked()) {
        gameOver = true;
        info.innerText = '兵方胜利！';
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
function handleBoardClick(e) {
    if (gameOver) return;
    // 计算棋盘线条区域的scale和offset，保持与drawBoard一致
    const scale = 1;
    const boardWidth = (config.cols - 1) * config.cellSize * scale;
    const boardHeight = (config.rows - 1) * config.cellSize * scale;
    // 关键：棋盘线条区域和棋子绘制区域的offset要统一
    const offsetX = (canvas.width - boardWidth) / 2;
    const offsetY = (canvas.height - boardHeight) / 2;
    // 获取鼠标点击位置
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // 计算最近的格点
    let c = Math.round((x - offsetX) / (config.cellSize * scale));
    let r = Math.round((y - offsetY) / (config.cellSize * scale));
    if (r < 0 || r >= config.rows || c < 0 || c >= config.cols) return;
    // 检查点击是否在棋子判定半径范围内，棋子绘制offset与判定offset统一
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
                drawBoard();
                checkWin();
                updateInfo();
                // 兵方AI或手动走棋
                if (!gameOver && playerRole === 'pao') {
                    setTimeout(bingAIAutoMove, 500);
                }
                return;
            }
            // 吃子
            if (canPaoEat(selected.r, selected.c, r, c)) {
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
                drawBoard();
                checkWin();
                updateInfo();
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
                drawBoard();
                checkWin();
                updateInfo();
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

/**
 * 兵方AI自动行动逻辑
 * 在兵方回合自动调用AI决策并执行移动
 */
function bingAIAutoMove() {
    if (gameOver || paoTurn) return;
    // 调用AI决策
    if (typeof window.bingAIMove === 'function') {
        const move = window.bingAIMove(board, bings);
        if (move) {
            // 执行移动
            const { from, to } = move;
            if (isValidMove(from.r, from.c, to.r, to.c)) {
                // 更新棋盘和兵数组
                board[from.r][from.c] = EMPTY;
                board[to.r][to.c] = BING;
                for (let i = 0; i < bings.length; i++) {
                    if (bings[i].r === from.r && bings[i].c === from.c) {
                        bings[i] = { r: to.r, c: to.c };
                        break;
                    }
                }
                paoTurn = true;
                updateInfo();
                drawBoard();
            }
        }
    }
}
// 在主逻辑合适位置调用AI自动行动（如兵方回合开始时）
function nextTurn() {
    if (gameOver) return;
    paoTurn = !paoTurn;
    updateInfo();
    drawBoard();
    checkWin();
}











