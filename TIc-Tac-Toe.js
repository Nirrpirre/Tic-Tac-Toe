const express = require("express");
const http = require("http");
const { disconnect } = require("process");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let players = [];
let board = [
    "", "", "",
    "", "", "",
    "", "", ""
];
let currentPlayer = "X";

app.use(express.static("public"));

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    if (players.length < 2) {
        players.push(socket.id);
        socket.emit("playerAssigned", players.length === 1 ? "X" : "O");

        if (players.length === 2) {
            io.emit("gameStart");
        }
    }else {
        socket.emit("Full");
        socket.disconnect();
        return;
    }

    socket.on("makeMove", (data) => {
        if (socket.id !== players[0] && currentPlayer === "X") return;
        if (socket.id !== players[1] && currentPlayer === "O") return;

        if (board[data.index] === ""){
            board[data.index] = currentPlayer;
            io.emit("UpdateBoard", { board, player: currentPlayer });

            if (checkWin(currentPlayer)) {
                io.emit("gameOver", `${currentPlayer} wins!`)
                resetGame();
                return;
            }

            if(board.every(cell => cell !== "")) {
                io.emit("gameOver", "Draw");
                resetGame();
                return;
            }

            currentPlayer = currentPlayer === "X" ? "O" : "X";
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    })
})