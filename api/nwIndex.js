(function () {
    'use strict';

    var util = require('util');

    var cbWrapper = require('./lib/couchbaseWrapper');

    exports.invokeControllerAction = function (logger, argv, credentials, controllerName, actionName, params, callback) {
        var _validate = function (controller, params, innerCallback) {
            var validator = controller['validate'];
            if (validator) {
                validator(params, function (error) {
                    return innerCallback(error);
                });
            }
            else {
                return innerCallback(null);
            }
        };

        var _logAndSendErrorOrResult = function (error, result) {
            var message = {
                controllerName: controllerName,
                actionName: actionName
            };
            if (error) {
                message.error = error;
                logger.error(message);
                return callback(message);
            }
            else {
                message.params = params;
                message.result = result;
                if (argv.responses) {
                    logger.warn("nwApi: Server Response\n%s", util.inspect(message, false, null, true));
                }
                return callback(null, result);
            }
        };

        var _invokeControllerAction = function () {
            var controller = require('./' + controllerName + '.js')(logger, argv);
            if (controller) {
                if (controller[actionName]) {
                    var host = credentials.host;
                    var user = credentials.user;
                    var password = credentials.password;
                    if (controller.allowsAnonymous || cbWrapper.credentialsComplete(host, user, password)) {
                        cbWrapper.initialize(logger, host, user, password);
                        // perform validate if defined inside controller
                        _validate(controller, params, function (error) {
                            if (error) {
                                _logAndSendErrorOrResult(error, null);
                            }
                            else {
                                // perform the action
                                var client = cbWrapper;
                                controller[actionName](client, params, function (error, result) {
                                    if (error) {
                                        _logAndSendErrorOrResult(error, null);
                                    }
                                    else {
                                        result = result || {};
                                        _logAndSendErrorOrResult(null, result);
                                    }
                                });
                            }
                        });
                    }
                    else {
                        _logAndSendErrorOrResult('Missing host, user, or password in request [' + req.path + ']', null);
                    }
                }
                else {
                    _logAndSendErrorOrResult('Cannot find action [' + actionName + '] in controller [' + controllerName + '] from request path [' + req.path + ']', null);
                }
            }
            else {
                _logAndSendErrorOrResult('Cannot find controller [' + controllerName + '] from request path [' + req.path + ']', null);
            }
        };

        _invokeControllerAction();
    };
})();
