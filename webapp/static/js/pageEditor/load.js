var loadPage = new BaseJs({
    pool: {
        containerName: 'pageLoader',
        modulesControllerLoadPath: '/static/js/pageEditor/modules/'
    },
    /**
     * 初始化
     * @param loadPath 模块文件载入路径
     */
    init: function (loadPath) {
        var that = loadPage;
        loadPath && (that.pool.modulesControllerLoadPath = loadPath);
        that.runInits();
    },
    inits: {
        element: function () {
            var that = loadPage,
                $container = that.getEle('$container');

            that.setEle({
                '$lc': $('[data-role="loader_container"]')
            })
        },
        event: function () {
            var that = loadPage,
                $container = that.getEle('$container');

        },
        /**
         * 初始化模块管理器
         */
        initModulesController: function () {
            var that = loadPage;
            ModulesController.init(
                'load',
                that.pool.modulesControllerLoadPath
            );
        }
    },
    build: function (params) {
        var that = loadPage;
        $('body').css('background', params.backColor);
        ModulesController.loader.build(that.getEle('$lc'), params.list, function () {

        });
    }

});

$(function(){
    // moment.locale('zh-cn');
    window.System = {};
    System.baseUrl = "../../";
    loadPage.init(System.baseUrl+'static/modules/');

    loadPage.build({"backColor":"","list":[{"id":7519,"mId":"text","type":"text","data":{"html":"<p><b>asdasdasd</b></p>"}},{"id":4452,"mId":"countdown","type":"countdown","data":{"name":"新活动","startTime":"2016-11-09 16:07:00","endTime":"2016-11-12 16:06:50","type":"3","imgUrl":""}}]})
});