(function () {
    'use strict';

    var exprjs = require('exprjs');
    var exprjsParser = new exprjs();

    var moment = require('moment');
    var util = require('util');

    // http://docs.couchbase.com/developer/node-2.0/introduction.html
    // http://docs.couchbase.com/developer/node-2.0/hello-couchbase.html
    var cb = require('couchbase');
    var cbCustomClusterManager = require('./couchbaseCustomClusterManager');

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
//                var clusterManager = cluster.manager(user, password);
                var clusterManager = new cbCustomClusterManager(cluster, user, password)
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

        cbLogger.debug("couchbaseWrapper.listBuckets for host %s", host);

        var clusterManager = cachedHostInfo.clusterManager;
        var bucketPasswords = cachedHostInfo.bucketPasswords;

        clusterManager.listBuckets(function(err, bucketInfoList) {
            if (err) {
                cbLogger.error("couchbaseWrapper.listBuckets error: %s", util.inspect(err));
                return callback(err);
            } else {
                cbLogger.debug("clusterManager.listBuckets returned %s", util.inspect(bucketInfoList));
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
        var filterResult = true;
        if (parsedDocFilter) {
            if (resultRow.error) {
                cbLogger.warn("Filter bypassed Document ID '%s': %s", resultRow.id, resultRow.error.message);
                filterResult = false
            } else {
                try {
                    filterResult = exprjsParser.run(parsedDocFilter, resultRow, util);
                    cbLogger.debug("Filter returned %s for resultRow: %s", JSON.stringify(filterResult), util.inspect(resultRow.id));
                } catch (err) {
                    resultRow.error = err;
                    cbLogger.debug("Filter threw error '%s' for resultRow: %s", err.message, util.inspect(resultRow.id));
                    filterResult = false;
                }
            }
            if (!filterResult) {
                resultRow.id = null;
                resultRow.value = null;
                resultRow.doc = null;
                resultRow.cas = "(Fails Doc Filter.)";
            }
        }
        return filterResult;
    };

    var formatResultSetMessage = function(resultSet, queryLimit, parsedDocFilter, queryTimeoutReached) {
        var endTime = moment();
        var duration = endTime.diff(resultSet.startTime, 'seconds', true); // Include fraction.
        var docCount = resultSet.resultRows.length;
        if (docCount === 1) {
            resultSet.message = util.format("Found %d document in %d seconds. ", docCount, duration);
        } else {
            resultSet.message = util.format("Found %d documents in %d seconds. ", docCount, duration);
        }

        if (queryTimeoutReached) {
            resultSet.message = resultSet.message + util.format(" Query timeout of %d seconds was reached. Click Next to scan for more results.", resultSet.queryTimeoutSeconds);
        } else {
            var noDocs = "No documents";
            if ((resultSet.skipCount > 0) || (docCount > 0)) {
                noDocs = "No more documents";
            }
            if (docCount < queryLimit) {
                if (parsedDocFilter) {
                    resultSet.message = resultSet.message + noDocs + " match the Key Prefix and Doc Filter criteria.";
                } else {
                    resultSet.message = resultSet.message + noDocs + " match the Key Prefix.";
                }
            }
        }
    };

    var recursivelyQueryBucket = function(cbBucket, cbQuery, queryLimit, parsedDocFilter, resultSet, callback) {
        cbBucket.query(cbQuery, function (err, viewRows) {
            if (err) {
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

                var queryTimeoutReached = false;

                if (docIds && docIds.length > 0) {
                    resultSet.nextSkipCount = resultSet.skipCount + queryLimit;

                    cbBucket.getMulti(docIds, function (err, rows) {
                        if (err) {
                            cbLogger.warn("cbBucket.getMulti returned error count = %s", util.inspect(err));
                        }

                        var docIndex = resultSet.skipCount;
                        var keptRows = 0;
                        docIds.forEach(function (docId) {
                            docIndex++;
                            var row = rows[docId];
                            var resultRow = {index: docIndex, key: viewKeys[docId], value: viewValues[docId], id: docId, cas: row.cas || row.error, doc: row.value, error: row.error};
                            var keep = (resultSet.resultRows.length < queryLimit) && filterResultRow(resultRow, parsedDocFilter);
                            if (keep) {
                                keptRows++;
                                resultSet.resultRows.push(resultRow);
                                resultSet.nextSkipCount = docIndex;
                            }
                        });

                        var currentTime = moment();
                        var duration = currentTime.diff(resultSet.startTime, 'seconds', true); // Include fraction.
                        queryTimeoutReached = (duration >= resultSet.queryTimeoutSeconds);

                        var stopRecursion = false;
                        if (queryTimeoutReached || (resultSet.resultRows.length >= queryLimit)) {
                            stopRecursion = true;
                        } else {
                            if (parsedDocFilter) {
                                if (keptRows === 0) {
                                    cbLogger.warn("No documents passed the Doc Filter for Skip Count = %d. (%d seconds)", resultSet.skipCount, duration);
                                } else if (keptRows === 1) {
                                    cbLogger.warn("%d document passed the Doc Filter for Skip Count = %d. (%d seconds)", keptRows, resultSet.skipCount, duration);
                                } else {
                                    cbLogger.warn("%d documents passed the Doc Filter for Skip Count = %d. (%d seconds)", keptRows, resultSet.skipCount, duration);
                                }
                            }
                        }

                        if (stopRecursion) {
                            formatResultSetMessage(resultSet, queryLimit, parsedDocFilter, queryTimeoutReached);
                            return callback(null, resultSet);
                        } else {
                            resultSet.skipCount = resultSet.nextSkipCount;
                            cbQuery.skip(resultSet.skipCount);
                            return recursivelyQueryBucket(cbBucket, cbQuery, queryLimit, parsedDocFilter, resultSet, callback);
                        }
                    });
                } else {
                    formatResultSetMessage(resultSet, queryLimit, parsedDocFilter, queryTimeoutReached);
                    return callback(null, resultSet);
                }
            }
        });
    };

    var configureRangeInfoSync = function(userStartValue, sortOrder) {
        var result = { startKey: null, endKey: null, inclusive: true };
        var startValue = userStartValue;
        var endValue = null;
        var startNumberString = null;

        var swapKeys = false;
        var nextNumberOffset = 1;
        if (sortOrder === cb.ViewQuery.Order.DESCENDING) {
            swapKeys = true;
        }

        if (startValue === null) {
            endValue = '';
        } else if (startValue.substring) {
            endValue = startValue.concat('zzzzzzzzzz');
            if ((startValue.length > 0) && (startValue.substring(0, 1) === '=')) {
                startNumberString = startValue.substring(1);
            }
        } else {
            startNumberString = startValue.toString();
        }
        
        if (startNumberString) {
            startValue = Number(startNumberString);
            if (isNaN(startValue)) {
                result.error = {
                    message: "When preceded by '=' a Key Prefix value must be a valid number.",
                    badText: userStartValue
                };
            } else {
                var endNumberString = startValue.toString();
                if (endNumberString.indexOf('.') < 0) {
                    endNumberString = endNumberString + '.';
                }
                endNumberString = endNumberString + '9999999999';
                endValue = Number(endNumberString);
            }
        }

        if (swapKeys) {
            result.startKey = endValue;
            result.endKey = startValue;
        } else {
            result.startKey = startValue;
            result.endKey = endValue;
        }

        return result;
    };

    var configureQueryRangeSync = function(cbQuery, keyPrefix, sortOrder) {
        if (keyPrefix && keyPrefix.length > 0) {
            cbLogger.debug("couchbaseWrapper.configureQueryRangeSync keyPrefix = %s", keyPrefix);

            var rangeInfo = null;
            if (keyPrefix.substring(0, 1) === '[') {
                try {
                    var startArray = JSON.parse(keyPrefix);
                    var numValues = startArray.length;
                    if (numValues === 0) {
                        return "Key Prefix cannot be an empty array.";
                    }
                    var lastStartValue = startArray[numValues - 1];
                    rangeInfo = configureRangeInfoSync(lastStartValue, sortOrder);
                    if (!rangeInfo.error) {
                        startArray[numValues - 1] = rangeInfo.startKey;
                        rangeInfo.startKey = startArray;

                        var endArray = JSON.parse(keyPrefix); // Clone.
                        endArray[numValues - 1] = rangeInfo.endKey;
                        rangeInfo.endKey = endArray;
                    }
                } catch (e) {
                    cbLogger.error("Parsing array keyPrefix '%s' threw exception: %s", keyPrefix, util.inspect(e));
                    return util.format("Key Prefix must be a valid JSON value, array, or a number preceded by =.");
                }
            } else {
                rangeInfo = configureRangeInfoSync(keyPrefix, sortOrder);
            }

            if (rangeInfo.error) {
                return rangeInfo.error;
            } else {
                cbLogger.info("Query range: %s", util.inspect(rangeInfo));
                cbQuery.range(rangeInfo.startKey, rangeInfo.endKey, rangeInfo.inclusive);
            }
        }

        return null;  // Success.
    };
    
    exports.listDocuments = function(host, bucketName, designDocViewName, keyPrefix, skipCount, pageSize, docFilter, queryTimeoutSeconds, callback) {
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

        if (pageSize < 0) {
            sortOrder = cbViewQuery.Order.DESCENDING;
            queryLimit = (- pageSize);
        }

        var cbQuery = cbViewQuery
            .from(designDocName, viewName)
            .reduce(false)
            .full_set(true)
            .stale(cbViewQuery.Update.BEFORE)  // Options are BEFORE, NONE, AFTER.
            .skip(skipCount)
            .limit(queryLimit)
            .order(sortOrder);

        var errorMessage = configureQueryRangeSync(cbQuery, keyPrefix, sortOrder);
        if (errorMessage) {
            cbLogger.error(errorMessage);
            return callback(errorMessage);
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
                var parseErrorMsg = util.format("Invalid Javascript in Doc Filter: %s", err.message);
                var parseError = { message: parseErrorMsg, goodText: goodText, badText: badText };
                cbLogger.error(util.inspect(parseError));
                return callback(parseError);
            }
        }

        var cbBucket = cluster.openBucket(bucketName, bucketPassword, function(err) {
            if (err) {
                cbLogger.error("couchbaseWrapper.listDocuments cbCluster.openBucket for bucket '%s' threw error: ", bucketName, util.inspect(err));
                throw err;
            }

            var resultSet = { skipCount: skipCount, nextSkipCount: null, resultRows: [] };
            resultSet.startTime = moment();
            resultSet.queryTimeoutSeconds = queryTimeoutSeconds;
            return recursivelyQueryBucket(cbBucket, cbQuery, queryLimit, parsedDocFilter, resultSet, function(err, finalResultSet) {
                cbBucket.disconnect();
                if (err) {
                    var queryError = {
                        message: err.message,
                        host: host,
                        bucket: bucketName,
                        designDoc: designDocName,
                        view: viewName
                    }
                    cbLogger.error("couchbaseWrapper.recursivelyQueryBucket error: %s", util.inspect(err));
                    return callback(queryError);
                } else {
                    return callback(null, finalResultSet);
                }
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
