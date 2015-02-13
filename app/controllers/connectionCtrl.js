(function () {
    'use strict';

    app.controller('ConnectionCtrl', function ($scope, $state, $alert, credentials, serverConfig) {
        var connect = function () {
            credentials.set($scope.host, $scope.user, $scope.password);
            if (credentials.isConnected() === true) {
                refresh();
            }
            else {
                $alert('Please specify host, user, and password.');
            }
        };

        var disconnect = function () {
            credentials.reset();
            refresh();
            $state.go('dashboard', undefined, undefined);
        };

        var refresh = function () {
            $scope.host = credentials.host;
            $scope.user = credentials.user;
            $scope.password = credentials.password;
            $scope.isConnected = credentials.isConnected();
            $scope.connect = connect;
            $scope.disconnect = disconnect;

            if (!credentials.isConfigured()) {
//                $alert("ConnectionCtrl.refresh call serverConfig.getConfig");
                serverConfig.getConfig(function (error, config) {
                    if (error) {
                        $alert(JSON.stringify(error, null, 2));
                    } else {
                        if ((!$scope.host) || ($scope.host.length == 0)) {
                            $scope.host = config.host;
                        }
                        if ((!$scope.user) || ($scope.user.length == 0)) {
                            $scope.user = config.user;
                        }
                    }
                });
            }
        };

        refresh();
    });
})();