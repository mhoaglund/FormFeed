$(function () {
    var socket = io();

    $(window).resize(function () {
        setOalls();
    });

    // $('form').submit(function (e) {
    //     e.preventDefault(); // prevents page reloading
    //     socket.emit('chat message', $('#m').val());
    //     $('#m').val('');
    //     return false;
    // });
    socket.on('chat message', function (msg) {
        $('#messages').append($('<li>').text(msg));
    });

    $(document).on("click", '#ground', function (e) {
        startMessageAtLocation(e);
    });

    $(document).on("click", '.message', function (e) {
        e.stopPropagation();
    });

    $(document).on("click", '#submitlink', function (e) {
        e.stopPropagation();
        //TODO locate message parent and get id value to finish editing
    });

    setOalls();
    populate();

});

var oallht;
var oallwth;
var oallctr;
var winht;
var winwd;

function setOalls() {
    oallht = $(document).height();
    oallwth = $(document).width();
    winht = $(window).height();
    winwd = $(window).width();
    oallctr = {
        x: (oallwth / 2),
        y: (oallht / 2)
    };
}

myMessages = []

//Update the view with a new message stub+textarea, send message to server to emit
function startMessageAtLocation(e){
    var msgid = uuidv4();
    alert(e.pageX + ' , ' + e.pageY);
    var loc = determineRelLocation({x: e.pageX, y: e.pageY});
    var html = '<div class="message" id="'
     + msgid + '" style="left:' 
     + loc.x + 'vw; top:' 
     + loc.y + 'vw">'
     + '<div class"editpanel"><textarea></textarea><a id="submitlink"/><a id="removelink"/></div>'
     + '<div class="showpanel"><p></p><a id="editlink">Edit</a><a id="handle">O</a></div>'
     + '</div>';
    $('#ground').append(html);
    refreshDraggables();
    //Future enhancement: emit event to create placeholder element 
    startEditing($('#'+msgid));
}

//User has completed message, send to server to emit and close stub
function sendMessage(sender, e){
    var msgid = $(sender).attr('id');
    var loc = {
        x: $(sender).css('left'),
        y: $(sender).css('top')
    }
    var msg = {
        id: msgid,
        body: $('#m').val(),
        location: loc
    }
    cacheOwnedMessage(msg);
}

//Request messages from the server and add them to the view
function populate(msgcoll){
    //foreach message addLocatedElement
    refreshDraggables();
}

function refreshDraggables(){
    $(".message").draggable({
        revert: false,
        start: function () {
            dragging = $(this)
            clickbuffer = false;
        },
        stop: function (event, ui) {
            alert(ui.position);
        }
    });
}

//Open message editing interface after checking against cached list of owned messages
function startEditing(sender){
    var msgid = $(sender).attr('id');
    sender.addClass('editing');
}

function finishEditing(discard = null, message){
    var id = '#' + message.id;
    if(discard){
        $(id).remove();
        socket.emit('remove', message.id);
        return;
    }
    socket.emit('message', message);
    cacheOwnedMessage(message);
}

//Determine a relative location for an element based on its pixel space location
function determineRelLocation(position){
    //TODO given pixel location, return vw unit location
    var vwinpx = 100/winwd; //vw per pixel
    return {x: position.x * vwinpx, y: position.y * vwinpx};
}

//Based on a socket .updateLocation call or a user's own drag
function updateRelLocation(){}

//A new element has to be added and it has relative locating coords- add it to the view
function addLocatedElement(){}

function cacheOwnedMessage(msg){
    //TODO check for id in msg list
    var found = myMessages.find(({id}) => id === msg.id);
    if(found){
        found.body = msg.body
    } else {
        myMessages.push(msg);
    }

}

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}