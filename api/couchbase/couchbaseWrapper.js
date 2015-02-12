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
        }
    };

    exports.listBuckets = function(callback) {
        cbClusterManager.listBuckets(function(err, cbBucketList) {
            if (err) {
                cbLogger.error("couchbaseWrapper.listBuckets error: ", util.inspect(err));
            } else {
//                cbLogger.debug("couchbaseWrapper.listBuckets cbBucketList = %s", util.inspect(cbBucketList));
                var bucketList = [];
                cbBucketList.forEach(function(cbBucket) {
                    var bucket = { id: cbBucket['name'], self: cbBucket['uri'], text: cbBucket['name'] };
                    bucketList.push(bucket);
                });
                cbLogger.debug("couchbaseWrapper.listBuckets bucketList = %s", util.inspect(bucketList));
                return callback(null, bucketList);
            }
        });
    };
})();
