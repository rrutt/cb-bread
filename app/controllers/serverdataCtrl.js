(function () {
    'use strict';

    var controllerName = 'serverdata';

    app.controller('ServerDataCtrl', function ($scope, $alert, api) {
        var refresh = function () {
            api.request(controllerName, 'config', null, function (error, serverConfig) {
                if (error) {
                    $alert(JSON.stringify(error, null, 2));
                }
                else {
                    $scope.serverConfig = serverConfig;
                }
            });
        };

        refresh();
    });
})();