var app = require('express')();
var express = require('express');
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

const config = require('config');
const app_config = config.get('appconfig');

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});