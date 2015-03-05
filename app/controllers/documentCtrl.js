(function () {
    'use strict';

    var controllerName = 'document';

    app.controller('DocumentCtrl', function ($rootScope, $scope, $state, $stateParams, $alert, $modal, credentials, api, serverConfig) {
        var configPageSize = null;

        var preventZeroPageSize = function() {
            if ($scope.pageSize === 0) {
                $scope.pageSize = configPageSize;
            }
        };

        var refresh = function () {
            api.request(controllerName, 'list', { host: credentials.host, bucketId: $scope.view.bucketId, viewId: $scope.view.viewId, keyPrefix: $scope.keyPrefix, skipCount: $scope.skipCount, pageSize: $scope.pageSize, docFilter: $scope.docFilter }, function (error, resultSet) {
                if (error) {
                    $alert(JSON.stringify(error, null, 2));
                }
                else {
                    $scope.nextSkipCount = resultSet.nextSkipCount;
                    $scope.documents = [];
                    var resultRows = resultSet.resultRows;
                    resultRows.forEach(function (row) {
                        var viewValue = '';
                        if (row.value) {
                            viewValue = JSON.stringify(row.value);
                        }
                        var model = {
                            expanded: false,
                            index: row.index,
                            key: JSON.stringify(row.key),
                            value: viewValue,
                            id: row.id,
                            cas: JSON.stringify(row.cas)
                        };
                        model.body = row.doc;
                        model.bodyString = JSON.stringify(row.doc, null, 2);
                        $scope.documents.push(model);
                    });
                }
            });
        };
        
        $scope.prevPage = function () {
            preventZeroPageSize();
            if ($scope.pageSize > 0) {
                $scope.skipCount = $scope.skipCount - $scope.pageSize;
            } else {
                $scope.skipCount = $scope.skipCount + $scope.pageSize;
            }
            if ($scope.skipCount < 0) {
                $scope.skipCount = 0;
            }
            $scope.nextSkipCount = null;
            refresh();
        };
        
        $scope.nextPage = function () {
            preventZeroPageSize();
            if ($scope.nextSkipCount) {
//                console.log("Using nextSkipCount = %d", $scope.nextSkipCount);
                $scope.skipCount = $scope.nextSkipCount;
            } else if ($scope.pageSize > 0) {
                $scope.skipCount = $scope.skipCount + $scope.pageSize;
            } else {
                $scope.skipCount = $scope.skipCount - $scope.pageSize;
            }
            $scope.nextSkipCount = null;
            refresh();
        };
        
        $scope.requeryServer = function () {
            preventZeroPageSize();
            $scope.skipCount = 0;
            refresh();
        };

        $scope.delete = function (doc) {
            var modalInstance = $modal.open({
                templateUrl: 'views/document/delete.html',
                controller: 'DocumentDeleteCtrl',
                resolve: {
                    view: function () {
                        return $scope.view;
                    },
                    doc: function () {
                        return doc;
                    }
                }
            });
            modalInstance.result.then(function () {
                refresh();
            }, function () {});
        };

        $scope.createOrUpdate = function (doc) {
            var modalInstance = $modal.open({
                templateUrl: 'views/document/create-update.html',
                controller: 'DocumentCreateOrUpdateCtrl',
                resolve: {
                    view: function () {
                        return $scope.view;
                    },
                    doc: function () {
                        return doc;
                    }
                }
            });
            modalInstance.result.then(function () {
                refresh();
            }, function () {});
        };

        $scope.view = {
            bucketId: $stateParams.did,
            viewId: $stateParams.cid
        };
        
        $rootScope.breadcrumb.items = [
            {
                href: $state.href('database', undefined, undefined),
                text: 'Buckets'
            },
            {
                href: $state.href('collection', { did: $scope.view.bucketId }),
                text: $scope.view.bucketId
            },
            {
                text: $scope.view.viewId
            }
        ];

        serverConfig.getConfig(function (error, config) {
            if (error) {
                $alert(JSON.stringify(error, null, 2));
            } else {
                configPageSize = config.argv.pagesize;

                $scope.keyPrefix = '';
                $scope.skipCount = 0;
                $scope.pageSize = configPageSize;
                refresh();
            }
        });
    });

    app.controller('DocumentCreateOrUpdateCtrl', function ($scope, $, $alert, $modalInstance, credentials, api, view, doc) {
        $scope.doc = doc || {};
        $scope.raw = JSON.stringify($scope.doc, null, 2);
        $scope.view = view;
        $scope.isUpdate = $scope.doc && $scope.doc.id;

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

        $scope.ok = function (id, body) {
            // invoke api to create or update document
            api.request(controllerName, 'createOrReplace', { host: credentials.host, bucketId: $scope.view.bucketId, docId: id, docBody: body }, function (error, doc) {
                if (error) {
                    $alert(error);
                }
                else {
                    $modalInstance.close(doc);
                }
            });
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    });

    app.controller('DocumentDeleteCtrl', function ($scope, $alert, $modalInstance, credentials, api, view, doc) {
        $scope.view = view;
        $scope.doc = doc;

        $scope.ok = function (confirmationDocId) {
            if (confirmationDocId === doc.id) {
                api.request(controllerName, 'delete', { host: credentials.host, bucketId: $scope.view.bucketId, docId: doc.id }, function (error) {
                    if (error) {
                        $alert(JSON.stringify(error, null, 2));
                    }
                    else {
                        $modalInstance.close();
                    }
                });
            }
            else {
                $alert('The confirmation Document ID you typed was incorrect.');
            }
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    });

    app.directive('mdJsonEditor', function () {
        return {
            restrict: 'A',
            scope: {
                json: '=ngModel'
            },
            link: function (scope, elem) {
                var container = elem[0];
                var opts = {
                    name: 'document',
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
            }
        };
    });
})();