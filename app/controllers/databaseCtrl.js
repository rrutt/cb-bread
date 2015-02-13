(function () {
    'use strict';

    var controllerName = 'database';

    app.controller('DatabaseIndexCtrl', function ($rootScope, $state, $scope, $alert, $modal, api) {
        var refresh = function () {
            api.request(controllerName, 'list', null, function (error, buckets) {
                if (error) {
                    $alert(JSON.stringify(error, null, 2));
                }
                else {
                    $scope.buckets = buckets;
                }
            });
        };

        $rootScope.breadcrumb.items = [
            {
                href: $state.href('database', undefined, undefined),
                text: 'Buckets'
            }
        ];

        refresh();
    });
})();