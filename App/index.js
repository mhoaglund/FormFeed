var app = require('express')();
var express = require('express');
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var path = require('path');
//const asHandler = require('azureServiceHandler.js');
const asHandler = require(__dirname + '\\azureServiceHandler.js')

app.use(express.static(path.join(__dirname, 'public')));

const config = require('config');
const app_config = config.get('appconfig');

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/refresh', (req,res) => {
    res.send('Hello World');
})

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    socket.on('submit', (msg) => {
        console.log('created message: ' + msg.id);
        socket.broadcast.emit('create_message', msg);
    });
    socket.on('update', (msg) =>{
        console.log('updated message: ' + msg.id);
        socket.broadcast.emit('update_message', msg);
    })
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});