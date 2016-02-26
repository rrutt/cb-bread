(function () {
    'use strict';

    var _logger = null;

    var _list = function (client, params, callback) {
        var host = params.host;
        var bucketName = params.bucketId;
        var designDocViewName = params.viewId;        
        var keyPrefix = params.keyPrefix;
        var skipCount = params.skipCount;
        var pageSize = params.pageSize;
        var docFilter = params.docFilter;
        var queryTimeoutSeconds = params.queryTimeoutSeconds;

        client.listDocuments(host, bucketName, designDocViewName, keyPrefix, skipCount, pageSize, docFilter, queryTimeoutSeconds, function (error, resultSet) {
            if (error) {
                return callback(error, null);
            }
            else {
                return callback(null, resultSet);
            }
        });
    };

    var _createOrReplace = function (client, params, callback) {
        var host = params.host;
        var bucketName = params.bucketId;
        var docId = params.docId;
        var docBody = params.docBody || {};
        if (docId && docId.length > 0) {
            client.createOrReplaceDocument(host, bucketName, docId, docBody, function (error, result) {
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
        var host = params.host;
        var bucketName = params.bucketId;
        var docId = params.docId;
        if (docId && docId.length > 0) {
            client.deleteDocument(host, bucketName, docId, function (error, result) {
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

    var _purge = function (client, params, callback) {
        var host = params.host;
        var bucketName = params.bucketId;
        var docIds = params.docIds;
        if (docIds && docIds.length > 0) {
            client.purgeDocuments(host, bucketName, docIds, function (error, result) {
                if (error) {
                    return callback(error, null);
                }
                else {
                    // Perform a "Requery" action.
                    _list(client, params, callback);
                }
            });
        }
        else {
            return callback('Document Id list was null or empty.', null);
        }
    };

    module.exports = function (logger) {
        _logger = logger;

        return {
            list: _list,
            createOrReplace: _createOrReplace,
            delete: _delete,
            purge: _purge,
            validate: function (params, callback) {
                var validBucketParams =
                    (params.host && params.host.length > 0) &&
                    (params.bucketId && params.bucketId.length > 0) &&
                    (params.viewId && params.viewId.length > 0);
                var validDocParams =
                    (params.host && params.host.length > 0) &&
                    (params.bucketId && params.bucketId.length > 0) &&
                    ((params.docId && params.docId.length > 0) || (params.docIds && params.docIds.length > 0));
                    
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