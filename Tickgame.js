const Socket = io();
const params = new URLSearchParams(window.location.search);
const username = params.get('username');
const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const s = document.getElementById('status');
let mySymbol;
let currentPlayer;
let myUsername = username;

Socket.emit('joinGame', { username: myUsername });

Socket.on('assignSymbol', (symbol) => {
    mySymbol = symbol;
    s.textContent = `You are Player ${symbol}`;
});
// If the game already has two players, becomes a spectator
Socket.on('spectator', () => {
    s.textContent = 'You are a spectator.';
});

Socket.on('leaderboard', (leaderboard) => {
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '';
    // Sort leaderboard by wins
    leaderboard.sort((a, b) => b.wins - a.wins);
    // Show only players who have at least 1 win
    leaderboard
    .filter(player => player.wins > 0) 
    .forEach(player => {
        const li = document.createElement('li');
        li.textContent = `${player.name}: ${player.wins} wins`;
        leaderboardList.appendChild(li);
    });
    
})

// Update player names, symbols, and current turn
Socket.on('updatePlayers', (data) => {
    const players = data.players;
    const current = players.find(p => p.symbol === data.currentPlayer);
    const [p1, p2] = players;

    if (p1 && p2) {
        s.textContent = `Players: ${p1.username} (X) vs ${p2.username} (O). Turn: ${current.username}`;
    } else {
        s.textContent = `Waiting for players...`;
    }

    currentPlayer = data.currentPlayer;
});



cells.forEach(cell => {
    cell.addEventListener('click', () => {
        // Only allow clicking if the cell is empty and it's your turn
        if(cell.textContent === '' && mySymbol === currentPlayer) {
            Socket.emit('makeMove', {
                index: cell.getAttribute('data-index'),
                player: mySymbol
            });
        }
    });
});

Socket.on('moveMade', (data) => {
    cells[data.index].textContent = data.player;

    setTimeout(() => {
        currentPlayer=data.player === 'X' ? 'O' : 'X';
        s.textContent = `Turn: ${currentPlayer}`;
    }, 50);
});
// Handels game over (win or draw)
Socket.on('gameOver', (winner) => {
    setTimeout(() => {
        alert(winner === 'Draw' ? 'The game is a draw!' : `Player ${winner} wins!`);
        cells.forEach(cell => cell.textContent = '');
        Socket.emit('resetGame'); 
    }, 100);
});

// Reset the board when the server signals a new game
Socket.on('resetBoard', (data) => {
    boardState = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = data.currentPlayer;
    s.textContent = `New game! Current player: ${currentPlayer}`;
});
