'use strict';

// Modified from clustermgr to catch JSON.parse errors and convert to callback errors.
// Required to return graceful error response when invalid host or credentials are provided.

var http = require('http');
var util = require('util');

function _respRead(callback) {
    return function(resp) {
        resp.setEncoding('utf8');
        var strBuffer = '';
        resp.on('data', function (data) {
            strBuffer += data;
        });
        resp.on('end', function () {
            callback(null, resp, strBuffer);
        });
        resp.on('error', function (err) {
            callback(err, resp, null);
        });
    };
}

/**
 * @class
 * Class for performing management operations against a cluster.
 *
 * @param cluster
 * @param username
 * @param password
 *
 * @private
 *
 * @since 2.0.0
 * @committed
 */
function ClusterManager(cluster, username, password) {
    this._cluster = cluster;
    this._username = username;
    this._password = password;
}

/**
 * @param path
 * @param method
 * @param uses_qs
 * @returns {http.ClientRequest}
 *
 * @private
 * @ignore
 */
ClusterManager.prototype._mgmtRequest = function(path, method, uses_qs) {
    var clusterHosts = this._cluster.dsnObj.hosts;
    var myHost = clusterHosts[Math.floor(Math.random()*clusterHosts.length)];
    var reqOpts = {
        hostname: myHost[0],
        port: myHost[1] ? myHost[1] : 8091,
        path: '/' + path,
        method: method,
        headers: {
            'Content-Type': (uses_qs ? 'application/x-www-form-urlencoded' :
                'application/json' )
        }
    };
    if (this._password) {
        reqOpts.auth = this._username + ':' + this._password;
    }
    return http.request(reqOpts);
};

/**
 * @param callback
 *
 * @since 2.0.0
 * @committed
 */
ClusterManager.prototype.listBuckets = function(callback) {
    var path = 'pools/default/buckets';

    var httpReq = this._mgmtRequest(path, 'GET');
    httpReq.on('error', function(err, resp) {
        if (err) {
            var errMsg = util.format("Could not connect to Couchbase host: %s", err.message);
            return callback(errMsg, null);
        } else {
            return callback(null, resp);
        }
    });
    httpReq.on('response', _respRead(function(err, resp, data) {
        if (err) {
            return callback(err);
        }
        if (resp.statusCode !== 200) {
            try {
                var errData = JSON.parse(data);
                return callback(new Error(errData.reason), null);
            } catch (e) {
                var errMsg = util.format("Couchbase responded '%s' -- Are your credentials correct?", e.message);
                return callback(errMsg, null);
            }
        }
        try {
            var bucketInfo = JSON.parse(data);
            callback(null, bucketInfo);
        } catch (e) {
            var errMsg = util.format("Error parsing listBuckets result: %s", e.message);
            return callback(errMsg, null);
        }
    }));
    httpReq.end();
};

module.exports = ClusterManager;
