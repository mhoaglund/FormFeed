//TODO: given structure from renderall, support timed playback of deltas.
//TODO: set up callbacks for add, update, remove.
//TODO: set up support for scrubbing

//Takes options, a collection of time segments dictating when events occur, and a collection of events.
//TODO: durational event support!
function PlaybackController(options, series, events){
    if(!events) return;
    let defaultoptions = {
        rate: 100
    }
    options = { ...defaultoptions, ...options};
    let _this = this;
    let _ms = 0;
    let _series = timeseries;
    let _rendered = [];
    let _frame = 0;
    let _started = 0;
    let _elapsed = 0;
    let _m_elapsed = 0;
    let _original_start = 0;
    let _timer;

    this.startplayback = function(){
        //start setinterval, calling iterate at options.rate
        _timer = setInterval(this.iterate, this.options.rate);
    }
    this.iterate = function(){
        var _now = +new Date(); //millis basically
        if(this._frame === 0){
            _started = _now; //baselines
            _original_start = timeseries.UTS;
        }
        _elapsed += (_now - _started);
        _m_elapsed = _original_start + _elapsed; //current moment mapped to span of original timeseries
        console.log('Iterated');
        this._frame++;
    }
    this.pauseplayback = function(_reset = null){
        console.log('Stopping. Resetting?' + _reset ? ' Yes' : ' No');
        clearInterval(_timer);
        _elapsed = _reset ? 0 : _elapsed;
        _m_elapsed = _reset ? 0 : _m_elapsed;
        //clear interval and update interal flags basically
    }
    this.update = function(){
        //check for existing note and update
        //or create and add to _rendered
    }
    this.startplayback();
}
var deltas;
function testrender(){
    var topic = 'new';
    var refresh_endpoint = '/renderall' + '?topic=' + topic;
    var posts = $.ajax({
        type: 'GET',
        url: refresh_endpoint,
        data: null,
        dataType: 'html'
    });
    posts.done(function (data, textStatus, jqXHR) {
        var json = JSON.parse(data);
        initPlayback(json.series);
    });
    posts.always(function () {

    })

}

function initPlayback(_ts){
    var playbackControl = new PlaybackController({
        rate: 100
    }, _ts.segseries, _ts.dict);
}

$(function () {
    testrender();
});
