var azure = require('azure-storage');
var async = require('async');
var blobService = azure.createBlobService();
var tableService = azure.createTableService();
var entGen = azure.TableUtilities.entityGenerator;
const config = require('config');

var path = require('path');

const {
    v4: uuidv4
} = require('uuid');

const maxDate = new Date(8640000000000000);

const keyMap = []

function newRowKey(){
    var invertedTicks = String(8640000000000000 - Date.now()).padStart(20, '0');
    return invertedTicks;
}

module.exports.Import = function(_payload, _cb){
    // var msg = {
    //     id: id,
    //     body: $('#' + id).find('textarea').val(),
    //     location: _loc,
    //     size: _size
    // }
    var date = new Date();
    var rk = newRowKey();
    var now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
        date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
    var _row = {
        PartitionKey: entGen.String(config.get('appconfig.partkey')),
        RowKey: entGen.String(rk),
        uploaded: entGen.DateTime(new Date(now_utc)),
        ident: entGen.String(_payload.id),
        body: entGen.String(_payload.body),
        location: entGen.String(JSON.stringify(_payload.location)),
        size: entGen.String(JSON.stringify(_payload.size))
    }
    tableUpload(_row, function(result){
        keyMap.push({
            id: _payload.id,
            rowKey: rk
        })
        console.log(keyMap)
        _cb(result);
    })
}

module.exports.Update = function(_payload, _cb){
    let found = keyMap.find(o => o.id === _payload.id);
    var rk;
    var date = new Date();
    var now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
        date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
    if (!found) {
        rk = newRowKey();
        console.log('Entity not listed, creating new rowKey')
        keyMap.push({
            id: _payload.id,
            rowKey: rk
        })
    } else {
        rk = found.rowKey;
        console.log('Updating existing entity...')
    }
    var _row = {
        PartitionKey: entGen.String(config.get('appconfig.partkey')),
        RowKey: entGen.String(rk),
        uploaded: entGen.DateTime(new Date(now_utc)),
        ident: entGen.String(_payload.id),
        body: entGen.String(_payload.body),
        location: entGen.String(JSON.stringify(_payload.location)),
        size: entGen.String(JSON.stringify(_payload.size))
    }
    tableInsertOrReplace(_row, function(result){
        _cb(result);
    })
}

//Continuation token stuff: https://coderead.wordpress.com/2012/08/20/handling-continuation-tokens-with-node-js-on-windows-azure-table-storage/
module.exports.getEntities = function (_clienttoken = null, _cb) {
    var query = new azure.TableQuery()
        .top(config.get('appconfig.maxentities'))
        .where('PartitionKey eq ?', config.get('appconfig.partkey'));

    tableService.queryEntities(config.get('appconfig.tablecontainer'), query, _clienttoken,{payloadFormat:"application/json;odata=nometadata"}, function (error, result, response) {
        if (!error) {
            // result.entries contains entities matching the query
            if (result.continuationToken) {
                var token = result.continuationToken;
            }
            response.body.value.forEach(function(entity){
                let found = keyMap.find(o => o.id === entity.ident);
                if(!found){
                    console.log('Updating entity cache...')
                    keyMap.push({
                        id: entity.ident,
                        rowKey: entity.RowKey
                    })
                }
            })
            _cb(response.body, token);
        } else {
            _cb("Nope");
        }
    });
    //TODO update rowkey dictionary locally
}

module.exports.getEntity = function (_rowKey, _cb) {
    var query = new azure.TableQuery()
        .top(1)
        .where('RowKey eq ?', '_rowKey');
    tableService.retrieveEntity(config.get('appconfig.tablecontainer'), config.get('appconfig.partkey'), _rowKey, function (error, result, response) {
        if (!error) {
            // result.entries contains entities matching the query
            _cb(result[0]);
        } else {
            _cb("Nope");
        }
    })
}

function blobUpload(_inputfile) {
    if (!_inputfile) return;
    blobService.createBlockBlobFromLocalFile(config.get('appconfig.blobcontainer'), _inputfile.filename, _inputfile.path, function (error, result, response) {
        if (!error) {
            // file uploaded
            console.log("blob upload: Upload success")
            return true;
        } else {
            return false;
        }
    });
};

module.exports.blobUpload = blobUpload;

module.exports.blobUploadAsync = function (_inputfile, _cb) {
    if (!_inputfile) return;
    blobService.createBlockBlobFromLocalFile(config.get('appconfig.blobcontainer'), _inputfile.filename, _inputfile.path + _inputfile.filename, function (error, result, response) {
        if (!error) {
            // file uploaded
            console.log("blob upload async: Upload success")
            _cb(true, _inputfile.path + _inputfile.filename);
        } else {
            _cb(false, null);
        }
    });
};

function tableUpload(_inputrow, callback) {
    tableService.insertEntity(config.get('appconfig.tablecontainer'), _inputrow, function (error, result, response) {
        if (!error) {
            console.log(result)
            callback(true);
        } else {
            console.log(error)
            callback(false);
        }
    });
}

function tableInsertOrReplace(_inputrow, callback) {
    tableService.insertOrReplaceEntity(config.get('appconfig.tablecontainer'), _inputrow, function (error, result, response) {
        if (!error) {
            console.log(result)
            callback(true);
        } else {
            console.log(error)
            callback(false);
        }
    });
}

module.exports.deleteBlob = function (_filename, _clusterid) {
    blobService.deleteBlobIfExists(config.get('appconfig.blobcontainer'), _filename, function (error, result, response) {
        if (!error) {
            console.log("Delete success")
            return true;
        } else {
            return false;
        }
    })
    return false;
};

module.exports.deleteRow = function (_rowKey, _partitionKey) {
    tableService.deleteEntity(config.get('appconfig.tablecontainer'), {
        PartitionKey: _partitionKey,
        RowKey: _rowKey
    }, function (error, result, response) {
        if (!error) {
            console.log("Delete entity successful")
            return true;
        } else {
            return false;
        }
    })
    return false;
};