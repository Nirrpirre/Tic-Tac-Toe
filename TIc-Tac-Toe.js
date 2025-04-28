const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const fs = require('fs');

let leaderboard;
fs.readFile('leaderboard.json', function (err, data) {
  if (err) throw err;
  leaderboard = JSON.parse(data);
})

let players = [];
let boardState = ['', '', '', '', '', '', '', '', ''];  
let currentPlayer = Math.random() < 0.5 ? "X" : "O";
console.log(currentPlayer);

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'menu.html'));
});

app.post('/login', (req, res) => {
  const username = req.body.username;

  if (!players[username]) {
    players[username] = { wins: 0 };
  }
})


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
  console.log('User connected:', Socket.id);

  Socket.on('joinGame', ({ username }) => {
      if (players.length < 2) {
          const symbol = players.length === 0 ? 'X' : 'O';
          let wins = 0;
          leaderboard.forEach(player => {
            if (player.name === username) {
              wins = player.wins
            }
          })
          players.push({ id: Socket.id, symbol, username, wins });
          Socket.emit('assignSymbol', symbol);
          Socket.emit('leaderboard', leaderboard);
      } else {
          Socket.emit('spectator');
      }

      io.emit('updatePlayers', {
          players: players.map(p => ({ username: p.username, symbol: p.symbol })),
          currentPlayer
      });
  });

  Socket.on('makeMove', (data) => {
      if (Socket.id === players.find(player => player.symbol === currentPlayer).id && boardState[data.index] === '') {
          boardState[data.index] = data.player;
          io.emit('moveMade', data);
          const winner = checkWinner();
          console.log(winner);
          
          if (winner) {
              io.emit('gameOver', { winner });
              let a;
              players.forEach(p => {
                if (p.symbol === winner) {
                  a = p;
                }
              })
              a.wins++;
              let x = [];
              leaderboard.forEach(player => {
                x.push({ name: player.name, wins: player.wins });
              });
              console.log(players)
              players.forEach(player => {
                x.push({ name: player.username, wins: player.wins })
              })
              let json = JSON.stringify(x);
              fs.writeFile('leaderboard.json', json, 'utf-8', function (error) {
                if (error) throw error;
              });
              io.emit('leaderboard', x);
              boardState = ['', '', '', '', '', '', '', '', ''];
              currentPlayer = Math.random() < 0.5 ? "X" : "O";
              io.emit('updatePlayers', { players: players.map(player => player.symbol), currentPlayer });
          }
          currentPlayer = currentPlayer === 'X' ? 'O' : 'X';     
      }
  });

  Socket.on('resetGame', () => {
      boardState = ['', '', '', '', '', '', '', '', ''];
      currentPlayer = Math.random() < 0.5 ? "X" : "O";

      io.emit('resetBoard', { currentPlayer });
      io.emit('updatePlayers', { players: players.map(player => player.symbol), currentPlayer });
  });

  Socket.on('disconnect', () => {
      console.log('User disconnected:', Socket.id);
      players = players.filter(player => player.id !== Socket.id);
      io.emit('updatePlayers', { players: players.map(player => player.symbol) });
  });
});




  server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
  });