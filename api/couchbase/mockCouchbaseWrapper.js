(function () {
    'use strict';

    var util = require('util');

    var cb = require('couchbase').Mock;  // http://docs.couchbase.com/sdk-api/couchbase-node-client-2.0.5/#toc4
    var cbCluster = null;
    var cbClusterManager = null;
    var cbLogger = null;

    exports.initialize = function(logger, host, user, password) {
        if (cbClusterManager) {
            logger.debug("mockCouchbaseWrapper.initialize was already called.");
        } else {
            logger.debug("mockCouchbaseWrapper.initialize host %s as user %s", host, user);
            cbLogger = logger;

            cbCluster = new cb.Cluster();
            cbClusterManager = cbCluster.manager(user, password);
        }
    };

    exports.listBuckets = function(callback) {
        var mockBuckets = [];
        mockBucketNames.forEach(function(bucketName) {
            var bucket = { id: bucketName, self: bucketName, text: bucketName };
            mockBuckets.push(bucket);
        });
        return callback(null, mockBuckets);
    };
})();
