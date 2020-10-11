var socket = io();
var topic = "message";
$(function () {
    var _topic = getParameterByName('topic');
    if(_topic){
        topic = _topic;
    }

    $(window).resize(function () {
        setOalls();
    });

    socket.on('create_message', function (msg) {
        if(msg.topic !== topic){
            return;
        }
        if($('#'+msg.id).length){
            console.log("Already have this one somehow.");
            return;
        }
        createMessageAtLocation(msg);
    });

    socket.on('alert', function (msg) {
        if (msg.topic === 'alert_' + topic) {
            displayAlert(msg.body);
        }
    });

    socket.on('update_message', function (msg) {
        if (msg.topic !== topic) {
            return;
        }
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

    $(document).on("click", '#alertbtn', function (e) {
        e.stopPropagation();
        toggleAlertInterface();
    });


    $(document).on("click", '.message', function (e) {
        e.stopPropagation();
    });

    $(document).on("click", '#closealert', function (e) {
        e.stopPropagation();
        clearAlert();
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
        if (msgparent.length > 0) {
            discardChanges(msgparent.attr('id'));
        } else {
            msgparent = $(this).parents('#alertblock');
            if (msgparent.length > 0) {
                toggleAlertInterface(true);
            }
        }
    });

    $(document).on("click", '.color-picker-item', function (e) {
        e.stopPropagation();
        var color = $(this).attr('id');
        var parent = $(this).parents('.message');
        parent.data('temp-color', color);
        setColor(parent, parent.data('temp-color'));
    });

    $(document).on("click", '.depth-picker-item', function (e) {
        e.stopPropagation();
        var depth = $(this).attr('id');
        var parent = $(this).parents('.message');
        var current_depth = parent.data('temp-depth');

        if (depth === 'up' && current_depth < 1000) {
            current_depth += 1;
        }
        if (depth === 'down' && current_depth > 0) {
            current_depth -= 1;
        }
        if (depth === 'top') {
            current_depth = 1000;
        }
        if (depth === 'btm'){
            current_depth = 0;
        }
        parent.data('temp-depth', current_depth);
        setDepth(parent, parent.data('temp-depth'));
    });

    $(document).on("click", '#submitlink', function (e) {
        e.stopPropagation();
        //TODO locate message parent and get id value to finish editing
        var msgparent = $(this).parents('.message');
        if (msgparent.length > 0) {
            finishEditing(msgparent.attr('id'));
        } else {
            msgparent = $(this).parents('#alertblock');
            if (msgparent.length > 0) {
                sendAlert();
            }
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

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

myMessages = []
mySettings = []
_mySettings = {}
myExpectedSettings = ['colors', 'types', 'depths']

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
    if(!msg.depth) {
        msg.depth = 0;
    }
    $(_id +' .editpanel textarea').width(msg.size.wd).height(msg.size.ht);
    $(_id +' .showpanel p.msgbody').width(msg.size.wd).height(msg.size.ht);
    $(_id +' .showpanel p.msgbody').text(msg.body);
    $(_id +' .editpanel textarea').val(msg.body);
    $(_id).data('dwidth', msg.size.wd);
    $(_id).data('dheight', msg.size.ht);
    $(_id).data('color', msg.color);
    $(_id).data('topic',msg.topic);
    $(_id).data('depth', msg.depth);
    $(_id).data('temp-depth', msg.depth);
    $(_id).addClass(msg.color);
    $(_id).css({'z-index': msg.depth});
    $(_id + ' #depth_indicator').text(msg.depth);
    refreshDraggables();
}

function buildHTMLMessage(id, x, y){
    return '<div class="message" id="' +
        id + '" style="left:' +
        x + '; top:' +
        y + '">' +
        '<aside id="depth_indicator">0</aside>'+
        '<div class="editpanel">' +
        '<textarea></textarea>' +
        '<div><a id="submitlink">Submit</a><a id="discardlink">Discard</a></div>' +
        buildSettingsInterface() +
        '</div>' +
        '<div class="showpanel"><p class="msgbody"></p><div><a id="editlink">Edit</a></div></div>' +
        '</div>';
}

function displayAlert(alert){
    $('#ground').addClass('alerted');
    $('#showalert').show();
    if(alert === ''){
        alert = '---'
    }
    $('#showalert h1').html(alert);
}

function clearAlert(){
    $('#ground').removeClass('alerted');
    $('#showalert').hide();
    $('#showalert h1').html('');
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
        if (setting.RowKey == 'colors') {
            html += '<div class="' + setting.RowKey + '-picker">'
            arrFromCSL(setting.body).forEach(function (item) {
                html += '<div class="color-picker-item ' + item + '" id="' + item + '"></div>'
            });
            html += '</div>'
        }
        if(setting.RowKey == 'depths') {
            html += '<div class="' + setting.RowKey + '-picker">'
            arrFromCSL(setting.body).forEach(function (item) {
                html += '<div class="depth-picker-item ' + item + '" id="' + item + '"><span>'+ item +'</span></div>'
            });
            html += '</div>'
        }
    })
    return html;
}

alertOpen = false;
function toggleAlertInterface(_clear){
    if (_clear) {
        $('#alertblock .editpanel textarea').val('');
    }
    if (!alertOpen) {
        $('#alertblock .editpanel').show();
        alertOpen = true;
        return;
    } 
    if (alertOpen){
        $('#alertblock .editpanel').hide();
        alertOpen = false;
        return;
    }

}

function updateMessage(msg){
    $('#' + msg.id).css({
        'top':msg.location.y,
        'left':msg.location.x
    });
    reset_animation(msg.id);
    $('#' + msg.id).data('color',msg.color);
    $('#' + msg.id).data('depth', msg.depth);
    setColor($('#' + msg.id), $('#' + msg.id).data('color'));
    setDepth($('#' + msg.id), $('#' + msg.id).data('depth'));
    $('#' + msg.id + ' .editpanel textarea').width(msg.size.wd).height(msg.size.ht);
    $('#' + msg.id + ' .showpanel p.msgbody').width(msg.size.wd).height(msg.size.ht);

    $('#' + msg.id + ' .editpanel textarea').val(msg.body);
    $('#' + msg.id + ' .showpanel p.msgbody').text(msg.body);
}

function reset_animation(id) {
    var el = document.getElementById(id);
    el.style.animation = 'none';
    el.offsetHeight; /* trigger reflow */
    el.style.animation = null;
}

function setColor(sender, _color){
    arrFromCSL(_mySettings.colors.body).forEach(function (item){
        sender.removeClass(item);
    })
    sender.addClass(_color);
}

function setDepth(sender, _zind) {
    sender.css({'z-index': _zind});
    $(sender).find('#depth_indicator').text(_zind);
}

function clearUnsubmitted(){
    $('.unsubmitted').remove();
}

function getMessage(id){
    var _topic = topic;
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
        color: $('#' + id).data('color'),
        topic: _topic,
        depth: $('#' + id).data('depth')
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
    var refresh_endpoint = '/refresh' + '?topic=' + topic;
    var posts = $.ajax({
        type: 'GET',
        url: refresh_endpoint,
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
        setTitle(topic);
    })

}

function setTitle(_title){
    if(_title === 'message'){
        _title = 'Home'
    }
    $('#title').text(_title);
    $('#titleblock').show();
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
            reset_animation(event.target.id);
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

function finishEditing(_id, discard = null) {
    var id = '#' + _id;
    if(discard){
        $(id).remove();
        socket.emit('remove', _id);
        return;
    }
    copyBody(_id);
    $(id).data('color', $(id).data('temp-color')); //Save the selected color
    $(id).data('topic', topic);
    $(id).data('depth', $(id).data('temp-depth'));
    var message = getMessage(_id);

    if($(id).hasClass('unsubmitted')){
        $(id).removeClass('unsubmitted');
        socket.emit('submit', message);
    } else {
        socket.emit('update', message);
    }
    $(id).removeClass('editing');
    reset_animation(_id);
    cacheOwnedMessage(message);
}

function sendAlert(){
    socket.emit('alert', {
        'topic': 'alert_' + topic,
        'body': $('#alertblock .editpanel textarea').val()
    });
    toggleAlertInterface(true);
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
        setDepth($(id), $(id).data('depth'));
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