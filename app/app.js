'use strict';

var app = angular.module('CBbread', [
    'ui.router',
    'ui.bootstrap',
    'ngGrid'
]);

app.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider.state('dashboard', {
        url: '/',
        templateUrl: '/views/dashboard.html',
        controller: 'DashboardCtrl'
    });

    $stateProvider.state('console', {
        url: '/console',
        templateUrl: '/views/console.html',
        controller: 'ConsoleCtrl'
    });

    $stateProvider.state('credits', {
        url: '/credits',
        templateUrl: '/views/credits.html',
        controller: 'CreditsCtrl'
    });

    $stateProvider.state('database', {
        url: '/databases',
        templateUrl: '/views/database/index.html',
        controller: 'DatabaseIndexCtrl'
    });

    $stateProvider.state('collection', {
        url: '/collections/?did&dl',
        templateUrl: '/views/collection/index.html',
        controller: 'CollectionIndexCtrl'
    });

    $stateProvider.state('document', {
        url: '/documents/?did&dl&cid&cl',
        templateUrl: '/views/document/index.html',
        controller: 'DocumentIndexCtrl'
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
//                $alert("serverConfig.getConfig returned from cache");
                return callback(null, this.serverConfig);
            } else {
                api.request(controllerName, 'config', null, function (error, config) {
                    if (error) {
                        $alert(JSON.stringify(error, null, 2));
                        return callback(error);
                    }
                    else {
                        self.serverConfig = config;
//                        $alert("serverConfig.getConfig loaded from server");
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

app.factory('api', function ($http, credentials) {
    return {
        path: '/api',
        requestDirect: function (url, params, callback) {
            var self = this;
            var opts = {
                method: 'POST',
                url: self.path + url,
                data: params || {},
                headers: {
                    'x-couchbase-host': credentials.host,
                    'x-couchbase-user': credentials.user,
                    'x-couchbase-password': credentials.password
                }
            };
            $http(opts)
                .success(function (data) {
                    return callback(null, data);
                })
                .error(function (error) {
                    return callback(error, null);
                });
        },
        request: function (controllerName, actionName, params, callback) {
            var self = this;
            var url = '/' + controllerName + '/' + actionName;
            self.requestDirect(url, params, callback);
        }
    };
});