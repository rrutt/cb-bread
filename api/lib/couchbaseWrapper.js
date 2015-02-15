(function () {
    'use strict';

    var util = require('util');

    // http://docs.couchbase.com/developer/node-2.0/introduction.html
    // http://docs.couchbase.com/developer/node-2.0/hello-couchbase.html
    var cb = require('couchbase');

    var cbCluster = null;
    var cbClusterManager = null;
    var cbHost = null;
    var cbUser = null;
    var cbPassword = null;
    var cbLogger = null;
    var cbBucketPasswords = {};

    var credentialsComplete = function(host, user, password) {
        return (host && host.length > 0) &&
            (user && user.length > 0) &&
            (password && password.length > 0);
    };
    exports.credentialsComplete = credentialsComplete;

    exports.initialize = function(logger, host, user, password) {
        cbLogger = logger;
        if (credentialsComplete(host, user, password))        
        {
            var hostAndPort = host + ':8091';
            if (cbClusterManager && (host === cbHost) && (user === cbUser) && (password === cbPassword)) {
                cbLogger.debug("couchbaseWrapper.initialize was already called for %s as user %s", hostAndPort, user);
            } else {
                cbLogger.info("couchbaseWrapper.initialize %s as user %s", hostAndPort, user);


                cbCluster = new cb.Cluster(hostAndPort);
                cbClusterManager = cbCluster.manager(user, password);
                cbHost = host;
                cbUser = user;
                cbPassword = password;
            }
        } else {
            cbLogger.debug("couchbaseWrapper.initialize bypassed for null credentials");
        }
    };

    exports.listBuckets = function(callback) {
        cbBucketPasswords = {};
        
//        cbLogger.debug("couchbaseWrapper.listBuckets cbClusterManager = ", util.inspect(cbClusterManager, false, null, true));
        cbClusterManager.listBuckets(function(err, bucketInfoList) {
            if (err) {
                cbLogger.error("couchbaseWrapper.listBuckets error: ", util.inspect(err));
                return callback(err);
            } else {
//                cbLogger.debug("couchbaseWrapper.listBuckets bucketInfoList = %s", util.inspect(bucketInfoList));
                var bucketList = [];
                bucketInfoList.forEach(function(bucketInfo) {
                    var bucketName = bucketInfo.name;
                    var bucketPassword = bucketInfo.saslPassword;
                    var bucket = { id: bucketName };
                    bucketList.push(bucket);
                    cbBucketPasswords[bucketName] = bucketPassword;
                });
                cbLogger.debug("couchbaseWrapper.listBuckets bucketList = %s", util.inspect(bucketList));
                return callback(null, bucketList);
            }
        });
    };

    exports.listViews = function(bucketName, callback) {
        var bucketPassword = cbBucketPasswords[bucketName];
        
        var cbBucket = cbCluster.openBucket(bucketName, bucketPassword, function(err) {
            if (err) {
                cbLogger.error("couchbaseWrapper.listViews cbCluster.openBucket for bucket '%s' threw error: ", bucketName, util.inspect(err));
                throw err;
            }
        });

        var cbBucketManager = cbBucket.manager();
//        cbLogger.debug("couchbaseWrapper.listViews cbBucketManager = ", util.inspect(cbBucketManager, false, null, true));
        cbBucketManager.getDesignDocuments(function(err, ddocs) {
            if (err) {
                cbLogger.error("couchbaseWrapper.listViews cbBucketManager.getDesignDocuments for bucket '%s' threw error: ", bucketName, util.inspect(err));
                cbBucket.disconnect();
                return callback(err);
            } else {
//                cbLogger.debug("couchbaseWrapper.listViews ddocs = %s", util.inspect(ddocs, false, null, true));
                var viewList = [];
                for (var ddocName in ddocs) {
                    if (ddocs.hasOwnProperty(ddocName)) {
                        var ddoc = ddocs[ddocName];
                        var ddocViews = ddoc.views;
                        for (var viewName in ddocViews) {
                            if (ddocViews.hasOwnProperty(viewName)) {
                                var view = ddocViews[viewName];
                                var ddocViewName = ddocName + '/' + viewName;
                                var view = { id: ddocViewName, text: ddocViewName };
                                viewList.push(view);
                            }
                        }
                    }
                }
                cbLogger.debug("couchbaseWrapper.listViews viewList = %s", util.inspect(viewList));
                cbBucket.disconnect();
                return callback(null, viewList);
            }
        });
    };
    
    exports.listDocuments = function(bucketName, designDocViewName, keyPrefix, skipCount, pageSize, callback) {
        var bucketPassword = cbBucketPasswords[bucketName];
        
        var designDocViewNameElements = designDocViewName.split('/');
        var designDocName = designDocViewNameElements[0];
        var viewName = designDocViewNameElements[1];
        
        var cbViewQuery = cb.ViewQuery;
        var cbQuery = cbViewQuery
            .from(designDocName, viewName)
            .reduce(false)
            .full_set(true)
            .stale(cbViewQuery.Update.BEFORE)  // Options are BEFORE, NONE, AFTER.
            .skip(skipCount)
            .limit(pageSize);
        if (keyPrefix && keyPrefix.length > 0) {
            var endKey = 'z';
            cbLogger.debug("couchbaseWrapper.listDocuments keyPrefix = %s", keyPrefix);
            if (keyPrefix.substring(0, 1) === '[') {
                try {
                    keyPrefix = JSON.parse(keyPrefix);
                } catch (e) {
                    return callback("Key Prefix must be a valid JSON value or array.");
                }
                endKey = ['z'];
                cbLogger.debug("couchbaseWrapper.listDocuments adjusted keyPrefix = %s", util.inspect(keyPrefix));
            }
            cbQuery = cbQuery.range(keyPrefix, endKey);
        }
        
        var cbBucket = cbCluster.openBucket(bucketName, bucketPassword, function(err) {
            if (err) {
                cbLogger.error("couchbaseWrapper.listViews cbCluster.openBucket for bucket '%s' threw error: ", bucketName, util.inspect(err));
                throw err;
            }
        });
        cbBucket.query(cbQuery, function(err, viewRows) {
            if (err) {
                cbLogger.error("cbBucket.query (host=%s bucket=%s designDoc=%s view=%s) returned err: %s", cbHost, bucketName, designDocName, viewName, util.inspect(err));
                cbBucket.disconnect();
                return callback(err);
            } else {
//                cbLogger.debug("cbBucket.query (host=%s bucket=%s designDoc=%s view=%s) returned viewRows: %s", cbHost, bucketName, designDocName, viewName, util.inspect(viewRows));

                var docIds = [];
                var viewKeys = {};
                var viewValues = {};
                viewRows.forEach(function (viewRow) {
//                    cbLogger.debug("viewRow = %s", util.inspect(viewRow));

                    var docId = viewRow.id;
                    docIds.push(docId);

                    viewKeys[docId] = viewRow.key;
                    viewValues[docId] = viewRow.value;
                });

                cbLogger.debug("docIds = %s", util.inspect(docIds));
                cbLogger.debug("viewKeys = %s", util.inspect(viewKeys));
                cbLogger.debug("viewValues = %s", util.inspect(viewValues));

                var resultRows = [];
                if (docIds && docIds.length > 0) {
                    cbBucket.getMulti(docIds, function (err, rows) {
                        if (err) {
                            cbLogger.error("cbBucket.getMulti returned error: %s", util.inspect(err));
                            cbBucket.disconnect();
                            return callback(err);
                        } else {
//                            cbLogger.debug("cbBucket.getMulti returned: %s", util.inspect(rows));
                            docIds.forEach(function (docId) {
                                var row = rows[docId];
                                resultRows.push({key: viewKeys[docId], value: viewValues[docId], id: docId, cas: row.cas, doc: row.value, error: row.error});
                            });

                            cbBucket.disconnect();
//                            cbLogger.debug("couchbaseWrapper.listDocuments returning: %s", util.inspect(resultRows));
                            return callback(null, resultRows);
                        }
                    });
                } else {
                    cbBucket.disconnect();
//                    cbLogger.debug("couchbaseWrapper.listDocuments returning: %s", util.inspect(resultRows));
                    return callback(null, resultRows);
                }
            }
        });
    };
    
    exports.createOrReplaceDocument = function(bucketName, docId, docBody, callback) {
        var bucketPassword = cbBucketPasswords[bucketName];
        
        var cbBucket = cbCluster.openBucket(bucketName, bucketPassword, function(err) {
            if (err) {
                cbLogger.error("couchbaseWrapper.createOrReplaceDocument cbCluster.openBucket for bucket '%s' threw error: ", bucketName, util.inspect(err));
                throw err;
            }
        });
        
        cbBucket.upsert(docId, docBody, function(err, result) {
            if (err) {
                cbLogger.error("couchbaseWrapper.createOrReplaceDocument cbBucket.upsert for bucket '%s' and docId '%s' threw error: ", bucketName, docId, util.inspect(err));
                throw err;
            }
            
            cbLogger.debug("couchbaseWrapper.createOrReplaceDocument cbBucket.upsert for bucket '%s' and docId '%s' result: ", bucketName, docId, util.inspect(result));
            return callback(null, result);
        });
    };
    
    exports.deleteDocument = function(bucketName, docId, callback) {
        var bucketPassword = cbBucketPasswords[bucketName];
        
        var cbBucket = cbCluster.openBucket(bucketName, bucketPassword, function(err) {
            if (err) {
                cbLogger.error("couchbaseWrapper.deleteDocument cbCluster.openBucket for bucket '%s' threw error: ", bucketName, util.inspect(err));
                throw err;
            }
        });
        
        cbBucket.remove(docId, function(err, result) {
            if (err) {
                cbLogger.error("couchbaseWrapper.deleteDocument cbBucket.remove for bucket '%s' and docId '%s' threw error: ", bucketName, docId, util.inspect(err));
                throw err;
            }
            
            cbLogger.debug("couchbaseWrapper.deleteDocument cbBucket.remove for bucket '%s' and docId '%s' result: ", bucketName, docId, util.inspect(result));
            return callback(null, result);
        });
    };
})();
