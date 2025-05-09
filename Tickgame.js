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

Socket.on('spectator', () => {
    s.textContent = 'You are a spectator.';
});

Socket.on('leaderboard', (leaderboard) => {
    Socket.on('leaderboard', (leaderboard) => {
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '';
    
        leaderboard.sort((a, b) => b.wins - a.wins);
    
        leaderboard
        .filter(player => player.wins > 0) 
        .forEach(player => {
            const li = document.createElement('li');
            li.textContent = `${player.name}: ${player.wins} wins`;
            leaderboardList.appendChild(li);
        });
    });
    
})

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

Socket.on('gameOver', (data) => {
    setTimeout(() => {
        alert(data.winner === 'Draw' ? 'The game is a draw!' : `Player ${data} wins!`);
        
        cells.forEach(cell => cell.textContent = '');

        Socket.emit('resetGame'); 
    }, 100);
});


Socket.on('resetBoard', (data) => {
    boardState = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = data.currentPlayer;
    s.textContent = `New game! Current player: ${currentPlayer}`;
});
