(function () {
    'use strict';

    var controllerName = 'database';

    app.controller('DatabaseCtrl', function ($rootScope, $state, $scope, $alert, $modal, credentials, api) {
        var refresh = function () {
            api.request(controllerName, 'list', { host: credentials.host }, function (error, buckets) {
                if (error) {
                    $rootScope.$broadcast('loading-complete');
                    $alert(JSON.stringify(error, null, 2));
                }
                else {
                    $scope.buckets = buckets;
                    $scope.$apply();  // Needed when running in nw.js embedded webkit browser.
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