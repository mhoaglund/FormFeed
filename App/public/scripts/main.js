$(function () {
    var socket = io();
    //TODO: request all messages
    $('form').submit(function (e) {
        e.preventDefault(); // prevents page reloading
        socket.emit('chat message', $('#m').val());
        $('#m').val('');
        return false;
    });
    socket.on('chat message', function (msg) {
        $('#messages').append($('<li>').text(msg));
    });
    //TODO: flesh out minimal dragging
    var elementToDrag = document.getElementById('elementToDrag');
    var handle = elementToDrag.getElementsByClassName('handle')[0];
    draggable(elementToDrag, handle);
});

//Update the view with a new message stub+textarea, send message to server to emit
function startMessageAtLocation(){}

//User has completed message, send to server to emit and close stub
function sendMessage(){
    var msgid = uuidv4();
    var msg = {
        id: msgid,
        body: $('#m').val(),
        location: determineRelLocation()
    }

}

//Request messages from the server and add them to the view
function populate(){
    //foreach message addLocatedElement
}

//Determine a relative location for an element based on its pixel space location
function determineRelLocation(){}

//Based on a socket .updateLocation call or a user's own drag
function updateRelLocation(){}

//A new element has to be added and it has relative locating coords- add it to the view
function addLocatedElement(){}

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}