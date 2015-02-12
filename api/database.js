(function () {
    'use strict';

    var _logger = null;

    var _list = function (client, params, callback) {
        client.listBuckets(function (error, buckets) {
            if (error) {
                return callback(error, null);
            }
            else {
                return callback(null, buckets);
            }
        });
    };

    var _create = function (client, params, callback) {
        var id = params.id;
        if (id && id.length > 0) {
            _list(client, { id: id }, function (error, buckets) {
                if (error) {
                    return callback(error, null);
                }
                else {
                    if (buckets && buckets.length > 0) {
                        return callback('Bucket with id [' + id + '] exists.', null);
                    }
                    else {
                        client.createDatabase({ id: id }, function (error, db) {
                            if (error) {
                                return callback(error, null);
                            }
                            else {
                                return callback(null, db);
                            }
                        });
                    }
                }
            });
        }
        else {
            callback('Bucket id was null or empty.', null);
        }
    };

    var _removeDirect = function (client, params, callback) {
        var resourceId = params.resourceId;
        var selfLink = params.selfLink || ('buckets/' + resourceId);
        client.deleteDatabase(selfLink, function (error) {
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
        if (id && id.length > 0) {
            _list(client, { id: id }, function (error, buckets) {
                if (error) {
                    return callback(error);
                }
                else {
                    if (buckets && buckets.length > 0) {
                        if (buckets.length > 1) {
                            return callback('Multiple buckets with same id [' + id + '].');
                        }
                        else {
                            _removeDirect(client, { selfLink: buckets[0]['_self'] }, callback);
                        }
                    }
                    else {
                        return callback('Bucket with id [' + id + '] does not exist.');
                    }
                }
            });
        }
        else {
            return callback('Bucket id was null or empty.');
        }
    };

    module.exports = function (logger) {
        _logger = logger;

        return {
            list: _list,
            create: _create,
            remove: _remove,
            removeDirect: _removeDirect
        };
    };
})();