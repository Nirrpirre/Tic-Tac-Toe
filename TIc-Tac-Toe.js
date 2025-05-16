const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const fs = require('fs');

let leaderboard;

// Load leaderboard data from JSON file when the server starts
fs.readFile('leaderboard.json', function (err, data) {
  if (err) throw err;
  leaderboard = JSON.parse(data); // Convert JSON string to JavaScript object
})

let players = [];
let boardState = ['', '', '', '', '', '', '', '', ''];  
let currentPlayer = Math.random() < 0.5 ? "X" : "O"; // Randomly choose who starts
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

          // Check if player is in leaderboard and get their win count
          leaderboard.forEach(player => {
            if (player.name === username) {
              wins = player.wins
            }
          })
          players.push({ id: Socket.id, symbol, username, wins }); // Add player to active game
          Socket.emit('assignSymbol', symbol); // Tell player their symbol
          Socket.emit('leaderboard', leaderboard); // Send them current leaderboard
      } else {
          Socket.emit('spectator'); // If already two players, becomes a spectator
      }

      io.emit('updatePlayers', {
          players: players.map(p => ({ username: p.username, symbol: p.symbol })),
          currentPlayer
      });
  });

   Socket.on('makeMove', (data) => {
    if (Socket.id === players.find(p => p.symbol === currentPlayer)?.id && boardState[data.index] === '') {
      boardState[data.index] = data.player;
      io.emit('moveMade', data);
      const winningSymbol = checkWinner();
      console.log("Winner:", winningSymbol);

      if (winningSymbol) {
        io.emit('gameOver', winningSymbol);

        if (winningSymbol !== 'Draw') {
          let winningPlayer = players.find(p => p.symbol === winningSymbol);

          if (winningPlayer) {
            winningPlayer.wins++;

            let leader = leaderboard.find(l => l.name === winningPlayer.username);
            if (leader) {
              leader.wins++;
            } else {
              leaderboard.push({ name: winningPlayer.username, wins: winningPlayer.wins });
            }

            fs.writeFile('leaderboard.json', JSON.stringify(leaderboard), 'utf-8', function (error) {
              if (error) throw error;
            });

            io.emit('leaderboard', leaderboard);
          }
        }

        // Reset board and start new game
        boardState = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = Math.random() < 0.5 ? "X" : "O";
        io.emit('updatePlayers', {
          players: players.map(p => ({ username: p.username, symbol: p.symbol })),
          currentPlayer
        });
      } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        io.emit('updatePlayers', {
          players: players.map(p => ({ username: p.username, symbol: p.symbol })),
          currentPlayer
        });
      }
    }
  });
   // Reset game
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