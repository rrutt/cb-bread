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
                    $scope.databases = buckets;
                }
            });
        };

        $scope.delete = function (id, selfLink) {
            var modalInstance = $modal.open({
                templateUrl: 'views/database/delete.html',
                controller: 'DatabaseDeleteCtrl',
                resolve: {
                    db: function () {
                        return {
                            id: id,
                            _self: selfLink
                        };
                    }
                }
            });
            modalInstance.result.then(function () {
                refresh();
            }, function () {});
        };

        $scope.create = function () {
            var modalInstance = $modal.open({
                templateUrl: 'views/database/create.html',
                controller: 'DatabaseCreateCtrl'
            });
            modalInstance.result.then(function () {
                refresh();
            }, function () {});
        };

        $rootScope.breadcrumb.items = [
            {
                href: $state.href('database', undefined, undefined),
                text: 'Databases'
            }
        ];

        refresh();
    });

    app.controller('DatabaseCreateCtrl', function ($scope, $alert, $modalInstance, api) {
        $scope.id = '';

        $scope.ok = function (id) {
            api.request(controllerName, 'create', { id: id }, function (error, db) {
                if (error) {
                    $alert(JSON.stringify(error, null, 2));
                }
                else {
                    $modalInstance.close(db);
                }
            });
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    });

    app.controller('DatabaseDeleteCtrl', function ($scope, $alert, $modalInstance, api, db) {
        $scope.id = '';
        $scope.db = db;

        $scope.ok = function (id) {
            if (id === db.id) {
                api.request(controllerName, 'remove', { id: id }, function (error) {
                    if (error) {
                        $alert(JSON.stringify(error, null, 2));
                    }
                    else {
                        $modalInstance.close();
                    }
                });
            }
            else {
                $alert('The name of the database you typed was incorrect.');
            }
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    });
})();