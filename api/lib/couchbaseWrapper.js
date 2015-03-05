(function () {
    'use strict';

    var exprjs = require('exprjs');
    var exprjsParser = new exprjs();

    var util = require('util');

    // http://docs.couchbase.com/developer/node-2.0/introduction.html
    // http://docs.couchbase.com/developer/node-2.0/hello-couchbase.html
    var cb = require('couchbase');

    var cbLogger = null;
    var cbHostInfoCache = {};

    var credentialsComplete = function(host, user, password) {
        return (host && host.length > 0) &&
            (user && user.length > 0) &&
            (password && password.length > 0);
    };
    exports.credentialsComplete = credentialsComplete;

    exports.initialize = function(logger, host, user, password) {
        cbLogger = logger;
        if (credentialsComplete(host, user, password)) {
            var needToInitialize = true;
            var cachedHostInfo = cbHostInfoCache[host];
            if (cachedHostInfo) {
                var cluster = cachedHostInfo.cluster;
                var clusterManager = cachedHostInfo.clusterManager;
                var cachedUser = cachedHostInfo.user;
                var cachedPassword = cachedHostInfo.password;
                if (cluster && clusterManager && (user === cachedUser) && (password === cachedPassword)) {
                    cbLogger.debug("couchbaseWrapper.initialize using cached info for %s as user %s", host, user);
                    needToInitialize = false;
                }
            }

            if (needToInitialize) {
                cbLogger.info("couchbaseWrapper.initialize %s as user %s", host, user);

                var cluster = new cb.Cluster(host);
                var clusterManager = cluster.manager(user, password);
                var hostInfo = {
                    cluster: cluster,
                    clusterManager: clusterManager,
                    user: user,
                    password: password,
                    bucketPasswords: {}
                };
                cbHostInfoCache[host] = hostInfo;
            }
        } else {
            cbLogger.debug("couchbaseWrapper.initialize bypassed for null credentials");
        }
    };

    exports.listBuckets = function(host, callback) {
        var cachedHostInfo = cbHostInfoCache[host];
        if (!cachedHostInfo) {
            var errMsg = util.format("couchbaseWrapper.listBuckets could not locate host %s in cbHostInfoCache.", host);
            cbLogger.error(errMsg)
            throw new Error(errMsg);
        }

        var clusterManager = cachedHostInfo.clusterManager;
        var bucketPasswords = cachedHostInfo.bucketPasswords;

        clusterManager.listBuckets(function(err, bucketInfoList) {
            if (err) {
                cbLogger.error("couchbaseWrapper.listBuckets error: ", util.inspect(err));
                return callback(err);
            } else {
                var bucketList = [];
                bucketInfoList.forEach(function(bucketInfo) {
                    var bucketName = bucketInfo.name;
                    var bucketPassword = bucketInfo.saslPassword;
                    var bucket = { id: bucketName };
                    bucketList.push(bucket);
                    bucketPasswords[bucketName] = bucketPassword;
                });
                cbLogger.debug("couchbaseWrapper.listBuckets bucketList = %s", util.inspect(bucketList));
                return callback(null, bucketList);
            }
        });
    };

    exports.listViews = function(host, bucketName, callback) {
        var cachedHostInfo = cbHostInfoCache[host];
        if (!cachedHostInfo) {
            var errMsg = util.format("couchbaseWrapper.listViews could not locate host %s in cbHostInfoCache.", host);
            cbLogger.error(errMsg)
            throw new Error(errMsg);
        }

        var cluster = cachedHostInfo.cluster;
        var bucketPasswords = cachedHostInfo.bucketPasswords;
        var bucketPassword = bucketPasswords[bucketName];
        
        var cbBucket = cluster.openBucket(bucketName, bucketPassword, function(err) {
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

    var filterResultRow = function(resultRow, parsedDocFilter) {
        var keep = true;
        if (parsedDocFilter) {
            cbLogger.debug("filterResultRow: %s", util.inspect(resultRow));
            try {
                keep = exprjsParser.run(parsedDocFilter, resultRow);
                cbLogger.debug("Filter passes for resultRow: %s", util.inspect(resultRow));
            } catch (err) {
                resultRow.error = err;
                cbLogger.debug("Filter fails for resultRow: %s", util.inspect(resultRow));
                keep = false;
            }
            if (!keep) {
                resultRow.id = null;
                resultRow.value = null;
                resultRow.doc = null;
                resultRow.cas = "(Fails Doc Filter.)";
            }
        }
        return keep;
    };

    var recursivelyQueryBucket = function(cbBucket, cbQuery, parsedDocFilter, resultSet, callback) {
        cbBucket.query(cbQuery, function (err, viewRows) {
            if (err) {
                cbLogger.error("cbBucket.query (host=%s bucket=%s designDoc=%s view=%s) returned err: %s", host, bucketName, designDocName, viewName, util.inspect(err));
                cbBucket.disconnect();
                return callback(err);
            } else {
                var docIds = [];
                var viewKeys = {};
                var viewValues = {};
                viewRows.forEach(function (viewRow) {
                    var docId = viewRow.id;
                    docIds.push(docId);

                    viewKeys[docId] = viewRow.key;
                    viewValues[docId] = viewRow.value;
                });

                cbLogger.debug("docIds = %s", util.inspect(docIds));
                cbLogger.debug("viewKeys = %s", util.inspect(viewKeys));
                cbLogger.debug("viewValues = %s", util.inspect(viewValues));

                if (docIds && docIds.length > 0) {
                    cbBucket.getMulti(docIds, function (err, rows) {
                        if (err) {
                            cbLogger.debug("cbBucket.getMulti returned error: %s", util.inspect(err));
                            cbBucket.disconnect();
                            var suggestedPageSize = Math.abs(pageSize) - err;
                            var userMsg = util.format("Couchbase server cannot return %d documents for this view; try page size %d.", pageSize, suggestedPageSize);
                            return callback(userMsg);
                        } else {
                            var docIndex = resultSet.skipCount;
                            docIds.forEach(function (docId) {
                                docIndex++;
                                var row = rows[docId];
                                var resultRow = {index: docIndex, key: viewKeys[docId], value: viewValues[docId], id: docId, cas: row.cas, doc: row.value, error: row.error};
                                var keep = filterResultRow(resultRow, parsedDocFilter);
                                if (keep) {
                                    resultSet.resultRows.push(resultRow);
                                }
                            });

                            resultSet.nextSkipCount = resultSet.skipCount + docIds.length;
                            if (resultSet.resultRows.length > 0) {
                                return callback(null, resultSet);
                            } else {
                                cbLogger.warn("No documents passed docFilter for skipCount = %d, moving to next page.", resultSet.skipCount);
                                resultSet.skipCount = resultSet.nextSkipCount;
                                cbQuery.skip(resultSet.skipCount);
                                recursivelyQueryBucket(cbBucket, cbQuery, parsedDocFilter, resultSet, callback);
                            }
                        }
                    });
                } else {
                    cbLogger.warn("No more documents to query.");
                    resultSet.nextSkipCount = null;
                    return callback(null, resultSet);
                }
            }
        });
    };
    
    exports.listDocuments = function(host, bucketName, designDocViewName, keyPrefix, skipCount, pageSize, docFilter, callback) {
        var cachedHostInfo = cbHostInfoCache[host];
        if (!cachedHostInfo) {
            var errMsg = util.format("couchbaseWrapper.listDocuments could not locate host %s in cbHostInfoCache.", host);
            cbLogger.error(errMsg)
            throw new Error(errMsg);
        }

        var cluster = cachedHostInfo.cluster;
        var bucketPasswords = cachedHostInfo.bucketPasswords;
        var bucketPassword = bucketPasswords[bucketName];

        var designDocViewNameElements = designDocViewName.split('/');
        var designDocName = designDocViewNameElements[0];
        var viewName = designDocViewNameElements[1];

        var cbViewQuery = cb.ViewQuery;
        var sortOrder = cbViewQuery.Order.ASCENDING;
        var queryLimit = pageSize;
        var endKeyText = 'z';
        var endNumber = 1.7976931348623157e+308;

        if (pageSize < 0) {
            sortOrder = cbViewQuery.Order.DESCENDING;
            queryLimit = (- pageSize);
            endKeyText = '';
            endNumber = -endNumber;
        }

        var cbQuery = cbViewQuery
            .from(designDocName, viewName)
            .reduce(false)
            .full_set(true)
            .stale(cbViewQuery.Update.BEFORE)  // Options are BEFORE, NONE, AFTER.
            .skip(skipCount)
            .limit(queryLimit)
            .order(sortOrder);

        if (keyPrefix && keyPrefix.length > 0) {
            var endKey = endKeyText;
            cbLogger.debug("couchbaseWrapper.listDocuments keyPrefix = %s", keyPrefix);
            if (keyPrefix.substring(0, 1) === '[') {
                try {
                    keyPrefix = JSON.parse(keyPrefix);
                } catch (e) {
                    return callback("Key Prefix must be a valid JSON value or array, or a number preceded by =.");
                }
                endKey = [endKeyText];
                cbLogger.warn("couchbaseWrapper.listDocuments adjusted keyPrefix = %s", util.inspect(keyPrefix));
            } else if (keyPrefix.substring(0, 1) === '=') {
                keyPrefix = Number(keyPrefix.substring(1));
                if (isNaN(keyPrefix)) {
                    return callback("When preceded by = the Key Prefix must be a valid number.");
                }
                endKey = endNumber;
                cbLogger.warn("couchbaseWrapper.listDocuments adjusted keyPrefix = %s", util.inspect(keyPrefix));
            }
            cbQuery = cbQuery.range(keyPrefix, endKey, true);
        }

        cbLogger.debug("cbQuery = %s", util.inspect(cbQuery, false, 2));

        var parsedDocFilter = null;
        if (docFilter && docFilter.trim().length > 0) {
            cbLogger.debug("docFilter: %s", docFilter);
            try {
                parsedDocFilter = exprjsParser.parse(docFilter);
            } catch (err) {
                var charIndex = err.pos;
                var goodText = docFilter.substring(0, charIndex);
                var badText = docFilter.substring(charIndex);
                cbLogger.error("Error in docFilter:\nGood Text: %s\nBad Text: %s\nError: %s", goodText, badText, util.inspect(err));
            }
        }

        var cbBucket = cluster.openBucket(bucketName, bucketPassword, function(err) {
            if (err) {
                cbLogger.error("couchbaseWrapper.listViews cbCluster.openBucket for bucket '%s' threw error: ", bucketName, util.inspect(err));
                throw err;
            }

            var resultSet = { skipCount: skipCount, nextSkipCount: null, resultRows: [] };
            recursivelyQueryBucket(cbBucket, cbQuery, parsedDocFilter, resultSet, function(err, finalResultSet) {
                cbBucket.disconnect();
                return callback(err, finalResultSet);
            });
        });
    };
    
    exports.createOrReplaceDocument = function(host, bucketName, docId, docBody, callback) {
        var cachedHostInfo = cbHostInfoCache[host];
        if (!cachedHostInfo) {
            var errMsg = util.format("couchbaseWrapper.createOrReplaceDocument could not locate host %s in cbHostInfoCache.", host);
            cbLogger.error(errMsg)
            throw new Error(errMsg);
        }

        var cluster = cachedHostInfo.cluster;
        var bucketPasswords = cachedHostInfo.bucketPasswords;
        var bucketPassword = bucketPasswords[bucketName];
        
        var cbBucket = cluster.openBucket(bucketName, bucketPassword, function(err) {
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
    
    exports.deleteDocument = function(host, bucketName, docId, callback) {
        var cachedHostInfo = cbHostInfoCache[host];
        if (!cachedHostInfo) {
            var errMsg = util.format("couchbaseWrapper.deleteDocument could not locate host %s in cbHostInfoCache.", host);
            cbLogger.error(errMsg)
            throw new Error(errMsg);
        }

        var cluster = cachedHostInfo.cluster;
        var bucketPasswords = cachedHostInfo.bucketPasswords;
        var bucketPassword = bucketPasswords[bucketName];
        
        var cbBucket = cluster.openBucket(bucketName, bucketPassword, function(err) {
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
