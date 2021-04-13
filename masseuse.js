var async = require('async');
//TODO: create method to prep a set of message entities and history entities, such that they are playable and have the right dictionaries.

module.exports.renderTimeSeries = function (_messageset, _cb){
    var _ts = [];
    //Build time and key dictionary
    async.each(_messageset.deltas.value, function(_delta, callback) {
        console.log('Processing delta ' + _delta.parentID + "::" + _delta.ident);
        _ts.push({
            "RowKey":_delta.RowKey,
            "Timestamp":_delta.Timestamp
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
          console.log('All deltas have been processed successfully');
        }
    });

    _cb(_messageset);
    //TODO 1: loop through and find key relationships, and create "banding" arrangement with sources and deltas.
    //TODO 2: loop through a grab delta keys and timestamps, and create a time-sorted dictionary of these pairs.
    
}

