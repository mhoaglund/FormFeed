var socket = io();

$(function () {
    

    $(window).resize(function () {
        setOalls();
    });

    socket.on('create_message', function (msg) {
        if($('#'+msg.id).length){
            console.log("Already have this one somehow.");
            return;
        }
        createMessageAtLocation(msg);
    });

    socket.on('update_message', function (msg) {
        if (!$('#' + msg.id).length) {
            console.log("This message was missing. Creating...");
            createMessageAtLocation(msg);
            return;
        }
        updateMessage(msg);
    });

    $(document).on("click", '#ground', function (e) {
        startMessageAtLocation(e);
    });

    $(document).on("click", '.message', function (e) {
        e.stopPropagation();
    });

    $(document).on("click", '#editlink', function (e) {
        e.stopPropagation();
        var msgparent = $(this).parents('.message');
        if (msgparent) {
            startEditing(msgparent);
        }
    });

    $(document).on("click", '#discardlink', function (e) {
        e.stopPropagation();
        var msgparent = $(this).parents('.message');
        if (msgparent) {
            discardChanges(msgparent.attr('id'));
        }
    });

    $(document).on("click", '#submitlink', function (e) {
        e.stopPropagation();
        //TODO locate message parent and get id value to finish editing
        var msgparent = $(this).parents('.message');
        if(msgparent){
            finishEditing(msgparent.attr('id'));
        }
    });

    setOalls();
    populate();

});

var oallht;
var oallwth;
var oallctr;
var winht;
var winwd;
var token = undefined;

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
    clearUnsubmitted();
    var msgid = uuidv4();
    //alert(e.pageX + ' , ' + e.pageY);
    //var loc = determineRelLocation({x: e.pageX, y: e.pageY});
    var html = '<div class="message unsubmitted" id="'
     + msgid + '" style="left:' 
     +e.pageX + 'px; top:'
     +e.pageY + 'px">'
     + '<div class="editpanel"><textarea></textarea><div><a id="submitlink">Submit</a><a id="discardlink">Discard</a></div></div>'
     + '<div class="showpanel"><p class="msgbody"></p><div><a id="editlink">Edit</a></div></div>'
     + '</div>';
    $('#ground').append(html);
    refreshDraggables();
    //Future enhancement: emit event to create placeholder element 
    startEditing($('#'+msgid));
}

function createMessageAtLocation(msg){
    var html = '<div class="message" id="' +
        msg.id + '" style="left:' +
        msg.location.x + '; top:' +
        msg.location.y + '">' +
        '<div class="editpanel"><textarea></textarea><div><a id="submitlink">Submit</a><a id="discardlink">Discard</a></div></div>' +
        '<div class="showpanel"><p class="msgbody">' + msg.body + '</p><div><a id="editlink">Edit</a></div></div>' +
        '</div>';
    $('#ground').append(html);
    var _id = '#' + msg.id;
    $(_id +' .editpanel textarea').width(msg.size.wd).height(msg.size.ht);
    $(_id +' .showpanel p.msgbody').width(msg.size.wd).height(msg.size.ht);

    $(_id +' .editpanel textarea').val(msg.body);
    $(_id).data('dwidth', msg.size.wd);
    $(_id).data('dheight', msg.size.ht);
    refreshDraggables();
}

function updateMessage(msg){
    $('#' + msg.id).css({
        'top':msg.location.y,
        'left':msg.location.x
    })
    $('#' + msg.id + ' .editpanel textarea').width(msg.size.wd).height(msg.size.ht);
    $('#' + msg.id + ' .showpanel p.msgbody').width(msg.size.wd).height(msg.size.ht);

    $('#' + msg.id + ' .editpanel textarea').val(msg.body);
    $('#' + msg.id + ' .showpanel p.msgbody').html(msg.body);
}

function clearUnsubmitted(){
    $('.unsubmitted').remove();
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

function getMessage(id){
    var _loc = {
        x: $('#' + id).css('left'),
        y: $('#' + id).css('top')
    }
    var _size = {
        wd: $('#' + id).data('dwidth'),
        ht: $('#' + id).data('dheight')
    }
    var msg = {
        id: id,
        body: $('#' + id).find('textarea').val(),
        location: _loc,
        size: _size
    }
    return msg;
}

//Request messages from the server and add them to the view
function populate(msgcoll){
    //foreach message addLocatedElement
    var posts = $.ajax({
        type: 'GET',
        url: '/refresh',
        data: (token) ? token : null,
        dataType: 'html'
    });
    var entities;
    posts.done(function (data, textStatus, jqXHR) {
        if (jqXHR.getResponseHeader("Continuation-Token")) {
            token = $.parseJSON(jqXHR.getResponseHeader("Continuation-Token"));
        } else {
            reachedEnd = true;
            console.log("Reached end of posts.");
        }
        entities = JSON.parse(data).reply.value;
        entities.forEach(function(item){
            item.location = JSON.parse(item.location);
            item.size = JSON.parse(item.size);
            item.id = item.ident;
            createMessageAtLocation(item);
        })
    });
    posts.always(function () {
        debouncing = false;
    })
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
            if ($('#' + event.target.id).hasClass('unsubmitted')){
                console.log('moved an unsubmitted message box');
                return;
            }
            socket.emit('update', getMessage(event.target.id));
            //convertElementLocation($('#' + event.target.id));
            //TODO: event.target.id translate coords to vw
        }
    });
}

//Open message editing interface
//Future enhancement: ...after checking against cached list of owned messages
function startEditing(sender){
    var msgid = $(sender).attr('id');
    sender.addClass('editing');
}

// function removeMessage(sender){
//     if (!sender.hasClass('unsubmitted')){
//         socket.emit('update', getMessage(event.target.id));
//     }
// }

function finishEditing(_id, discard = null) {
    var id = '#' + _id;
    if(discard){
        $(id).remove();
        socket.emit('remove', _id);
        return;
    }
    copyBody(_id);
    var message = getMessage(_id);
    if($(id).hasClass('unsubmitted')){
        $(id).removeClass('unsubmitted');
        socket.emit('submit', message);
    } else {
        socket.emit('update', message);
    }
    $(id).removeClass('editing');
    cacheOwnedMessage(message);
}

//Determine a relative location for an element based on its pixel space location
function determineRelLocation(position){
    //TODO given pixel location, return vw unit location
    var vwinpx = 100/winwd; //vw per pixel
    return {x: position.x * vwinpx, y: position.y * vwinpx};
}

function convertElementLocation(element){
    var offset = element.offset();
    var updated = determineRelLocation({x: offset.left, y: offset.top});
    element.css({
        'top': updated.y + 'vw',
        'left': updated.x + 'vw'
    });
}

//Revert
function discardChanges(_id){
    var id = '#' + _id;
    $(id).removeClass('editing');
    if ($(id).hasClass('unsubmitted')){
        $(id).remove();
    } else {
        $(id + ' .editpanel textarea').val($(id + ' .showpanel p.msgbody').html());
    }

}

//Caches the display size of the text and copies input text into display element
function copyBody(_id){
    var id = '#' + _id;
    $(id + ' .showpanel p.msgbody').html($(id + ' .editpanel textarea').val());
    var inputht = $(id).find('textarea').get(0).scrollHeight;
    var inputwd = $(id).find('textarea').width();
    $(id + ' .showpanel p.msgbody').css({
        'height': inputht,
        'width': inputwd
    })
    $(id).data('dwidth', inputwd);
    $(id).data('dheight', inputht);
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