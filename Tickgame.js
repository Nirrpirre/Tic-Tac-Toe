const Socket = io();
const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const s = document.getElementById('status');
let mySymbol;

Socket.on('assignSymbol', (symbol) => {
    mySymbol = symbol;
    s.textContent = `You are Player ${symbol}`;
});

Socket.on('spectator', () => {
    s.textContent = 'You are a spectator.';
});

Socket.on('updatePlayers', (data) => {
s.textContent = `Players: ${data.players.join(' vs ')}. Current player: ${data.currentPlayer}`;
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
        s.textContent = `Current player: ${currentPlayer}`;
    }, 50);
});

Socket.on('gameOver', (data) => {
    setTimeout(() => {
        if (data.winner === 'Draw') {
            alert('The game is a draw!');
        } else {
            alert(`Player ${data.winner} wins!`);
        }
    
        cells.forEach(cell => cell.textContent = '');
        currentPlayer = 'X';
        
    }, 100);
})