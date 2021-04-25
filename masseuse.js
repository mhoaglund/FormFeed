var async = require('async');
//TODO: create method to prep a set of message entities and history entities, such that they are playable and have the right dictionaries.

module.exports.renderTimeSeries = function (_messageset, _cb){
    var _ts = [];
    //Build time and key dictionary
    async.each(_messageset.deltas.value, function(_delta, callback) {
        console.log('Processing delta ' + _delta.parentID + "::" + _delta.ident);
        var _uts = new Date(_delta.Timestamp).getTime(); 
        _ts.push({
            "RowKey":_delta.RowKey,
            "Timestamp":_delta.Timestamp,
            "UTS": _uts,
            "UTS_R":Math.round(_uts/100)*100
        })
        callback();
    }, function(err) {
        if( err ) {
          console.log('Bad delta found, why?');
        } else {
            //Sort delta dictionary according to time asc
            async.sortBy(_ts, function(_current, callback) {
                callback(null, _current.Timestamp);
            }, function(err, results) {
                _messageset.timeseries = results;
            });
            _messageset.duration = getDuration(_messageset.timeseries[0].Timestamp, _messageset.timeseries[_messageset.timeseries.length-1].Timestamp)
            //TODO: add relative placement values according to total MS
          console.log('All deltas have been processed successfully');
        }
    });

    _cb(_messageset);
    //TODO 1: loop through and find key relationships, and create "banding" arrangement with sources and deltas.
    //TODO 2: loop through a grab delta keys and timestamps, and create a time-sorted dictionary of these pairs.
    
}

///
//Returns MS duration of timespan
///
function getDuration(_start, _end){
    var beginning = new Date(_start);
    var end = new Date(_end);
    var diff = end.getTime() - beginning.getTime();
    console.log(diff);
    return diff;
}

