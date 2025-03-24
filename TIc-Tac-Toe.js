const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);


let players = [];
let boardState = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


  const checkWinner = () => {
    const winningCombinations = [
       [0, 1, 2],
       [3, 4, 5],
       [6, 7, 8],
       [0, 3, 6],
       [1, 4, 7],
       [2, 5, 8],
       [0, 4, 8],
       [2, 4, 6],
    ];

    for (let combination of winningCombinations) {
        const [a, b, c] = combination;
        if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
         return boardState[a];
    }
  }

  return boardState.includes('') ? null : 'Draw';
};

io.on('connection', (Socket) => {
    console.log('A user connected:', Socket.id);

    if(players.length < 2) {
        players.push({ id: Socket.id, symbol: players.length === 0 ? 'X' : 'O'});
        Socket.emit('assignSymbol', players[players.length - 1].symbol);
      } else {
      Socket.emit('spectator');
    }

    io.emit('updatePlayers', {
      players: players.map(player => player.symbol),
      currentPlayer: currentPlayer
  });
  
    Socket.on('makeMove', (data) => {
      if (Socket.id === players.find(player => player.symbol === currentPlayer).id && boardState[data.index] === '') {
        boardState[data.index] = data.player;
        io.emit('moveMade', data);
        const winner = checkWinner();
        if(winner) {
          io.emit('gameOver', { winner });
          boardState = ['', '', '', '', '', '', '', '', ''];
          currentPlayer = 'X';
        } else {
          currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        }
      }
    });

    Socket.on('disconnect', () => {
      console.log('User disconnected:', Socket.id);
      players = players.filter(player => player.id !== Socket.id);
      io.emit('updatePlayers', players.map(player => player.symbol));
    });
});

  server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
  });