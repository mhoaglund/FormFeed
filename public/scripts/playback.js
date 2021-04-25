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

    this.startplayback = function(){
        //start setinterval, calling iterate at options.rate
    }
    this.iterate = function(_uts){
        //where are we in time? look up deltas we need to be applying.
    }
    this.pauseplayback = function(){
        //clear interval and update interal flags basically
    }
    this.update = function(){
        //check for existing note and update
        //or create and add to _rendered
    }
}