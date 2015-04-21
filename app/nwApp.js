'use strict';

var app = angular.module('CBbread', [
    'ui.router',
    'ui.bootstrap',
    'ngGrid'
]);

var util = require('util');

var log4js = require('log4js');
// https://github.com/nomiddlename/log4js-node/issues/112
log4js.configure({ appenders: [ { type: "console", layout: { type: "basic" } } ], replaceConsole: true });
var logger = log4js.getLogger('cb-bread');

var userArgString = process.env.USERARGS || '--pagesize=10'; // Need at least one argument if no other passed.
var commandLineArguments = require('./commandLineArguments');
var argv = commandLineArguments.parseArgumentString(userArgString);

if (argv.debug) {
    logger.setLevel('DEBUG');
}
else {
    logger.setLevel('INFO');
}

app.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider.state('dashboard', {
        url: '/',
        templateUrl: './views/dashboard.html',
        controller: 'DashboardCtrl'
    });

    $stateProvider.state('console', {
        url: '/console',
        templateUrl: './views/console.html',
        controller: 'ConsoleCtrl'
    });

    $stateProvider.state('credits', {
        url: '/credits',
        templateUrl: './views/credits.html',
        controller: 'CreditsCtrl'
    });

    $stateProvider.state('database', {
        url: '/databases',
        templateUrl: './views/database/index.html',
        controller: 'DatabaseCtrl'
    });

    $stateProvider.state('collection', {
        url: '/collections/?did',
        templateUrl: './views/collection/index.html',
        controller: 'CollectionCtrl'
    });

    $stateProvider.state('document', {
        url: '/documents/?did&cid',
        templateUrl: './views/document/index.html',
        controller: 'DocumentCtrl'
    });
}]);

app.config(function ($httpProvider) {
    $httpProvider.interceptors.push(function ($q, $rootScope) {
        return {
            'request': function (config) {
                $rootScope.$broadcast('loading-started');
                return config || $q.when(config);
            },
            'response': function(response) {
                $rootScope.$broadcast('loading-complete');
                return response || $q.when(response);
            }
        };
    });
});

app.directive("loadingIndicator", function () {
    return {
        restrict : "A",
        link : function (scope, element) {
            scope.$on("loading-started", function () {
                element.css({"display" : ""});
            });

            scope.$on("loading-complete", function () {
                element.css({"display" : "none"});
            });
        }
    };
});

app.value('$', $);
app.value('$alert', alert);

app.factory('serverConfig', function ($alert, api) {
    var controllerName = 'serverdata';

    return {
        serverConfig: null,
        getConfig: function(callback) {
            var self = this;
            if (this.serverConfig) {
                return callback(null, this.serverConfig);
            } else {
                api.request(controllerName, 'config', null, function (error, config) {
                    if (error) {
                        if (error.error) {
                            $alert(error.error);
                        } else {
                            $alert(JSON.stringify(error, null, 2));
                        }
                        return callback(error);
                    }
                    else {
                        self.serverConfig = config;
                        return callback(null, config);
                    }
                });
            }
        }
    };
});

app.factory('credentials', function () {
    return {
        host: '',
        user: '',
        password: '',
        set: function (host, user, password) {
            this.host = host;
            this.user = user;
            this.password = password;
        },
        reset: function () {
            this.host = '';
            this.user = '';
            this.password = '';
        },
        isConfigured: function () {
            return (this.host && this.host.length > 0) ||
                (this.user && this.user.length > 0) ||
                (this.password && this.password.length > 0);
        },
        isConnected: function () {
            return (this.host && this.host.length > 0) &&
                (this.user && this.user.length > 0) &&
                (this.password && this.password.length > 0);
        }
    };
});

var nwApi = require('../api/nwIndex');

app.factory('api', function ($http, $rootScope, $timeout, credentials) {
    return {
        path: '/api',
        request: function (controllerName, actionName, params, callback) {
            $rootScope.$broadcast('loading-started');
            nwApi.invokeControllerAction(logger, argv, credentials, controllerName, actionName, params, function(err, data) {
                if (err) {
                    logger.error("nwApi.invokeControllerAction %s.%s returned error: %s", controllerName, actionName, util.inspect(err));
                    if (err.error) {
                        var alertMsg = JSON.stringify(err.error);  // No line breaks for compound error.
                        alertMsg = alertMsg.replace(/\"/g, '');  // Remove quotes.
                        $timeout(function() {
                            callback(alertMsg);
                            $rootScope.$broadcast('loading-complete');
                        });
                    } else {
                        $timeout(function() {
                            callback(err);
                            $rootScope.$broadcast('loading-complete');
                        });
                    }
                } else {
                    $timeout(function() {
                        callback(null, data);
                        $rootScope.$broadcast('loading-complete');
                    });
                }
            });
        }
    };
});
