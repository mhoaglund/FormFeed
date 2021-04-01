var app = require('express')();
var express = require('express');
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var path = require('path');
//const asHandler = require('azureServiceHandler.js');
const asHandler = require(__dirname + '/azureServiceHandler.js')

app.use(express.static(path.join(__dirname, 'public')));

const config = require('config');
const app_config = config.get('appconfig');

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/refresh', (req,res) => {
    if (req.query.nextRowKey) {
        var clienttoken = {
            nextRowKey: req.query.nextRowKey,
            nextPartitionKey: req.query.nextPartitionKey,
            targetLocation: Number(req.query.targetLocation)
        }
    }
    var topic = config.get('appconfig.homekey'); //the generic topic for 'home'
    if(req.query.topic){
        topic = req.query.topic;
    }
    let posts = asHandler.getEntities(clienttoken, topic, function (reply, token) {
        if (token) {
            res.append("Continuation-Token", JSON.stringify(token));
        }
        res.send({
            reply
        });
    });
})

app.get('/settings', (req,res) => {
    if (req.query.RowKey && req.query.PartKey) {
            let posts = asHandler.getEntity(req.query.RowKey, function (reply, token) {
                res.send({
                    reply
                });
            }, req.query.PartKey);
    }
})

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    socket.on('submit', (msg) => {
        console.log('created message: ' + msg.id);
        socket.broadcast.emit('create_message', msg);
        asHandler.Update(msg, function () {
            console.log('uploaded.')
        });
    });
    socket.on('update', (msg) =>{
        console.log('updated message: ' + msg.id);
        socket.broadcast.emit('update_message', msg);
        asHandler.Update(msg, function () {
            console.log('updated.')
        });
    });
    socket.on('alert', (msg) => {
        console.log('Received Alert');
        io.emit('alert', msg);
        asHandler.Alert(msg, function(){
            console.log('recorded an alert.')
        })
    });
});

http.listen(process.env.PORT || 3000, () => {
    console.log('listening on *:3000 or');
    console.log(process.env.PORT);
});