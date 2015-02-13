(function () {
    'use strict';

    var util = require('util');

    var cb = require('couchbase');  // http://docs.couchbase.com/developer/node-2.0/hello-couchbase.html

    var cbCluster = null;
    var cbClusterManager = null;
    var cbPassword = null;
    var cbLogger = null;

    var mockBucketNames = ['FirstTestBucket', 'SecondTestBucket', 'ThirdTestBucket'];

    exports.initialize = function(logger, host, user, password) {
        if (cbClusterManager) {
            logger.debug("couchbaseWrapper.initialize was already called.");
        } else {
            logger.debug("couchbaseWrapper.initialize host %s as user %s", host, user);

            cbLogger = logger;

            var hostAndPort = host + ':8091';
            cbCluster = new cb.Cluster(hostAndPort);
            cbClusterManager = cbCluster.manager(user, password);
            cbPassword = password;
        }
    };

    exports.listBuckets = function(callback) {
        cbClusterManager.listBuckets(function(err, bucketInfoList) {
            if (err) {
                cbLogger.error("couchbaseWrapper.listBuckets error: ", util.inspect(err));
            } else {
//                cbLogger.debug("couchbaseWrapper.listBuckets bucketInfoList = %s", util.inspect(bucketInfoList));
                var bucketList = [];
                bucketInfoList.forEach(function(bucketInfo) {
                    var bucket = { id: bucketInfo['name'], text: bucketInfo['name'] };
                    bucketList.push(bucket);
                });
                cbLogger.debug("couchbaseWrapper.listBuckets bucketList = %s", util.inspect(bucketList));
                return callback(null, bucketList);
            }
        });
    };

    exports.listViews = function(bucketName, callback) {
        var cbBucket = cbCluster.openBucket(bucketName, cbPassword, function(err) {
            if (err) {
                cbLogger.error("couchbaseWrapper.listViews cbCluster.openBucket for bucket '%s' threw error: ", bucketName, util.inspect(err));
                throw err;
            }
        });

        var cbBucketManager = cbBucket.manager();
//        cbLogger.debug("couchbaseWrapper.listViews cbBucketManager = ", util.inspect(cbBucketManager));
        cbBucketManager.getDesignDocuments(function(err, ddocs) {
            if (err) {
                cbLogger.error("couchbaseWrapper.listViews cbBucketManager.getDesignDocuments for bucket '%s' threw error: ", bucketName, util.inspect(err));
            } else {
                cbLogger.debug("couchbaseWrapper.listViews ddocs = %s", util.inspect(ddocs));
                var viewList = [];
                for (var ddocName in ddocs) {
                    if (ddocs.hasOwnProperty(ddocName)) {
                        var ddoc = ddocs[ddocName];
                        var ddocViews = ddoc.views;
                        for (var viewName in ddocViews) {
                            if (ddocViews.hasOwnProperty(viewName)) {
                                var ddocViewName = ddocName + '/' + viewName;
                                var view = { id: ddocViewName, text: ddocViewName };
                                viewList.push(view);
                            }
                        }
                    }
                }
                cbLogger.debug("couchbaseWrapper.listViews viewList = %s", util.inspect(viewList));
                return callback(null, viewList);
            }
        });
    };
})();
