(function () {
    'use strict';

    var util = require('util');

    var defaultPageSize = 10;
    var defaultTimeoutSeconds = 60;

    var packageJson = require('../package.json');
    var packageMsg = util.format("\n%s: %s\nVersion %s Copyright %s\n\n", packageJson.name, packageJson.description, packageJson.version, packageJson.copyright);
    var epilogMsg = util.format("For more information see %s/blob/%s/README.md\n\nReport issues at %s", packageJson.repository.url, packageJson.version, packageJson.bugs.url)

    // https://github.com/chevex/yargs
    var getArgv = function (userArgArray) {
        var yargs = require('yargs')
            .usage(packageMsg + 'Usage: node server [--host=(host)] [--user=(user)] [--password=(password)] [--debug] [--responses] [--listen=8008] [--proxy=my.proxy:8888]')
            .example("node server", "Listens on port 8008 with minimal logging. Requires user to enter Couchbase host, user and password.\n")
            .example("node server -h localhost -u admin", "Listens on port 8008 with minimal logging. Defaults to Couchbase on 'localhost' as user 'admin'. Requires user to enter Couchbase password.\n")
            .example("node server -u admin -p demo01 -l 8080", "Listens on port 8080 with minimal logging. Defaults to Couchbase user 'admin' with password 'demo01'. Requires user to enter Couchbase host name.\n")
            .example("node server --proxy=my.proxy:8888", "Listens on port 8008 and uses the designated network proxy.\n")
            .option('?', {
                alias: 'help',
                describe: 'Display the usage.'
            })
            .version(packageJson.version, 'v', "Show version number.").alias('v', 'version')
            .option('h', {
                alias: 'host',
                describe: 'Set Couchbase host.'
            })
            .option('u', {
                alias: 'user',
                describe: 'Set Couchbase user.'
            })
            .option('p', {
                alias: 'password',
                describe: 'Set Couchbase password.'
            })
            .option('s', {
                alias: 'pagesize',
                describe: 'Set document viewer page size. Negative means reverse sort. [min -1000, max 1000]',
                default: defaultPageSize
            })
            .option('t', {
                alias: 'timeout',
                describe: 'Maximum time in seconds to scan for document query results.',
                default: defaultTimeoutSeconds
            })
            .option('l', {
                alias: 'listen',
                describe: 'Set HTTP listen port.',
                default: process.env.port || 8008
            })
            .option('x', {
                alias: 'proxy',
                describe: 'Enable a request proxy server and port.'
            })
            .option('d', {
                alias: 'debug',
                describe: 'Enable debug level log messages.'
            })
            .option('r', {
                alias: 'responses',
                describe: 'Log responses from server API requests.'
            })
            .epilog(epilogMsg)
            .strict();

        var argv = null;
        if (userArgArray) {
            argv = yargs.parse(userArgArray);
        } else {
            argv = yargs.argv;
        }

        if (argv.help) {
            yargs.showHelp();
            process.exit(1);
        } else if (argv._ && (argv._.length > 0)) {
            yargs.showHelp();
            console.log("Unknown token: " + argv._);
            process.exit(1);
        }

        if (argv.pagesize === 0) {
            argv.pagesize = defaultPageSize;
        }

        return argv;
    };

    exports.parseProcessArguments = function () {
        var argv = getArgv();
        return argv;
    };

    exports.parseArgumentString = function (argumentString) {
        var splitRegularExpression = /\s+/;
        var userArgArray = argumentString.split(splitRegularExpression);
        var argv = getArgv(userArgArray);
        return argv;
    };
})();
