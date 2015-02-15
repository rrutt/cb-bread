(function () {
    'use strict';

    var util = require('util');

    var _logger = null;
    var _argv = null;

    var _config = function (client, params, callback) {
        var packageJson = require('../package.json');
        var serverConfig = {argv: _argv, packageJson: packageJson};
        return callback(null, serverConfig);
    };

    module.exports = function (logger, argv) {
        _logger = logger;
        _argv = argv;

        return {
            allowsAnonymous: true,
            config: _config
        };
    };
})();