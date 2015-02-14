(function () {
    'use strict';

    var _logger = null;

    var _list = function (client, params, callback) {
        var id = params.id;
        var bucketName = params.bucketId;
        var designDocViewName = params.viewId;
        
        var keyPrefix = null;  // TODO: Add to params.
        var skipCount = 0;  // TODO: Add to params.
        var pageSize = 3;  // TODO: Add to params.
        client.listDocuments(bucketName, designDocViewName, keyPrefix, skipCount, pageSize, function (error, data) {
            if (error) {
                return callback(error, null);
            }
            else {
                return callback(null, data);
            }
        });
    };

    var _create = function (client, params, callback) {
        var body = params.body || {};
        var collectionId = params.collectionId;
        if (body.id && body.id.length > 0) {
            _select(client, { id: body.id, collectionId: collectionId }, function (error, cols) {
                if (error) {
                    return callback(error, null);
                }
                else {
                    if (cols && cols.length > 0) {
                        return callback('Document with id [' + body.id + '] exists in collection [' + collectionId + '] .', null);
                    }
                    else {
                        client.createDocument(collectionId, body, function (error, doc) {
                            if (error) {
                                return callback(error, null);
                            }
                            else {
                                return callback(null, doc);
                            }
                        });
                    }
                }
            });
        }
        else {
            return callback('Document id was null or empty.', null);
        }
    };

    var _removeDirect = function (client, params, callback) {
        var selfLink = params.selfLink;
        client.deleteDocument(selfLink, function (error) {
            if (error) {
                return callback(error);
            }
            else {
                return callback(null);
            }
        });
    };

    var _remove = function (client, params, callback) {
        var id = params.id;
        var collectionId = params.collectionId;
        if (id && id.length > 0) {
            _select(client, params, function (error, docs) {
                if (error) {
                    return callback(error);
                }
                else {
                    if (docs && docs.length > 0) {
                        if (docs.length > 1) {
                            return callback('Multiple documents with same id [' + id + '] in collection [' + collectionId + '].');
                        }
                        else {
                            _removeDirect(client, { selfLink: docs[0]['_self'] }, callback);
                        }
                    }
                    else {
                        return callback('Document with id [' + id + '] does not exist in collection [' + collectionId + '].');
                    }
                }
            });
        }
        else {
            return callback('Document id was null or empty.');
        }
    };

    var _updateDirect = function (client, params, callback) {
        var selfLink = params.selfLink;
        var body = params.body;
        client.replaceDocument(selfLink, body, function (error, doc) {
            if (error) {
                return callback(error, null);
            }
            else {
                return callback(null, doc);
            }
        });
    };

    var _update = function (client, params, callback) {
        var body = params.body || {};
        var collectionId = params.collectionId;
        if (body.id && body.id.length > 0) {
            _select(client, { id: body.id, collectionId: collectionId }, function (error, docs) {
                if (error) {
                    return callback(error);
                }
                else {
                    if (docs && docs.length > 0) {
                        if (docs.length > 1) {
                            return callback('Multiple documents with same id [' + body.id + '] in collection [' + collectionId + '].');
                        }
                        else {
                            _updateDirect(client, { selfLink: docs[0]['_self'], body: body }, callback);
                        }
                    }
                    else {
                        return callback('Document with id [' + body.id + '] does not exist in collection [' + collectionId + '].');
                    }
                }
            });
        }
        else {
            return callback('Document id was null or empty.');
        }
    };

    module.exports = function (logger) {
        _logger = logger;

        return {
            list: _list,
            create: _create,
            update: _update,
            remove: _remove,
            validate: function (params, callback) {
                if ((params.bucketId && params.bucketId.length > 0) && (params.viewId && params.viewId.length > 0)) {
                    return callback(null);
                }
                else {
                    return callback('Missing bucketId and/or viewId in request: ' + JSON.stringify(params, null, 2));
                }
            }
        };
    };
})();