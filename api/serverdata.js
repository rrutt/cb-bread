(function () {
    'use strict';

    var util = require('util');

    var _logger = null;

    var _config = function (client, params, callback) {
        var packageJson = require('../package.json');
        var serverConfig = {packageJson: packageJson};
        return callback(null, serverConfig);
    };

    module.exports = function (logger) {
        _logger = logger;

        return {
            allowsAnonymous: true,
            config: _config
        };
    };
})();