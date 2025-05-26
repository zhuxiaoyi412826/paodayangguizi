// AI.js
// 炮打洋鬼子AI自动走棋核心实现

/**
 * 炮方AI自动走棋（加强版）
 * @param {Array} board 当前棋盘二维数组
 * @param {Array} paos 炮棋子数组
 * @param {Array} bings 兵棋子数组
 * @param {Object} config 棋盘配置
 * @returns {Object} {from: {r, c}, to: {r, c}} 走棋动作
 */
function paoAIMove(board, paos, bings, config) {
    // 1. 优先能吃子
    for (const p of paos) {
        const {r, c} = p;
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        for (const [dr,dc] of dirs) {
            let nr = r + dr * 2, nc = c + dc * 2;
            let mr = r + dr, mc = c + dc;
            if (
                nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols &&
                board[mr][mc] === 0 && board[nr][nc] === 2
            ) {
                return {from: {r, c}, to: {r: nr, c: nc}};
            }
        }
    }
    // 2. 优先靠近最近的兵
    let bestMove = null;
    let minDist = Infinity;
    for (const p of paos) {
        const {r, c} = p;
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        for (const [dr,dc] of dirs) {
            let nr = r + dr, nc = c + dc;
            if (
                nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols &&
                board[nr][nc] === 0
            ) {
                // 计算此移动后到最近兵的距离
                let dist = Infinity;
                for (const b of bings) {
                    let d = Math.abs(nr - b.r) + Math.abs(nc - b.c);
                    if (d < dist) dist = d;
                }
                if (dist < minDist) {
                    minDist = dist;
                    bestMove = {from: {r, c}, to: {r: nr, c: nc}};
                }
            }
        }
    }
    if (bestMove) return bestMove;
    // 3. 否则随机移动
    let moves = [];
    for (const p of paos) {
        const {r, c} = p;
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        for (const [dr,dc] of dirs) {
            let nr = r + dr, nc = c + dc;
            if (
                nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols &&
                board[nr][nc] === 0
            ) {
                moves.push({from: {r, c}, to: {r: nr, c: nc}});
            }
        }
    }
    if (moves.length > 0) {
        return moves[Math.floor(Math.random() * moves.length)];
    }
    return null;
}

/**
 * 兵方AI自动走棋（加强版）
 * @param {Array} board 当前棋盘二维数组
 * @param {Array} bings 兵棋子数组
 * @param {Object} config 棋盘配置
 * @returns {Object} {from: {r, c}, to: {r, c}} 走棋动作
 */
function bingAIMove(board, bings, config) {
    // 1. 优先远离炮
    let bestMove = null;
    let maxDist = -1;
    for (const p of bings) {
        const {r, c} = p;
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        for (const [dr,dc] of dirs) {
            let nr = r + dr, nc = c + dc;
            if (
                nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols &&
                board[nr][nc] === 0
            ) {
                // 计算此移动后到最近炮的距离
                let dist = Infinity;
                for (let i = 0; i < board.length; i++) {
                    for (let j = 0; j < board[0].length; j++) {
                        if (board[i][j] === 1) {
                            let d = Math.abs(nr - i) + Math.abs(nc - j);
                            if (d < dist) dist = d;
                        }
                    }
                }
                if (dist > maxDist) {
                    maxDist = dist;
                    bestMove = {from: {r, c}, to: {r: nr, c: nc}};
                }
            }
        }
    }
    if (bestMove) return bestMove;
    // 2. 否则随机移动
    let moves = [];
    for (const p of bings) {
        const {r, c} = p;
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        for (const [dr,dc] of dirs) {
            let nr = r + dr, nc = c + dc;
            if (
                nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols &&
                board[nr][nc] === 0
            ) {
                moves.push({from: {r, c}, to: {r: nr, c: nc}});
            }
        }
    }
    if (moves.length > 0) {
        return moves[Math.floor(Math.random() * moves.length)];
    }
    return null;
}

// 导出AI接口
if (typeof window !== 'undefined') {
    window.paoAIMove = paoAIMove;
    window.bingAIMove = bingAIMove;
}