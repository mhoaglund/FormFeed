//TODO: create method to prep a set of message entities and history entities, such that they are playable and have the right dictionaries.

module.exports.renderTimeSeries = function (_messageset, _cb){
    console.log("Got it!");
    _cb(_messageset);
    //TODO 1: loop through and find key relationships, and create "banding" arrangement with sources and deltas.
    //TODO 2: loop through a grab delta keys and timestamps, and create a time-sorted dictionary of these pairs.
    
}