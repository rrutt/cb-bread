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
            title: 'jQuery',
            link: 'http://jquery.com/',
            description: 'jQuery is a fast, small, and feature-rich JavaScript library.',
            license: 'https://jquery.org/license/'
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

        $scope.credits.push({
            title: 'JSONEditor',
            link: 'https://github.com/josdejong/jsoneditor',
            description: 'A web-based tool to view, edit and format JSON.',
            license: 'https://github.com/josdejong/jsoneditor/blob/master/LICENSE'
        });
    });
})();