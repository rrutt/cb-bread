(function () {
    'use strict';

    var controllerName = 'query';

    app.controller('QueryCtrl', function ($rootScope, $scope, $state, $stateParams, $alert, $modal, credentials, api, serverConfig) {
        var refresh = function () {
            api.request(controllerName, 'query', { host: credentials.host, n1qlQuery: $scope.n1qlQuery }, function (error, resultSet) {
                if (error) {
                    $rootScope.$broadcast('loading-complete');
                    $alert(JSON.stringify(error, null, 2));
                }
                else {
                    $scope.resultSetMessage = resultSet.message;
                    $scope.queryResults = [];
                    var resultRows = resultSet.resultRows;
                    resultRows.forEach(function (row) {
                        var model = {
                            expanded: false,
                            index: row.index,
                            shortForm: row.shortForm
                        };
                        model.body = row.doc;
                        model.bodyString = JSON.stringify(row.doc, null, 2);
                        $scope.queryResults.push(model);
                    });
                }
            });
        };
        
        $scope.queryServer = function () {
            refresh();
        };

        $scope.outline = function (doc) {
            var modalInstance = $modal.open({
                templateUrl: 'query/query-outline.html',
                controller: 'QueryOutlineCtrl',
                resolve: {
                    doc: function () {
                        return doc;
                    }
                }
            });
            modalInstance.result.then(function () {
                refresh();
            }, function () {});
        };
        
        $rootScope.breadcrumb.items = [
            {
                href: $state.href('query', undefined, undefined),
                text: 'NiQL Query'
            }
        ];

        serverConfig.getConfig(function (error, config) {
            if (error) {
                $rootScope.$broadcast('loading-complete');
                $alert(JSON.stringify(error, null, 2));
            } else {
                $scope.n1qlQuery = '';
                refresh();
            }
        });
    });

    app.controller('QueryOutlineCtrl', function ($rootScope, $scope, $, $alert, $modalInstance, credentials, api, doc) {
        $scope.doc = doc || {};
        $scope.raw = JSON.stringify($scope.doc, null, 2);
        $scope.isUpdate = false;

        $scope.designMode = true;        
        $scope.changeMode = function (isDesignMode) {
            $scope.designMode = isDesignMode;
            if (isDesignMode === true) {
                $scope.doc.body = JSON.parse($scope.doc.bodyString);
            }
            else {
                $scope.doc.bodyString = JSON.stringify($scope.doc.body, null, 2);
            }
        };

        $scope.close = function () {
            $rootScope.$broadcast('loading-complete');
            $modalInstance.dismiss('close');
        };
    });

    app.directive('mdJsonOutline', function ($timeout) {
        return {
            restrict: 'A',
            scope: {
                json: '=ngModel'
            },
            link: function (scope, elem) {
                var container = elem[0];
                var opts = {
                    name: 'document',
                    mode: 'text',  // Initial mode will be defer-toggled to 'tree'.
                    modes: [
                        'tree',
                        'text'
                    ],
                    change: function () {
                        if (scope.editor) {
                            scope.$apply(function () {
                                scope.json = scope.editor.get();
                            });
                        }
                    }
                };
                scope.editor = new JSONEditor(container, opts, scope.json || {});
                $timeout(function() {  // Need to defer-toggle mode when running in nw.js embedded webkit browser.
                    if (scope.editor) {
                        scope.editor.setMode('tree');
                    }
                });
            }
        };
    });
})();