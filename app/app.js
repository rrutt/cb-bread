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

app.factory('credentials', function () {
    return {
        host: '',
        key: '',
        set: function (host, key) {
            this.host = host;
            this.key = key;
        },
        reset: function () {
            this.host = '';
            this.key = '';
        },
        isConnected: function () {
            return this.host && this.host.length > 0 &&
                   this.key && this.key.length > 0;
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
                    'x-docdb-host': credentials.host,
                    'x-docdb-key': credentials.key
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