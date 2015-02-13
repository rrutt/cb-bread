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

    module.exports = function (logger) {
        _logger = logger;

        return {
            list: _list
        };
    };
})();