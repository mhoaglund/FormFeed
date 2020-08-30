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

    $(document).on("click", '.color-picker-item', function (e) {
        e.stopPropagation();
        var color = $(this).attr('id');
        var parent = $(this).parents('.message');
        parent.data('temp-color', color);
        setColor(parent, parent.data('temp-color'));
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
mySettings = []
_mySettings = {}
myExpectedSettings = ['colors', 'types']

//Update the view with a new message stub+textarea, send message to server to emit
function startMessageAtLocation(e){
    clearUnsubmitted();
    var msgid = uuidv4();
    var html = buildHTMLMessage(msgid, e.pageX + 'px', e.pageY + 'px');
    $('#ground').append(html);
    $('#' + msgid).data('color', 'none');
    $('#' + msgid).addClass('unsubmitted');
    refreshDraggables();
    //Future enhancement: emit event to create placeholder element 
    startEditing($('#'+msgid));
}

function createMessageAtLocation(msg){
    var html = buildHTMLMessage(msg.id, msg.location.x, msg.location.y);
    $('#ground').append(html);
    var _id = '#' + msg.id;
    $(_id +' .editpanel textarea').width(msg.size.wd).height(msg.size.ht);
    $(_id +' .showpanel p.msgbody').width(msg.size.wd).height(msg.size.ht);
    $(_id +' .showpanel p.msgbody').text(msg.body);
    $(_id +' .editpanel textarea').val(msg.body);
    $(_id).data('dwidth', msg.size.wd);
    $(_id).data('dheight', msg.size.ht);
    $(_id).data('color', msg.color);
    $(_id).addClass(msg.color);
    refreshDraggables();
}

function buildHTMLMessage(id, x, y){
    return '<div class="message" id="' +
        id + '" style="left:' +
        x + '; top:' +
        y + '">' +
        '<div class="editpanel">' +
        '<textarea></textarea>' +
        '<div><a id="submitlink">Submit</a><a id="discardlink">Discard</a></div>' +
        buildSettingsInterface() +
        '</div>' +
        '<div class="showpanel"><p class="msgbody"></p><div><a id="editlink">Edit</a></div></div>' +
        '</div>';
}

function getSetting(setting, _cb = null){
        var req = $.ajax({
            type: 'GET',
            url: '/settings?PartKey=settings&RowKey=' + setting,
            data: (token) ? token : null,
            dataType: 'html'
        });
        var entities;
        req.done(function (data, textStatus, jqXHR) {
            entity = JSON.parse(data).reply;
            mySettings.push(entity);
            _mySettings[entity.RowKey] = entity;
        });
}

function buildSettingsInterface(){
    var html = ''
    mySettings.forEach(function (setting) {
        html += '<div class="' + setting.RowKey + '-picker">'
        arrFromCSL(setting.body).forEach(function (item) {
            if (setting.RowKey == 'colors') {
                html += '<div class="color-picker-item '+item+'" id="' + item + '"></div>'
            }
            // } else {
            //     html += '<a class="' + setting.RowKey + ' picker-item" id="' + setting.RowKey + '_' + item + '">' + item + '</a>'
            // }
        });
        html += '</div>'
    })
    return html;
}

function updateMessage(msg){
    $('#' + msg.id).css({
        'top':msg.location.y,
        'left':msg.location.x
    });
    $('#' + msg.id).data('color',msg.color);
    setColor($('#' + msg.id), $('#' + msg.id).data('color'));
    $('#' + msg.id + ' .editpanel textarea').width(msg.size.wd).height(msg.size.ht);
    $('#' + msg.id + ' .showpanel p.msgbody').width(msg.size.wd).height(msg.size.ht);

    $('#' + msg.id + ' .editpanel textarea').val(msg.body);
    $('#' + msg.id + ' .showpanel p.msgbody').text(msg.body);
}

function setColor(sender, _color){
    //set color on sender, clearing others
    arrFromCSL(_mySettings.colors.body).forEach(function (item){
        sender.removeClass(item);
    })
    sender.addClass(_color);
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
        size: _size,
        color: $('#' + id).data('color')
    }
    return msg;
}

//Request messages from the server and add them to the view
function populate(msgcoll){
    //foreach message addLocatedElement
    $(myExpectedSettings).each(function(){
        var _setting = this;
        getSetting(_setting);
    })
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
            if(item.color){
                console.log(item);
            }
            createMessageAtLocation(item);
        })
    });
    posts.always(function () {
        debouncing = false;
        refreshDraggables();
    })

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
    $(id).data('color', $(id).data('temp-color'));
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

function arrFromCSL(_csl, del = ','){
    return _csl.split(del);
}

//Revert
function discardChanges(_id){
    var id = '#' + _id;
    $(id).removeClass('editing');
    if ($(id).hasClass('unsubmitted')){
        $(id).remove();
    } else {
        $(id + ' .editpanel textarea').val($(id + ' .showpanel p.msgbody').html());
        setColor($(id), $(id).data('color'));
    }
}

//Caches the display size of the text and copies input text into display element
function copyBody(_id){
    var id = '#' + _id;
    $(id + ' .showpanel p.msgbody').text($(id + ' .editpanel textarea').val());
    var inputht = $(id).find('textarea').get(0).scrollHeight;
    var inputwd = $(id).find('textarea').width();
    $(id + ' .showpanel p.msgbody').css({
        'height': inputht,
        'width': inputwd
    })
    $(id).data('dwidth', inputwd);
    $(id).data('dheight', inputht);
}

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