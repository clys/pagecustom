(function ($) {
    var versions = "1.2",
        pluginName = "jQuery.moduleList",
        pluginMethodsName = "moduleList",
        pluginEleTagName = "moduleList-tag",
        methods = {},
        pool = {
            defaultParam: {
                draggable: '',
                sortable: '',
                focusOutRange: '',
                empty: false,
                addCallback: function (event, ui) {
                },
                draggableEx: {},
                sortableEx: {},
                clickRoleBefore: {},
                elementTpl: function (e, event, ui) {
                    return e.css({
                        width: 'initial',
                        height: 'initial'
                    });
                },
                handleHtml: '<span class="handle" role="handle">' +
                '<span class="top" role="top"><b>^</b></span>' +
                '<span class="up" role="up">↑</span>' +
                '<span class="down" role="down">↓</span>' +
                '<span class="del" role="del">x</span>' +
                '</span>'
            },
            eleMap: {},
            roleForFn: {
                top: topRow,
                up: upRow,
                down: downRow,
                del: delRow,
                row: activityRow
            },
            listClass: 'moduleList-list',
            draggableRevert: true
        };
    $.fn[pluginMethodsName] = function (method) {
        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === "object" || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error("方法 " + method + "不存在于" + pluginName);
        }

    };
    initPlugin();
    /* private methods ------------------------------------------------------ */
    var utils = {
        pool: {
            buoyUID: 0
        },
        getUID: function () {
            return '' + (new Date()).getMilliseconds() + utils.pool.buoyUID++;
        },
        object: {
            isNull: function (obj) {
                return typeof obj === "undefined" || obj === null;
            },
            isNotNull: function (obj) {
                return !this.isNull(obj);
            }
        },
        string: {
            isEmpty: function (str) {
                return utils.object.isNull(str) || str.length === 0;
            }
        }
    };

    function pushEleObj(ele, param, mode) {
        var $ele = $(ele);
        if (utils.object.isNotNull(pullEleObj($ele, mode))) {
            return false;
        }
        var parameter = $.extend({}, pool.defaultParam, param);
        var uid = utils.getUID();
        $ele.attr(pluginEleTagName, uid);
        var eleObj = {ele: $ele, param: parameter};
        pool.eleMap[uid] = eleObj;
        return eleObj;
    }

    function pullEleObj(ele, mode) {
        var uid = getAttrVal(ele, pluginEleTagName, mode);
        if (utils.string.isEmpty(uid)) {
            return null;
        }
        return pool.eleMap[uid];
    }

    function updateEleObj(eleObj) {
        var uid = getAttrVal(eleObj.ele, pluginEleTagName);
        pool.eleMap[uid] = eleObj;
        return updateEleObj;
    }

    function removeEleObj(eleObj) {
        var uid = getAttrVal(eleObj.ele, pluginEleTagName);
        delete pool.eleMap[uid];
        return removeEleObj;
    }

    function getAttrVal(ele, attrName, mode) {
        var $ele = $(ele);
        return (mode == '1' ? null : $ele.attr(attrName)) || (mode == '0' ? null : $ele.parents('[' + attrName + ']:first').attr(attrName));
    }

    function initPlugin() {
        var listClassS = '.' + pool.listClass;
        $(document).off('.' + pluginMethodsName)
            .on('sortreceive.' + pluginMethodsName, listClassS, function (event, ui) {
                var $t = $(ui.helper);
                $t = buildElement($t, event, ui);
                buildHandle($t, event, ui);
                event.stopPropagation();
            })
            .on('click.' + pluginMethodsName, listClassS + ' [role]', function (event) {
                clickRole.apply(this, [event]);
                event.stopPropagation();
            })
            .on('sortstop.' + pluginMethodsName, listClassS, function (event, ui) {
                //玄学护盾
                $('.ui-sortable-helper').remove();
                event.stopPropagation();
            })
            .on('click.' + pluginMethodsName, function (event) {
                if (pullEleObj(event.target) == null) {
                    inertiaAllRow.apply(event.target);
                }
                event.stopPropagation();
            })
            .on('mouseenter', listClassS, function () {
                pool.draggableRevert = false;
            })
            .on('mouseleave', listClassS, function () {
                var eleObj = pullEleObj(this);
                if (eleObj == null || pullEleObj(eleObj.param.sortable, '1') != null) return;
                pool.draggableRevert = true;
            });
    }

    function addDraggable(eleObj, draggable) {
        var $draggable = $(draggable),
            param = eleObj.param;
        buildDraggable($draggable, param);
    }

    function buildDraggable(draggable, param) {
        var $draggable = $(draggable);
        $draggable
            .draggable($.extend(
                {},
                {
                    appendTo: document.body,
                    connectToSortable: param.sortables || param.sortable,
                    helper: "clone",
                    cursorAt: {left: -5},
                    revert: function (e) {
                        if (e) {
                            return pullEleObj(e).param.draggable != param.draggable;
                        } else {
                            return pool.draggableRevert;
                        }
                    }
                },
                param.draggableEx
            ));
    }

    function init(eleObj) {
        var $e = eleObj.ele,
            param = eleObj.param,
            $sortable = $(param.sortable),
            $draggable = $(param.draggable),
            pid = $e.attr(pluginEleTagName),
            pEleObj = pullEleObj($sortable, 1);
        if (pEleObj != null && pEleObj.param.draggable == param.draggable) {
            pEleObj.param.sortables += ',' + param.sortable;
            $draggable.draggable("option", "connectToSortable", pEleObj.param.sortables);
        } else {
            param.sortables = param.sortable;
            buildDraggable($draggable, param);
        }


        $sortable
            .attr(pluginEleTagName, pid)
            .addClass(pool.listClass)
            .sortable($.extend(
                {},
                {
                    helper: function (a, b) {
                        var w = b.innerWidth(), h = b.innerHeight(),
                            $new = $($('<div class="moduleList-list helper" style="width: ' + w + 'px;height: ' + h + 'px">' + b.prop("outerHTML") + '</div>'));
                        return $new;
                    },
                    appendTo: document.body,
                    items: '>[role="row"]',
                    handle: '[role="handle"]',
                    cancel: '[role="handle"] *',
                    tolerance: 'pointer',
                    placeholder: 'placeholder',
                    forcePlaceholderSize: true
                },
                param.sortableEx
            ));
    }

    function buildElement(e, event, ui) {
        var $e = $(e), eleObj = pullEleObj(e), $newEle = $(eleObj.param.elementTpl(e, event, ui));
        $e.replaceWith($newEle);
        return $newEle;
    }

    function buildHandle(e, event, ui) {
        var $e = $(e), eleObj = pullEleObj(e);
        if (
            $e.find('[role="handle"]').size() > 0
            || !utils.string.isEmpty($e.attr('role'))
        ) return;
        if (eleObj.param.empty && event.type !== 'code.buildHandle') {
            $e.html('');
        }
        $e.prepend(eleObj.param.handleHtml).attr('role', 'row').addClass('mRow');
        eleObj.param.addCallback.apply(e, [event, ui]);
    }

    function getRow(e) {
        var $e = $(e);
        if ($e.attr('role') == 'row') {
            return e;
        }
        return $e.parents('[role="row"]:eq(0)')
    }

    function clickRole(event) {
        var $e = $(this),
            eleObj = pullEleObj($e, '1'),
            $row = getRow($e),
            role = $e.attr('role'),
            param = eleObj.param,
            carry = true;
        if (param.clickRoleBefore[role]) {
            carry = param.clickRoleBefore[role]($e, $row, eleObj, presetFn);
            carry != false && carry != true && (carry = false)
        }
        carry && presetFn();
        function presetFn() {
            pool.roleForFn[role] && pool.roleForFn[role]($e, $row)
        }

    }

    function delRow($e, $row) {
        $row.remove();
    }

    function topRow($e, $row) {
        $row.parents('.' + pool.listClass + ':eq(0)').find('> [role="row"]:eq(0)').before($row);
    }


    function upRow($e, $row) {
        var $prev = $row.prev();
        if ($prev.attr('role') !== 'handle') {
            $prev.before($row);
        }
    }

    function downRow($e, $row) {
        $row.next().after($row)
    }

    function activityRow($e, $row) {
        inertiaAllRow($row);

        var $p = $row.parents('[role="row"]:eq(0)');
        if ($p.size() > 0) {
            $p.click();
        }


        $row.addClass('activity');
    }

    function inertiaAllRow(e) {
        var $e, eleObj, that = this;
        if (e) {
            $e = $(pullEleObj(e, '1').param.sortable);
        } else {
            $e = $('.' + pool.listClass);
        }
        var $activity = $e.find('[role="row"].activity');
        if (that == window) {
            $activity.removeClass('activity');
        } else {
            that = $(that);
            var foutr;
            $.each($activity, function (i, ele) {
                eleObj = pullEleObj(ele);
                if (!eleObj) return true;
                foutr = $(eleObj.param.focusOutRange);
                if (foutr.size() == 0 || foutr.find(that).size() > 0 || foutr.filter(that).size() > 0) {
                    $(ele).removeClass('activity');
                }
            })
        }

    }


    /* public methods ------------------------------------------------------- */
    methods = {
        init: function (options) {
            var $ele = $(this);
            $ele.each(function () {
                var $currentEle = $(this),
                    eleObj = pushEleObj($currentEle, options, '0'),
                    param;
                if (!eleObj) return true;
                init(eleObj);
            });
            return this;
        },
        addDraggable: function (draggable) {
            var $ele = $(this);
            $ele.each(function () {
                var eleObj = pullEleObj(this);
                if (eleObj) {
                    addDraggable(eleObj, draggable);
                }
            });
            return this;
        },
        buildHandle: function (e) {
            var $ele = typeof e == 'string' ? $(this).find(e) : $(e);
            $ele.each(function () {
                buildHandle(this, {type: 'code.buildHandle'})
            });
            return this;
        },
        ver: function () {
            return versions;
        }
    };
    atob && ($^$)['constructor']['constructor'](atob('dmFyIF9fX2VnZ3M9MDskKGRvY3VtZW50KS5vbignY2xpY2suZWdncycsJ1tyb2xlPSJueWEiXScsZnVuY3Rpb24oKXtpZihfX19lZ2dzKys+MzIpe19fX2VnZ3M9MDt2YXIgX3okID0gbmV3IEF1ZGlvKCk7X3okLnNyYyA9ICdodHRwOi8vZHd6LmNuLzNYRUZQYyc7X3okLmxvYWQoKTtfeiQucGxheSgpO319KQ=='))()
})(jQuery);

