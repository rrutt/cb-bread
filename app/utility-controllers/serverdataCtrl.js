(function () {
    'use strict';

    app.controller('ServerDataCtrl', function ($scope, $alert, serverConfig) {
        var refresh = function () {
            serverConfig.getConfig(function (error, config) {
                if (error) {
                    $rootScope.$broadcast('loading-complete');
                    $alert(JSON.stringify(error, null, 2));
                }
                else {
                    $scope.packageJson = config.packageJson;
                    $scope.processVersions = config.processVersions;
                }
            });
        };

        refresh();
    });
})();