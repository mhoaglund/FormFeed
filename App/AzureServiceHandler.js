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

function newRowKey(){
    var invertedTicks = String(8640000000000000 - Date.now()).padStart(20, '0');
    return invertedTicks;
}

//Continuation token stuff: https://coderead.wordpress.com/2012/08/20/handling-continuation-tokens-with-node-js-on-windows-azure-table-storage/
module.exports.getEntities = function (_clienttoken = null, _cb) {
    var query = new azure.TableQuery()
        .top(config.get('appconfig.maxentities'))
        .where('PartitionKey eq ?', config.get('appconfig.partkey'));

    tableService.queryEntities(config.get('appconfig.tablecontainer'), query, _clienttoken, function (error, result, response) {
        if (!error) {
            // result.entries contains entities matching the query
            if (result.continuationToken) {
                var token = result.continuationToken;
            }
            _cb(result.entries, token);
        } else {
            _cb("Nope");
        }
    });
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