(function () {
    'use strict';

    var controllerName = 'document';

    app.controller('DocumentCtrl', function ($rootScope, $scope, $state, $stateParams, $alert, $modal, credentials, api, serverConfig) {
        var configPageSize = null;

        var preventZeroPageSize = function() {
            if ((!$scope.pageSize) || ($scope.pageSize.length === 0) || ($scope.pageSize === 0)) {
                $scope.pageSize = configPageSize;
            }
        };

        var refresh = function () {
            api.request(controllerName, 'list', { host: credentials.host, bucketId: $scope.view.bucketId, viewId: $scope.view.viewId, keyPrefix: $scope.keyPrefix, skipCount: $scope.skipCount, pageSize: $scope.pageSize, docFilter: $scope.docFilter, queryTimeoutSeconds: $scope.queryTimeoutSeconds }, function (error, resultSet) {
                if (error) {
                    $rootScope.$broadcast('loading-complete');
                    $alert(JSON.stringify(error, null, 2));
                }
                else {
                    $scope.prevSkipCount = $scope.skipCount;
                    $scope.nextSkipCount = resultSet.nextSkipCount;
                    $scope.resultSetMessage = resultSet.message;
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
            if ($scope.skipCount === $scope.prevSkipCount) {
                $scope.skipCount = 0;
            }
            refresh();
        };

        $scope.delete = function (doc) {
            var modalInstance = $modal.open({
                templateUrl: 'documents/document-delete.html',
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
                templateUrl: 'documents/document-create-update.html',
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

        $scope.purge = function (docs) {
            var modalInstance = $modal.open({
                templateUrl: 'documents/document-purge.html',
                controller: 'DocumentPurgeCtrl',
                resolve: {
                    view: function () {
                        return $scope.view;
                    },
                    docIds: function () {
                        var docIds = docs.map( function(doc) { return doc.id } );
                        return docIds;
                    }
                }
            });
            modalInstance.result.then(function (docIds) {
                $rootScope.$broadcast('loading-started');
                api.request(controllerName, 'purge', { host: credentials.host, bucketId: $scope.view.bucketId, docIds: docIds }, function (error) {
                    $rootScope.$broadcast('loading-complete');
                    if (error) {
                        $alert(JSON.stringify(error, null, 2));
                    }
                    refresh();
                });
            }, function () {});
        };

        $scope.purgeDisable = function () {
                $scope.purgeEnabled = false;
        };

        $scope.purgeEnable = function () {
                $scope.purgeEnabled = true;
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
                $rootScope.$broadcast('loading-complete');
                $alert(JSON.stringify(error, null, 2));
            } else {
                configPageSize = config.argv.pagesize;

                $scope.keyPrefix = '';
                $scope.skipCount = 0;
                $scope.prevSkipCount = $scope.skipCount;
                $scope.pageSize = configPageSize;
                $scope.queryTimeoutSeconds = config.argv.timeout;
                $scope.purgeEnabled = false;
                refresh();
            }
        });
    });

    app.controller('DocumentCreateOrUpdateCtrl', function ($rootScope, $scope, $, $alert, $modalInstance, credentials, api, view, doc) {
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
                    $rootScope.$broadcast('loading-complete');
                    $alert(error);
                }
                else {
                    $modalInstance.close(doc);
                }
            });
        };

        $scope.cancel = function () {
            $rootScope.$broadcast('loading-complete');
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
                        $rootScope.$broadcast('loading-complete');
                        $alert(JSON.stringify(error, null, 2));
                    }
                    else {
                        $modalInstance.close();
                    }
                });
            }
            else {
                $rootScope.$broadcast('loading-complete');
                $alert('The confirmation Document ID you typed was incorrect.');
            }
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    });

    app.controller('DocumentPurgeCtrl', function ($scope, $alert, $modalInstance, credentials, api, view, docIds) {
        $scope.view = view;
        $scope.docIds = docIds;

        $scope.ok = function () {
            $modalInstance.close(docIds);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    });

    app.directive('mdJsonEditor', function ($timeout) {
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