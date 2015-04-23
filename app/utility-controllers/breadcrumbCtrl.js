(function () {
    'use strict';

    app.controller('BreadcrumbCtrl', function ($rootScope) {
        $rootScope.breadcrumb = {
            direction: '',
            items: []
        };
    });
})();