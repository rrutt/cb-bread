(function () {
    'use strict';

    var _logger = null;

    var _query = function (client, params, callback) {
        var host = params.host;
        var n1qlQuery = params.n1qlQuery;

        client.queryDocuments(host, n1qlQuery, function (error, resultSet) {
            if (error) {
                return callback(error, null);
            }
            else {
                return callback(null, resultSet);
            }
        });
    };
    
    module.exports = function (logger) {
        _logger = logger;

        return {
            query: _query,
            validate: function (params, callback) {
                var validQueryParams =
                    (params.host && params.host.length > 0);
                    
                if (validQueryParams) {
                    return callback(null);
                }
                else {
                    return callback('Invalid parameters in query request: ' + JSON.stringify(params, null, 2));
                }
            }
        };
    };
})();