(function () {
    'use strict';

    var _logger = null;

    var _list = function (client, params, callback) {
        var bucketName = params.bucketId;
        var designDocViewName = params.viewId;        
        var keyPrefix = params.keyPrefix;
        var skipCount = params.skipCount;
        var pageSize = params.pageSize;
        
        client.listDocuments(bucketName, designDocViewName, keyPrefix, skipCount, pageSize, function (error, data) {
            if (error) {
                return callback(error, null);
            }
            else {
                return callback(null, data);
            }
        });
    };

    var _createOrReplace = function (client, params, callback) {
        var bucketName = params.bucketId;
        var docId = params.docId;
        var docBody = params.docBody || {};
        if (docId && docId.length > 0) {
            client.createOrReplaceDocument(bucketName, docId, docBody, function (error, result) {
                if (error) {
                    return callback(error, null);
                }
                else {
                    return callback(null, result);
                }
            });
        }
        else {
            return callback('Document ID was null or empty.', null);
        }
    };

    var _delete = function (client, params, callback) {
        var bucketName = params.bucketId;
        var docId = params.docId;
        if (docId && docId.length > 0) {
            client.deleteDocument(bucketName, docId, function (error, result) {
                if (error) {
                    return callback(error, null);
                }
                else {
                    return callback(null, result);
                }
            });
        }
        else {
            return callback('Document ID was null or empty.', null);
        }
    };

    module.exports = function (logger) {
        _logger = logger;

        return {
            list: _list,
            createOrReplace: _createOrReplace,
            delete: _delete,
            validate: function (params, callback) {
                var validBucketParams =
                    (params.bucketId && params.bucketId.length > 0) &&
                    (params.viewId && params.viewId.length > 0);
                var validDocParams = 
                    (params.bucketId && params.bucketId.length > 0) &&
                    (params.docId && params.docId.length > 0);
                    
                if (validBucketParams || validDocParams) {
                    return callback(null);
                }
                else {
                    return callback('Invalid parameters in document request: ' + JSON.stringify(params, null, 2));
                }
            }
        };
    };
})();