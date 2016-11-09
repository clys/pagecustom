var editPage = new BaseJs({
    pool: {
        //页面容器名
        containerName: 'pageEditor',
        //模块类型数据
        moduleList: [{
            name: '例子',
            modules: [
                {
                    mId: 'text',//唯一标识
                    name: '文本',//名字
                    desc: '测试模版',//介绍
                    type: 'text',//载入模版文件类型
                    img: '/static/img/loading.gif',//图标路径
                    iconCode: '<span>TEST</span>',//自定义图标,优先于img
                    max: 22,//上限
                    maxType: 'type',//根据id|type判断上限
                    maxBulletin: 'aaa',//自定义上限时的提示
                    data: {aa: 1}//初始参数
                },
                {
                    mId: 'countdown',
                    name: '倒计时',
                    desc: '促销活动，增加营销气氛，降低买家决策成本',
                    type: 'countdown',
                    iconCode: '<span class="glyphicon glyphicon-hourglass"></span>'
                }
            ]
        }],
        //拖拽块代码，role属性为对应功能
        handleHtmlMap: {
            before: '<span title="拖拽即可排序" class="handle" role="handle">',
            after: '</span>',
            list: [
                {
                    c: '<span title="置顶" class="top glyphicon glyphicon-save" role="top" style="transform:rotate(180deg)"></span>',
                    i: 0
                },
                {c: '<span title="向上移动" class="up glyphicon glyphicon-arrow-up" role="up"></span>', i: 0},
                {c: '<span title="向下移动" class="down glyphicon glyphicon-arrow-down" role="down"></span>', i: 0},
                {c: '<span title="删除" class="del glyphicon glyphicon-trash" role="del"></span>', i: 0}
            ]
        },
        //模块载入路径
        modulesControllerLoadPath: '/static/js/pageEditor/modules/',
        //模块点击选择器
        rowClickSelector: '> [role="row"]',
        //点击拖拽块中的role时的前置函数 函数返回true时会继续执行预置功能 presetFn()为直接调用预置功能
        clickRoleBefore: {
            del: function ($e, $row, eleObj, presetFn) {
                var that = editPage,
                    $m = $row.find('[' + ModulesController.tag + ']'),
                    mParam = $m.data('param'),
                    name = that.findModuleById(mParam.mId).name;
                YTDialog.confirm(
                    '确定删除模块"' + name + '"吗？',
                    function () {
                        var ep = that.getEle('$edit').data('param');
                        if (ep && ep.id == mParam.id) {
                            that.initEditor();
                        }
                        presetFn();
                        that.ecEmptyClass();
                    },
                    function () {
                    }
                );
            },
            collecting: function ($e, $row, eleObj, presetFn) {
                var that = editPage, param = $row.find('[' + ModulesController.tag + ']').data('param');
                if (!param) {
                    alert('模块设置获取失败');
                    return;
                }
                that.collecting(param);
            }
        },
        leftNavMax: 6
    },
    /**
     * 初始化
     * @param loadPath 模块文件载入路径
     * @param moduleListData 模块列表数据
     */
    init: function (loadPath, moduleListData) {
        var that = editPage;
        loadPath && (that.pool.modulesControllerLoadPath = loadPath);
        moduleListData && ( that.pool.moduleList = moduleListData);
        that.runInits();
        that.initEditor();
    },
    inits: {
        element: function () {
            var that = editPage,
                $container = that.getEle('$container'),
                $ed = $('#editor_desc');
            that.setEle({
                '$ec': $('#edit_container'),
                'moduleTpl': utils.string.buildTpl($('#module_tpl').html()),
                'modulesTpl': utils.string.buildTpl($('#modules_tpl').html()),
                '$ep': $('#edit_panels'),
                '$mp': $('#modules_panel'),
                '$edit': $('#editor'),
                '$edm': $ed.find('.js-main'),
                '$eds': $ed.find('.js-small'),
                '$stt': $('#switch_tag_types'),
                '$ei': $('#edit_loading'),
                '$psws': $('#phone_style_width_slider'),
                '$cc': $container.find('[data-role="changeColor"]'),
                '$ccv': $container.find('[data-role="changeColorVal"]')
            });
        },
        event: function () {
            var that = editPage, $container = that.getEle('$container');
            //模块编辑框标题
            that.getEle('$ec').on('click', that.pool.rowClickSelector, function () {
                that.setEditorDescByModuleId($(this).attr('data-mid') || $(this).find('[' + ModulesController.tag + ']').attr('data-mid'))
            }).on('click', 'a', function (e) {
                e.preventDefault();
            });
            //可切换标签
            utils.$.ele.switchTag();
            //换背景色
            var $cc = that.getEle('$cc');
            $cc.bigColorpicker(function (cb, color) {
                that.getEle('$ccv').val(color);
                that.setBackColor(color);
            });
        },
        initPhoneBar: function () {
            var that = editPage,
                $container = that.getEle('$container'),
                color = '#bbbbbb', $jpb = $container.find('.js-phone-bar'), jpbt, $wifi, $time;
            jpbt = ran(5);
            $jpb.find('[role="pb-signal"]').html(new Array(jpbt + 1).join('&bull;'));
            $jpb.find('[role="pb-signal-not"]').html(new Array(5 - jpbt + 1).join('&bull;'));
            $jpb.find('[role="pb-operator"]').html('中国' + (['移动', '联通', '电信'])[ran(2)]);
            jpbt = ran(100);
            $jpb.find('[role="pb-power"]').css({'width': jpbt + '%', 'background': jpbt < 10 ? 'red' : ''});
            jpbt = ran(3);
            $wifi = $jpb.find('[role="pb-wifi"]');
            $wifi.find('.w-one').css('borderTopColor', jpbt > 2 ? '' : color);
            $wifi.find('.w-two').css('borderTopColor', jpbt > 1 ? '' : color);
            $wifi.find('.w-three').css('borderTopColor', jpbt > 0 ? '' : color);
            $time = $jpb.find('[role="pb-time"]');
            setTime();
            setInterval(setTime, 60000);
            function setTime() {
                $time.html(momentFormat('', 'HH:mm'));
            }

            function ran(n) {
                return parseInt(Math.random() * (n + 1), 10);
            }
        },
        /**
         * 初始化模块管理器
         */
        initModulesController: function () {
            var that = editPage;
            ModulesController.init(
                'edit',
                that.pool.modulesControllerLoadPath,
                that.getEle('$ec'),
                that.getEle('$edit'),
                that.pool.rowClickSelector
            );
        },
        /**
         * 初始化可拖拽模块
         */
        initModuleList: function () {
            var that = editPage, $container = that.getEle('$container'), $ec = that.getEle('$ec');
            that.buildModules(that.pool.moduleList);
            $ec.moduleList(
                {
                    draggable: '#modules_panel .icons > *',//模块选择器
                    sortable: '#edit_container',//列表选择器
                    focusOutRange: '.js-focusoutrange',
                    empty: false,//添加模块到列表时初始化为空白
                    addCallback: function (event, ui) {//添加模块后的回调
                        if (event.type == 'code.buildHandle') return;
                        var $e = $(this);
                        $e = $e.find('div[type]');
                        ModulesController.editor.add($ec, $e, $e.attr('data-mid'), $e.attr('type'), utils.json.cloneObject(ui.item.data('data')), function () {
                            that.ecEmptyClass();
                            $e.click();
                        });
                    },
                    elementTpl: function (e, event, ui) {
                        var $e = $(ui.item[0]), html;
                        html = '<div><div data-mid="' + $e.attr('data-mid') + '" type="' + $e.attr('type') + '"></div></div>';
                        return html;
                    },
                    handleHtml: that.buildHandleHtml(),
                    clickRoleBefore: that.pool.clickRoleBefore,//执行元素role属性对应功能前的回调，入参($e, $row, eleObj,presetFn)(点击的元素,点击的元素所在行,组件对象,直接调用执行预置功能)返回(true/flase||其它)(继续/阻止)功能执行 可以自定义role 预设的role有 handle:拖拽块 top:置顶 up:上移 down:下移 del:删除
                    draggableEx: {
                        scroll: false,
                        appendTo: $container,
                        containment: $container,
                        helper: function (e) {
                            var $e = $(e.currentTarget);
                            that.verifyModuleMax($e);
                            return $('<div class="modules" style="background: #ffffff"><div class="icons">' + $e.prop("outerHTML") + '</div></div>');
                        }
                    },//模块初始化时的参数(jqueryui的draggable)
                    sortableEx: {
                        appendTo: $container,
                        helper: function (a, b) {
                            var w = b.innerWidth(), h = b.innerHeight(),
                                $new = $($('<div class="phone moduleList-list helper " style="width: ' + w + 'px;height: ' + h + 'px">' + b.prop("outerHTML") + '</div>'));
                            return $new;
                        }
                    }//列表初始化时的参数(jqueryui的sortable)
                }
            );
        },
        /**
         * 手机宽度调整滑块
         */
        initPhoneWidthSlider: function () {
            var VERIFY_CD = 2000,
                ANIMATE_SPEED = 233,
                SCROLL_DISTANCE = 150,
                MOUSEMOVE_DISTANCE = 233,
                TRIGGER_HEIGHT = 15,
                HIDE_DELAYS = 5000;
            var that = editPage, $container = that.getEle('$container'), $psws = that.getEle('$psws'), $p = $container.find('.js-phone-style'), $s = $container.find('.js-sketchpad'), $pp = $psws.parent(), pw = $p.outerWidth(), sw, scw, bst = 0, bmm = 0, cmm = 0, hideer, notHide = false, displayState = null;

            /*
             滑块
             */
            $s.css('overflowY', 'scroll');
            sw = $s.get(0).scrollWidth;
            scw = $s.width() - sw;
            $s.css('overflowY', '');
            $psws.slider({
                animate: ANIMATE_SPEED,
                range: "min",
                max: sw,
                min: pw,
                value: pw,
                slide: function (e, data) {
                    delaysHide();
                    $p.css('width', data.value);
                    that.getEle('$ec').triggerHandler('resize');
                }
            });
            setInterval(adjustment, VERIFY_CD);
            $(window).off('.pwsAdj').on('resize.pwsAdj', adjustment);
            function adjustment() {
                var nsw = $s.width() - scw, npw;
                if (nsw != sw) {
                    sw = nsw;
                    npw = $p.outerWidth();
                    npw > sw && (npw = sw);
                    npw < pw && (npw = pw);
                    $p.css('width', npw);
                    $psws.slider({'max': sw, value: npw});
                }
            }


            /*
             动态隐藏
             */
            delaysHide();
            //接触时禁止隐藏
            $pp.off().hover(function () {
                notHide = true;
            }, function () {
                notHide = false;
            });
            //向下滚动隐藏,向上滚动显示,接触顶部显示,向下移动鼠标隐藏
            $s.off('.pwsa').on('scroll.pwsa', function () {
                var st = $s.scrollTop(), cst = st - bst;
                $pp.css('top', st);
                if (Math.abs(cst) > SCROLL_DISTANCE) {
                    cst > 0 ? sHide() : (delaysHide(), sShow());
                    bst = st;
                }
            }).on('mousemove.pwsa', function (e) {
                var oy = e.offsetY;
                $s.is(e.target) && oy < TRIGGER_HEIGHT && (delaysHide(), sShow());
                if (oy - cmm > 0) {
                    if (oy - bmm > MOUSEMOVE_DISTANCE) {
                        sHide();
                        bmm = oy;
                    }
                } else {
                    bmm = oy;
                }
                cmm = oy;
            });
            function sShow() {
                displayState === 'h' && $pp.finish();
                displayState = 's';
                $pp.slideDown(ANIMATE_SPEED);
            }

            function sHide() {
                displayState === 's' && $pp.finish();
                displayState = 'h';
                $pp.slideUp(ANIMATE_SPEED);
                $pp.find('.ui-slider-handle').mouseup();
            }

            function delaysHide() {
                clearTimeout(hideer);
                hideer = setTimeout(function () {
                    if (notHide) {
                        delaysHide();
                    } else {
                        sHide();
                    }
                }, HIDE_DELAYS);
            }

        }
    },
    /**
     * 初始化编辑器
     */
    initEditor: function () {
        var that = editPage;
        ModulesController.editor.destroy(function () {
            that.setEditorDesc('编辑栏', '点击模块进行编辑')
        });
    },
    /**
     * 组装模块拖拽块代码
     */
    buildHandleHtml: function () {
        var that = editPage, hhm = that.pool.handleHtmlMap, code = "";
        hhm.list.sort(function (a, b) {
            return b.i - a.i;
        });
        $.each(hhm.list, function (i, v) {
            code += v.c;
        });
        return hhm.before + code + hhm.after;
    },
    /**
     * 左边导航添加分类
     * @param code 图标代码
     * @param callback
     */
    addLeftNav: function (code, callback) {
        var that = editPage, $stt = that.getEle('$stt'), $ep = that.getEle('$ep'), existIndex = [], index = -1;
        $.each($stt.find('>[data-index]'), function () {
            existIndex.push(+$(this).attr('data-index'));
        });
        for (var i = 0; i < that.pool.leftNavMax; i++) {
            if (existIndex.indexOf(i) == -1) {
                index = i;
            }
        }
        if (index == -1) {
            console.error('左导航数量已达上限:' + that.pool.leftNavMax);
            return;
        }
        $stt.append('<span data-index="' + index + '">' + code + '</span>');
        $ep.append('<div style="display: none" data-index="' + index + '"></div>');
        callback && callback($ep.find('[data-index="' + index + '"]'), index);
    },
    /**
     * 强化标签title
     * @param e
     */
    tooltip: function (e) {
        var that = editPage, $e = $(e), $container = that.getEle('$container');
        if ($e.size() == 0) {
            $e = $container.find('title');
        }
        $e.tooltip({placement: 'auto', container: 'body'})
    },
    /**
     * 模块添加上限
     * @param e
     */
    verifyModuleMax: function (e) {
        var that = editPage,
            $ec = that.getEle('$ec'),
            $e = $(e),
            type = $e.attr('type'),
            id = $e.attr('data-mid'),
            moduleData = that.findModuleById(id),
            isMax, selector;
        if (!moduleData || !moduleData.max) return;
        selector = '[' + ModulesController.tag + ']' + (moduleData.maxType === 'type' ? '[type="' + type + '"]' : '[data-mid="' + id + '"]');
        isMax = $ec.find(selector).size() >= moduleData.max;
        $e.draggable(
            "option",
            "containment",
            isMax ? that.getEle('$ep') : that.getEle('$container')
        );
        isMax && alert(moduleData.maxBulletin || moduleData.name + '类型的模块最多添加' + moduleData.max + '个')
    },
    /**
     * 模块列表为空时添加样式
     */
    ecEmptyClass: function () {
        var that = editPage, $ec = that.getEle('$ec'), emptyClass = 'empty';
        if ($ec.find('[role="row"]').size() > 0) {
            $ec.removeClass(emptyClass)
        } else {
            $ec.addClass(emptyClass)
        }
    },
    /**
     * 初始化自动满高度
     */
    initEleFullY: function () {
        var that = editPage;
        //高度自动满屏
        $(window).on('resize', function () {
            that.eleFullY();
        });
        that.eleFullY();
    },
    /**
     * 自动满高度
     */
    eleFullY: function () {
        var that = editPage, $container = that.getEle('$container'), wh = $(window).innerHeight(), $ele;
        $.each($container.find('.full-y'), function (i, ele) {
            $ele = $(ele);
            $ele.css('height', wh - $ele.offset().top);
        });
    },
    /**
     * 清空页面
     */
    clearPage: function () {
        var that = editPage;
        that.getEle(['$ec', '$edm', '$eds']).html('');
        that.getEle('$edit').html('').removeData('param');
        that.ecEmptyClass();
    },
    /**
     * 构建模块类型列表
     * @param params
     */
    buildModules: function (params) {
        var that = editPage, $mp = that.getEle('$mp');
        $mp.html(that.getEle('modulesTpl')({params: params}));
        $.each(params, function (i, param) {
            $.each(param.modules, function (n, module) {
                if (module.data) {
                    $mp.find('[data-mid="' + module.mId + '"]').data('data', module.data);
                }
            })
        });
        that.tooltip($mp.find('[title]'));
    },
    /**
     * 保存当前编辑的模块
     */
    saveEdit: function () {
        var that = editPage, $edit = that.getEle('$edit'), param = $edit.data('param'), $ec = that.getEle('$ec');
        if (that.saveEditBefore) {
            if (that.saveEditBefore($edit, param) == true) {
                run();
            }
        } else {
            run();
        }
        function run() {
            ModulesController.editor.save($ec);
            alert('保存成功');
        }
    },
    /**
     * 根据类型设置编辑器标题
     * @param id 模版id
     */
    setEditorDescByModuleId: function (id) {
        var that = editPage,
            module = that.findModuleById(id) || {name: '', desc: ''};
        that.setEditorDesc(module.name, module.desc);
    },
    /**
     * 设置编辑器标题
     * @param m 主标题
     * @param s 描述
     */
    setEditorDesc: function (m, s) {
        var that = editPage;
        that.getEle('$edm').html(m || '');
        that.getEle('$eds').html(s ? '（' + s + '）' : '');
    },
    /**
     * 查询模块数据
     * @param id 模版id
     * @returns {*}
     */
    findModuleById: function (id) {
        var that = editPage, m = null;
        $.each(that.pool.moduleList, function (i, modules) {
            $.each(modules.modules, function (k, module) {
                if (module.mId == id) {
                    m = module;
                }
            })
        });
        return m;
    },
    /**
     * 将模块变为可拖动的
     */
    listModuleFormat: function () {
        var that = editPage, $ec = that.getEle('$ec'), $lm = $ec.find('>[' + ModulesController.tag + ']'), $om;
        $.each($lm, function (i, om) {
            $om = $(om);
            $om.attr('type', $om.data('param').type);
        });
        $ec.moduleList('buildHandle', $lm.wrap('<div></div>').parent());
    },
    /**
     * 获取页面参数
     * @returns {{}}
     */
    getPageParam: function () {
        var that = editPage, param = {};
        param.backColor = that.getEle('$ccv').val();
        param.list = ModulesController.editor.get(that.getEle('$ec'));
        return param;
    },
    /**
     * 设置页面参数
     * @param param
     */
    setPageParam: function (param) {
        var that = editPage, $ei = that.getEle('$ei');

        if (param.backColor) {
            that.setBackColor(param.backColor);
            that.getEle('$ccv').val(param.backColor || '#FFFFFF');
        }

        that.getEle('$ec').html('');
        if (utils.list.isEmpty(param.list)) {
            return;
        }
        $ei.show();
        ModulesController.loader.build(
            that.getEle('$ec'),
            param.list,
            function () {
                that.listModuleFormat();
                that.ecEmptyClass();
                $ei.hide();
            });
    },
    /**
     * 设置背景颜色
     */
    setBackColor: function (c) {
        var that = editPage;
        that.getEle('$ec').css('backgroundColor', c);
        $(that.getEle('$cc').find('object').get(0).getSVGDocument()).find('path').css('fill', c);
    },

    /**
     * 带有提示的input输入上限
     * @param e input
     * @param l 上限
     */
    inputMax: function (e, l) {
        var $e = $(e),
            w = $e.outerWidth(),
            $total;
        if ($e.parent().hasClass('has-feedback')) {
            var $p = $e.attr('maxlength', l).parent();
            $p.find('[role="max"]').html(l);
            $p.find('[role="total"]').html($e.val().length);
            return;
        }
        $e.attr('maxlength', l).css('width', '100%').wrap('<div class="form-group has-feedback" style="width: ' + w + 'px"></div>');
        $total = $e.parent()
            .append('<span class="form-control-feedback" style="width:auto;right: 5px;font-size: 12px;color: #ccc"><span role="total">' + $e.val().length + '</span>/<span role="max">' + l + '</span></span>')
            .find('[role="total"]');
        $e.on('keyup keypress change', function () {
            $total.html($e.val().length);
        })
    }
});

$(function(){
    // moment.locale('zh-cn');
    window.System = {};
    System.baseUrl = "../../";
    editPage.init(System.baseUrl+'static/modules/');
    editPage.initEleFullY();
});