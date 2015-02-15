(function () {
    'use strict';

    app.controller('ServerDataCtrl', function ($scope, $alert, serverConfig) {
        var refresh = function () {
            serverConfig.getConfig(function (error, config) {
                if (error) {
                    $alert(JSON.stringify(error, null, 2));
                }
                else {
                    $scope.packageJson = config.packageJson;
                }
            });
        };

        refresh();
    });
})();