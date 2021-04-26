//TODO: given structure from renderall, support timed playback of deltas.
//TODO: set up callbacks for add, update, remove.
//TODO: set up support for scrubbing

function PlaybackController(options, timeseries){
    if(!timeseries) return;
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
        var myVar = setInterval(this.iterate, this.options.rate);
    }
    this.iterate = function(){
        var _now = +new Date(); //millis basically
        if(this._frame === 0){
            _started = _now; //baselines
            _original_start = timeseries.UTS;
        }
        _elapsed += (_now - _started);
        _m_elapsed = _original_start + _elapsed; //current moment mapped to span of original timeseries

        this._frame++;
    }
    this.pauseplayback = function(){
        //clear interval and update interal flags basically
    }
    this.update = function(){
        //check for existing note and update
        //or create and add to _rendered
    }
}