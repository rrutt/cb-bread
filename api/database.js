(function () {
    'use strict';

    var _logger = null;

    var _list = function (client, params, callback) {
        var host = params.host;
        client.listBuckets(host, function (error, buckets) {
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