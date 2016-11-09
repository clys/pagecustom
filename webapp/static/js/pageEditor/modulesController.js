var ModulesController = {
    tag: 'data-module-id',
    containerId: 'modulesControllerContainer',
    pool: {},
    loadPath: 'modules/',
    mode: 'load',
    /**
     * 载入模块（异步）
     * @param type 类型
     * @param fn 回调
     * @param ex ajax参数
     *
     * <p>模块文件格式为html或js</p>
     * <p>模块文件需自行向ModulesController.pool中添加自己的函数</p>
     * <p>必须的函数有editor(e, param)构建编辑器、getEdit(e)获取编辑参数、loader(e, param)构建展示、destroy(e, param)销毁编辑器</p>
     * <p>可选的函数有init(mode)</p>
     * <p>editor、getEdit、destroy中的e为编辑器容器，loader中的e为模块展示容器</p>
     */
    getModuleController: function (type, fn, ex) {
        var that = ModulesController, queueName = 'modulesController_loading_' + type;
        utils.fnQueue.add(function () {
            fn && fn(that.pool[type]);
        }, queueName);

        if (utils.fnQueue.getQueue(queueName).length > 1) return;
        if (that.pool[type]) {
            utils.fnQueue.run(queueName)
        } else {
            $.ajax($.extend(
                {
                    url: that.loadPath + type + '.html',
                    dataType: 'html',
                    success: function (html) {
                        var $c = $('#' + that.containerId);
                        if ($c.size() == 0) {
                            $c = $('<div style="display:none;" id="' + that.containerId + '"></div>');
                            $('body').append($c);
                        }
                        $c.append(html);
                        run();
                    },
                    error: function () {
                        $.ajax($.extend({
                            url: that.loadPath + type + '.js',
                            dataType: 'text',
                            success: function (js) {
                                eval(js);
                                run();
                            }
                        }, ex))
                    }
                }, ex
            ));
            function run() {
                that.pool[type] && that.pool[type].init && that.pool[type].init(that.mode);
                utils.fnQueue.run(queueName)
            }
        }
    },
    /**
     * 初始化
     * @param mode 模式 edit/load
     * @param loadPath 模块载入路径
     * @param ele 模块容器
     * @param edit 编辑器容器
     * @param clickSelector 点击模块开始编辑的选择器
     */
    init: function (mode, loadPath, ele, edit, clickSelector) {
        loadPath && (this.loadPath = loadPath);
        mode && (this.mode = mode);
        this.getModuleController('modules_common', null, {async: false});
        if(mode === 'edit'){
            this.editor.init(ele, edit, clickSelector);
        }
    },
    findTop: function (ele, e) {
        var $ele = $(ele), $e = $(e);
        if ($e.parent().get(0) == $ele.get(0)) {
            return e;
        } else {
            return $e.parentsUntil($ele).last();
        }
    },
    loader: {
        addTpl: function () {
            return '<div ' + ModulesController.tag + '="{%=param.id%}" data-mid="{%=param.mId%}" type="{%=param.type%}"></div>';
        },
        add: function (ele, param) {
            var that = ModulesController.loader, $ele = $(ele);
            $ele.append(utils.string.buildTpl(that.addTpl(), {param: param}));
            return $ele.find('[' + ModulesController.tag + '="' + param.id + '"]');
        },
        build: function (ele, params, buildAfter) {
            var that = ModulesController.loader, $ele = $(ele), paramSize;
            if (params.constructor != Array) params = [params];
            paramSize = params.length;
            $.each(params, function (i, param) {
                ModulesController.getModuleController(param.type, function (controller) {
                    if (!controller) return true;
                    var $e = $ele.find('[' + ModulesController.tag + '="' + param.id + '"]');
                    if ($e.size() == 0) {
                        $e = that.add($ele, param);
                    }
                    $e.data('param', param);
                    controller.loader($e, param);

                    if (--paramSize <= 0) {
                        //由于采用的是异步加载，可能导致加载后模块顺序错误，以原始数据进行排序纠正出现的错误
                        params.length > 1 && that.sort(ele, params);
                        buildAfter && buildAfter();
                    }
                });
            });
        },
        sort: function (ele, params) {
            var $ele = $(ele), $e;
            $.each(params, function (i, param) {
                $e = $ele.find('[' + ModulesController.tag + '="' + param.id + '"]');
                if ($e.size() == 0) return true;
                $ele.append(ModulesController.findTop($ele, $e));
            })
        }
    },
    editor: {
        edit: '[.modules-controller-edit]',
        mc:null,
        init: function (ele, edit, clickSelector) {
            var that = ModulesController.editor,
                $ele = $(ele),
                $edit = $(edit);
            that.mc = $ele;
            if ($edit.size() > 0) that.edit = $edit;
            $ele.on('click', clickSelector || '[' + ModulesController.tag + ']', function () {
                var $edit = $(that.edit), eParam = $edit.data('param'), param = $(this).data('param') || $(this).find('[' + ModulesController.tag + ']').data('param');
                if (eParam && (eParam.id == param.id)) return;
                that.build(param);
            })
        },
        build: function (param) {
            var that = ModulesController.editor;
            ModulesController.getModuleController(param.type, function (controller) {
                if (!controller) return;
                that.destroy(function () {
                    var $e = $(that.edit);
                    $e.data('param', param);
                    controller.editor($e, param);
                });
            });
        },
        destroy: function (fn) {
            var that = ModulesController.editor,
                $e = $(that.edit),
                param = $e.data('param');
            if (param && param.type) {
                ModulesController.getModuleController(param.type, function (controller) {
                    controller && controller.destroy && controller.destroy($e, param);
                    $e.removeData('param').html('');
                    fn && fn();
                });
            } else {
                fn && fn()
            }
        },
        get: function (ele) {
            var that = ModulesController.editor,
                $ms = $(ele).find('[' + ModulesController.tag + ']'),
                params = [];
            $.each($ms.not($ms.find($ms)), function () {
                params.push($(this).data('param'))
            });
            return params;
        },
        save: function (ele) {
            var that = ModulesController.editor, $edit = $(that.edit), param = $edit.data('param');
            ModulesController.getModuleController(param.type, function (controller) {
                if (!controller) return false;
                for (var k in param.data) {
                    if (param.data.hasOwnProperty(k)) {
                        delete param.data[k];
                    }
                }
                $.extend(param.data,controller.getEdit($(that.edit)));
                ModulesController.loader.build(ele || that.mc, param);
            });
        },
        add: function (ele, e, mId, type, data, buildAfter) {
            var that = ModulesController.editor,
                $ele = $(ele),
                $e = $(e),
                id = that.ran($ele),
                param = {id: id, mId: mId, type: type, data: data || {}};
            $e.attr(ModulesController.tag, id);
            ModulesController.loader.build(ele, param, buildAfter);
        },
        ran: function (ele) {
            var $ele = $(ele), n = -1;
            do {
                n = parseInt(Math.random() * 10000, 10)
            } while ($ele.find('[' + ModulesController.tag + '="' + n + '"]') > 0);
            return n;
        }
    }
};
