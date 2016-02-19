(function () {
    'use strict';

    app.controller('CreditsCtrl', function ($scope, $rootScope) {
        $rootScope.breadcrumb.items = [
            {
                text: 'Credits'
            }
        ];

        $scope.credits = [];

        $scope.credits.push({
            title: 'My DocumentDB',
            link: 'https://github.com/shaunxu/myazdocdb',
            description: 'DocumentDB is a fully-managed, scalable, NoSQL document database service in Microsoft Azure. It provides rich query and indexing capabilities over a schema-free JSON data model. It also provides configurable and reliable performance, native JavaScript transactional processing, and is built for the cloud with elastic scale.',
            license: 'https://github.com/shaunxu/myazdocdb/blob/master/LICENSE'
        });

        $scope.credits.push({
            title: 'JSONEditor',
            link: 'https://github.com/josdejong/jsoneditor',
            description: 'A web-based tool to view, edit and format JSON.',
            license: 'https://github.com/josdejong/jsoneditor/blob/master/LICENSE'
        });

        $scope.credits.push({
            title: 'Couchbase Node.js SDK 2.1',
            link: 'https://github.com/couchbase/couchnode',
            description: 'Couchbase Server is a distributed NoSQL database engineered for performance, scalability, and availability. It enables developers to build applications easier and faster by leveraging the power of SQL with the flexibility of JSON.',
            license: 'https://github.com/couchbase/couchnode/blob/master/LICENSE'
        });

        $scope.credits.push({
            title: 'Node.js',
            link: 'http://nodejs.org/',
            description: "Node.js is a platform built on Chrome's JavaScript runtime for easily building fast, scalable network applications. Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient, perfect for data-intensive real-time applications that run across distributed devices.",
            license: 'https://raw.githubusercontent.com/joyent/node/v0.12.0/LICENSE'
        });

        $scope.credits.push({
            title: 'NW.js',
            link: 'http://nwjs.io/',
            description: "NW.js lets you call all Node.js modules directly from DOM and enables a new way of writing applications with all Web technologies. It was previously known as the 'node-webkit' project.",
            license: 'https://github.com/nwjs/nw.js/blob/master/LICENSE'
        });

        $scope.credits.push({
            title: 'Express',
            link: 'http://expressjs.com/',
            description: 'Fast, unopinionated, minimalist web framework for Node.js',
            license: 'https://github.com/strongloop/express/blob/master/LICENSE'
        });

        $scope.credits.push({
            title: 'exprjs',
            link: 'https://www.npmjs.com/package/exprjs',
            description: 'Expression language for javascript (in javascript). An alternative to eval() supporting javascript syntax for expressiveness and safe execution.',
            license: 'https://github.com/jleibund/exprjs/blob/master/LICENSE'
        });

        $scope.credits.push({
            title: 'body-parser',
            link: 'https://www.npmjs.com/package/body-parser',
            description: 'Node.js body parsing middleware.',
            license: 'https://github.com/expressjs/body-parser/blob/master/LICENSE'
        });

        $scope.credits.push({
            title: 'yargs',
            link: 'https://www.npmjs.com/package/yargs',
            description: "Yargs be a node.js library fer hearties tryin' ter parse optstrings. With yargs, ye be havin' a map that leads straight to yer treasure! Treasure of course, being a simple option hash.",
            license: 'https://github.com/chevex/yargs/blob/master/LICENSE'
        });

        $scope.credits.push({
            title: 'moment',
            link: 'https://www.npmjs.com/package/moment',
            description: "A lightweight JavaScript date library for parsing, validating, manipulating, and formatting dates.",
            license: 'https://github.com/moment/moment/blob/develop/LICENSE'
        });

        $scope.credits.push({
            title: 'compression',
            link: 'https://www.npmjs.com/package/compression',
            description: 'Node.js compression middleware.',
            license: 'https://github.com/expressjs/compression/blob/master/LICENSE'
        });

        $scope.credits.push({
            title: 'log4js',
            link: 'https://www.npmjs.com/package/log4js',
            description: 'This is a conversion of the log4js framework to work with node.',
            license: 'http://www.apache.org/licenses/LICENSE-2.0'
        });
        
        $scope.credits.push({
            title: 'caolan/async ',
            link: 'https://github.com/caolan/async',
            description: 'Async utilities for node and the browser.',
            license: 'https://github.com/caolan/async/blob/master/LICENSE'
        });

        $scope.credits.push({
            title: 'jQuery UI',
            link: 'http://jqueryui.com/',
            description: 'jQuery UI is a curated set of user interface interactions, effects, widgets, and themes built on top of the jQuery JavaScript Library.',
            license: 'https://jquery.org/license/'
        });

        $scope.credits.push({
            title: 'Bootstrap',
            link: 'http://getbootstrap.com/',
            description: 'Bootstrap is the most popular HTML, CSS, and JS framework for developing responsive, mobile first projects on the web.',
            license: 'https://github.com/twbs/bootstrap/blob/master/LICENSE'
        });

        $scope.credits.push({
            title: 'AngularJS',
            link: 'https://angularjs.org/',
            description: 'HTML enhanced for web apps!',
            license: 'https://github.com/angular/angular.js/blob/master/LICENSE'
        });

        $scope.credits.push({
            title: 'AngularUI UI-Router',
            link: 'https://github.com/angular-ui/ui-router',
            description: 'The de-facto solution to flexible routing with nested views.',
            license: 'https://github.com/angular-ui/ui-router/blob/master/LICENSE'
        });

        $scope.credits.push({
            title: 'AngularUI UI-Bootstrap',
            link: 'http://angular-ui.github.io/bootstrap/',
            description: 'Bootstrap components written in pure AngularJS by the AngularUI Team.',
            license: 'https://github.com/angular-ui/bootstrap/blob/master/LICENSE'
        });

        $scope.credits.push({
            title: 'AngularUI ng-grid',
            link: 'http://angular-ui.github.io/ng-grid/',
            description: 'Angular Data Grid written in AngularJS and jQuery by the AngularUI Team.',
            license: 'https://github.com/angular-ui/ng-grid/blob/master/LICENSE.md'
        });
    });
})();