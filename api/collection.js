(function () {
    'use strict';

    var util = require('util');

    var _logger = null;

    var _list = function (client, params, callback) {
        _logger.debug("collection._list params = %s", util.inspect(params));
        var id = params.id;
        client.listViews(id, function (error, views) {
            if (error) {
                return callback(error, null);
            }
            else {
                return callback(null, views);
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