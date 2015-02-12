(function () {
    'use strict';

    var _logger = null;

    var _list = function (client, params, callback) {
        var id = params.id;
        var databaseLink = params.databaseLink;
        var query = 'SELECT * FROM ROOT' + (id ? ' r WHERE r.id = "' + id + '"' : '');
        client.queryCollections(databaseLink, query).toArray(function (error, cols) {
            if (error) {
                return callback(error, null);
            }
            else {
                return callback(null, cols);
            }
        });
    };

    var _create = function (client, params, callback) {
        var id = params.id;
        var databaseLink = params.databaseLink;
        if (id && id.length > 0) {
            _list(client, params, function (error, cols) {
                if (error) {
                    return callback(error, null);
                }
                else {
                    if (cols && cols.length > 0) {
                        return callback('Collection with id [' + id + '] exists in database [' + databaseLink + '] .', null);
                    }
                    else {
                        client.createCollection(databaseLink, { id: id }, function (error, col) {
                            if (error) {
                                return callback(error, null);
                            }
                            else {
                                return callback(null, col);
                            }
                        });
                    }
                }
            });
        }
        else {
            callback('Collection id was null or empty.', null);
        }
    };

    var _removeDirect = function (client, params, callback) {
        var selfLink = params.selfLink;
        client.deleteCollection(selfLink, function (error) {
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
        var databaseLink = params.databaseLink;
        if (id && id.length > 0) {
            _list(client, params, function (error, cols) {
                if (error) {
                    return callback(error);
                }
                else {
                    if (cols && cols.length > 0) {
                        if (cols.length > 1) {
                            return callback('Multiple collections with same id [' + id + '] in database [' + databaseLink + '].');
                        }
                        else {
                            _removeDirect(client, { selfLink: cols[0]['_self'] }, callback);
                        }
                    }
                    else {
                        return callback('Collection with id [' + id + '] does not exist in database [' + databaseLink + '].');
                    }
                }
            });
        }
        else {
            return callback('Collection id was null or empty.');
        }
    };

    module.exports = function (logger) {
        _logger = logger;

        return {
            list: _list,
            create: _create,
            remove: _remove,
            removeDirect: _removeDirect,
            validate: function (params, callback) {
                if (params.databaseLink && params.databaseLink.length > 0) {
                    return callback(null);
                }
                else {
                    return callback('Miss database link in request: ' + JSON.stringify(params, null, 2));
                }
            }
        };
    };
})();