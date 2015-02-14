(function () {
    'use strict';

    var util = require('util');

    var cb = require('couchbase');  // http://docs.couchbase.com/developer/node-2.0/hello-couchbase.html

    var cbCluster = null;
    var cbClusterManager = null;
    var cbHost = null;
    var cbUser = null;
    var cbPassword = null;
    var cbLogger = null;

    var credentialsComplete = function(host, user, password) {
        return (host && host.length > 0) &&
            (user && user.length > 0) &&
            (password && password.length > 0);
    };
    exports.credentialsComplete = credentialsComplete;

    exports.initialize = function(logger, host, user, password) {
        if (credentialsComplete(host, user, password))
        {
            var hostAndPort = host + ':8091';
            if (cbClusterManager && (host === cbHost) && (user === cbUser) && (password === cbPassword)) {
                logger.debug("couchbaseWrapper.initialize was already called for %s as user %s", hostAndPort, user);
            } else {
                logger.info("couchbaseWrapper.initialize %s as user %s", hostAndPort, user);

                cbLogger = logger;

                cbCluster = new cb.Cluster(hostAndPort);
                cbClusterManager = cbCluster.manager(user, password);
                cbHost = host;
                cbUser = user;
                cbPassword = password;
            }
        } else {
            logger.debug("couchbaseWrapper.initialize bypassed for null credentials");
        }
    };

    exports.listBuckets = function(callback) {
        cbLogger.debug("couchbaseWrapper.listBuckets cbClusterManager = ", util.inspect(cbClusterManager, false, null, true));
        cbClusterManager.listBuckets(function(err, bucketInfoList) {
            if (err) {
                cbLogger.error("couchbaseWrapper.listBuckets error: ", util.inspect(err));
                return callback(err);
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
        cbLogger.debug("couchbaseWrapper.listViews cbBucketManager = ", util.inspect(cbBucketManager, false, null, true));
        cbBucketManager.getDesignDocuments(function(err, ddocs) {
            if (err) {
                cbLogger.error("couchbaseWrapper.listViews cbBucketManager.getDesignDocuments for bucket '%s' threw error: ", bucketName, util.inspect(err));
                return callback(err);
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
