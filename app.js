var app = require('express')();
var express = require('express');
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var path = require('path');
var async = require('async');
//const asHandler = require('azureServiceHandler.js');
const asHandler = require(__dirname + '/azureServiceHandler.js')
const masseuse = require(__dirname + '/masseuse.js')

app.use(express.static(path.join(__dirname, 'public')));

const config = require('config');
const app_config = config.get('appconfig');

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/renderall', (req, res) => {
    var topic = config.get('appconfig.homekey'); //the generic topic for 'home'
    if(req.query.topic){
        topic = req.query.topic;
    }// an example using an object instead of an array
    var delta_topic = config.get('appconfig.logkey') + "_" + topic;
    async.parallel({
        main: function(callback) {
            let posts = asHandler.getAllEntities(topic, function (reply) {
                callback(null, reply);
            });
        },
        deltas: function(callback) {
            let posts = asHandler.getAllEntities(delta_topic, function (reply) {
                callback(null, reply);
            });
        }
    }, function(err, results) {
        // results is now equals to: {one: 1, two: 2}
        masseuse.renderTimeSeries(results, function(series){
            res.send(series);
        })
    });
})

app.get('/refresh', (req,res) => {
    //TODO: refactor to use getallentities, don't bother with the header
    var topic = config.get('appconfig.homekey'); //the generic topic for 'home'
    if(req.query.topic){
        topic = req.query.topic;
    }
    let posts = asHandler.getAllEntities(topic, function (reply) {
        res.send({reply});
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