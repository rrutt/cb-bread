(function () {
    'use strict';

    var controllerName = 'document';

    app.controller('DocumentIndexCtrl', function ($rootScope, $scope, $state, $stateParams, $alert, $modal, api) {
        var refresh = function () {
            api.request(controllerName, 'list', { bucketId: $scope.view.bucketId, viewId: $scope.view.viewId }, function (error, resultRows) {
                if (error) {
                    $alert(JSON.stringify(error, null, 2));
                }
                else {
                    $scope.documents = [];
                    console.log("DocumentIndexCtrl.refresh resultRows = " + JSON.stringify(resultRows));
                    resultRows.forEach(function (row) {
                        console.log("DocumentIndexCtrl.refresh row = " + JSON.stringify(row));
                        var model = {
                            expanded: false,
                            id: row.id,
                            _self: row.id,
                            _ts: JSON.stringify(row.cas),
                            _etag: JSON.stringify(row.key),
                            _rid: row.id,
                            _attachments: null
                        };
                        model.body = row.doc;
                        model.bodyString = JSON.stringify(row.doc, null, 99);
                        $scope.documents.push(model);
                    });
                }
            });
        };

        $scope.delete = function (doc) {
            var modalInstance = $modal.open({
                templateUrl: 'views/document/delete.html',
                controller: 'DocumentDeleteCtrl',
                resolve: {
                    col: function () {
                        return $scope.col;
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
                    col: function () {
                        return $scope.col;
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

        refresh();
    });

    app.controller('DocumentCreateOrUpdateCtrl', function ($scope, $, $alert, $modalInstance, api, col, doc) {
        $scope.doc = doc || {};
        $scope.raw = JSON.stringify($scope.doc, null, 2);
        $scope.col = col;
        $scope.isUpdate = $scope.doc && $scope.doc.id;

        $scope.designMode = true;
        $scope.changeMode = function (isDeignMode) {
            $scope.designMode = isDeignMode;
            if (isDeignMode === true) {
                $scope.doc.body = JSON.parse($scope.doc.bodyString);
            }
            else {
                $scope.doc.bodyString = JSON.stringify($scope.doc.body, null, 2);
            }
        };

        $scope.ok = function (id, doc) {
            // set body and id again in case user didn't put anything
            doc.id = id;
            // invoke api to create or update document
            api.request(controllerName, $scope.isUpdate ? 'update' : 'create', { body: doc, collectionId: col.collectionId }, function (error, doc) {
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

    app.controller('DocumentDeleteCtrl', function ($scope, $alert, $modalInstance, api, col, doc) {
        $scope.id = '';
        $scope.col = col;
        $scope.doc = doc;

        $scope.ok = function (id) {
            if (id === doc.id) {
                api.request(controllerName, 'remove', { id: id, collectionId: col.collectionId }, function (error) {
                    if (error) {
                        $alert(JSON.stringify(error, null, 2));
                    }
                    else {
                        $modalInstance.close();
                    }
                });
            }
            else {
                $alert('The name of the document you typed was incorrect.');
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