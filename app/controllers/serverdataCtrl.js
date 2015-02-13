(function () {
    'use strict';

    app.controller('ServerDataCtrl', function ($scope, $alert, serverConfig) {
        var refresh = function () {
//            $alert("ServerDataCtrl.refresh called");
            serverConfig.getConfig(function (error, config) {
                if (error) {
                    $alert(JSON.stringify(error, null, 2));
                }
                else {
                    $scope.packageJson = config.packageJson;
//                    $alert("ServerDataCtrl.refresh complete");
                }
            });
        };

        refresh();
    });
})();