const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { Socket } = require('dgram');

const app = express();
const server = http.createServer(app);
const io = new Server(server);


let players = [];
let boardState = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = X;

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
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
        Socket.emit('assignsymbol', players[players.length -1].symbol)
    }
})

  server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
  });