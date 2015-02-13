(function () {
    'use strict';

    var util = require('util');

    var _logger = null;
    var _host = null;
    var _user = null;
    var _password = null;

    var _config = function (client, params, callback) {
        var packageJson = require('../package.json');
        var serverConfig = {host: _host, user: _user, password: _password, packageJson: packageJson};
        return callback(null, serverConfig);
    };

    module.exports = function (logger, argv) {
        _logger = logger;
        _host = argv.host;
        _user = argv.user;
        _password = argv.password;

        return {
            allowsAnonymous: true,
            config: _config
        };
    };
})();