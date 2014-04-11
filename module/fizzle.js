/**
 * 节点选择器
 * 匹配节点并返回一个包装过的对象
 * @version 0.0.1
 * @link    https://github.com/latel/cookJs/module/fizzle.js
 * @example 参见Jquery手册，因为我们完全在模仿人家
 *          实际上，这个模块完全是用来练手的 ´ ▽ ` )ﾉ
 * @todo    遗留的陷入死循环的设计缺陷
 */

cookJs.ready("fizzle", function () {
    window.$ = this;
});

cookJs.define("fizzle", ["css", "events"], function (css, events) {
    //我们先定义一些常用的正则检测
    //1.是否是个形如"#id"的简单字符串
    var exprId = /^#(\w)+$/;
    
    //其次定义一个重要的函数
    //函数负责对单个选择器的解析并按其提取节点
    //@param {String} crumb  选择器文本，如:
    //    "div#nerd.is ul.happy li p"
    //@param {DOM Object} context 上下文限定，过滤器以此开始向下搜索
    //@return {Array} 匹配到的DOM节点组成的数组
    //function matchEl (filter, context) {
    function matchEl (crumb, context) {
        var i, j, len, len2, rets = [], ret, tagName, id, clazz, child, pattern, type, attr, val, dice, queue;
        //处理上下文并做出可能的转换，确保它是个数组
        context = cookJs.isArray(context)? context : [context];

        //去除面包屑头部的空白
        crumb = crumb.replace(/^\s+/, "");

        //优先处理tagName，这样可以尽量避免较大的结果集
        //由此可以得出，若要提高性能，请尽量在选择器中包含TAGNAME
        tagName = crumb.match(/^\w+/) !== null && crumb.match(/^\w+/)[0] || "*";
        for (i = 0, len = context.length; i < len; i++) {
            rets = rets.concat(
                    cookJs.makeArray(
                        context[i].getElementsByTagName(tagName.toUpperCase())));
        }
        if (tagName !== "*") {
            crumb = crumb.replace(new RegExp("^" + tagName, ""), "");
        }

        //遍历面包屑字符
        //id
        if (/^#/.test(crumb)) {
            id = crumb.match(/^#[^\s:]+/)[0].replace("#", "");
            crumb = crumb.replace(new RegExp("^#" + id, ""), "");
            for (j = 0, len = rets.length; j < len; j++) {
                //shortcut
                ret = rets[j];
                if (ret.id != id) {
                    rets.splice(j, 1);
                    len--;
                    --j;
                }
            }
        }
        //class
        if (/^\./.test(crumb)) {
            clazz = crumb.match(/^\.[^\s:]+/)[0].replace(".", "");
            crumb = crumb.replace(new RegExp("^\." + clazz, ""), "");
            for (j = 0, len = rets.length; j < len; j++) {
                //shortcut
                ret = rets[j];
                className = " " + ret.className + " ";
                pattern = new RegExp(clazz, "");
                if (!pattern.test(className)) {
                    rets.splice(j, 1);
                    len--;
                    --j;
                }
            }
        }
        //child([attr=?])
        if (/^\[[^\]]*\]/.test(crumb)) {
            seed = crumb.match(/^\[[^\]]*\]/)[0].replace("[", "").replace("]", "");
            crumb = crumb.replace("[" + seed + "]", "");
            attr  = seed.match(/^\w+/)[0]; seed = seed.replace(new RegExp("^" + attr, ""), "");
            expr  = seed.match(/^(!=|=)/)[0]; seed = seed.replace(new RegExp("^" + expr, ""), "");
            val   = seed;
            if (expr === "!=") {
                for (j = 0, len = rets.length; j < len; j++) {
                    //shortcut
                    ret = rets[j];
                    if (css.attr(ret, attr) == val) {
                        rets.splice(j, 1);
                        len--;
                        --j;
                    }
                }
            } else {
                for (j = 0, len = rets.length; j < len; j++) {
                    //shortcut
                    ret = rets[j];
                    if (css.attr(ret, attr) != val) {
                        rets.splice(j, 1);
                        len--;
                        --j;
                    }
                }
            }
        }
        //child(:odd,:even,:random)
        if (/^:/.test(crumb)) {
            seed  = crumb.match(/^:[\w()\d]+/)[0].replace(":", "");
            crumb = crumb.replace(new RegExp("^:" + seed.replace("(", "\\(").replace(")", "\\)"), ""), "");
            type  = seed.match(/^\w+/)[0];
            seed  = seed.replace(type, "");
            switch (type) {
                case "odd":
                    for (len = rets.length, j = rets.length - 1; j >= 0; j--) {
                        //shortcut
                        ret = rets[j];
                        if (j%2 == 1) {
                            rets.splice(j, 1);
                            len--;
                            --j;
                        }
                    }
                    break;

                case "even":
                    for (len = rets.length, j = rets.length - 1; j >= 0; j--) {
                        //shortcut
                        ret = rets[j];
                        if (j%2 == 0) {
                            rets.splice(j, 1);
                            len--;
                            --j;
                        }
                    }
                    break;

                case "random":
                    //如果小于1则视为百分比的几率选取
                    //如果大于等于1则视为随机保留的个数
                    seed = seed || 1;
                    if (seed < 1) {
                        for (j = 0, len = rets.length; j < len; j++) {
                            //shortcut
                            dice = Math.random();
                            ret = rets[j];
                            if (dice > seed) {
                                rets.splice(j, 1);
                                len--;
                                --j;
                            }
                        }
                    } else {
                        queue = [];
                        seed = rets.length - parseInt(seed);
                        while (queue.length < seed) {
                            dice = Math.round(Math.random() * (rets.length - 1));
                            queue[queue.length] = rets[dice];
                            rets.splice(dice, 1);
                        }
                    }
                    break;

                //第一个元素
                case "first":
                    rets = [rets[0]];
                    break;

                //最后一个元素
                case "last":
                    rets = [rets[rets.length - 1]];
                    break;

                //指定编号的元素
                case "eq":
                    rets = [rets[seed.match(/\d+/)[0]||0] || rets[0]];
                    break;

                //所有大于指定编号的元素
                case "gt":
                    break;

                //所有小于指定编号的元素
                case "lt":
                    break;

                //无子（元素）节点的所有元素
                case "empty":
                    break;

                //所有被隐藏的元素(拥有display:none或visibility:hidden的元素)
                case "hidden":
                    break;

                //所有可见的元素(和hidden相反)
                case "visible":
                    break;
            }
        }
        
        //是否有必要继续分析面包屑
        if (/\w+/.test(crumb))
            return matchEl(crumb, rets);
        else {
            //去除重复的元素
            return rets;
        }
    }

    function Fizzle (selector, context) {
        //申明fizzle对象中的属性
        //1. 以[0]开始的数组，存储匹配到的元素（隐藏）
        //2. 匹配到的元素的长度
        var length = 0, i, j, crumbs, nodes = [], node, selectorEl, offset = 0;

        //保证集合中至少有一个元素
        selector = selector || document;
        //保证有初始上下文，默认亦为document
        context  = context && context.nodeType === 1 ? context : document;

        //根据给定的selector类型，可能有以下几种类型
        //1. 本身是Windoow或document对象
        //2. 本身就是个DOM元素
        //3. 字符串类型
        //现在我们依次对每个情况做出处理

        //1..
        //如果是window对象就直接返回
        if (typeof selector === document || cookJs.isWindow(selector))
            return selector;

        //2..
        //DOM元素的nodeType值均为1
        if (selector.nodeType === 1) {   
            this[offset]     = selector;
            this.length = 1;
        }

        //3..
        //解析字符串
        if (typeof selector == "string") {
            //首先去除首尾的空白
            selector = cookJs.trim(selector);
            //如果选择器为类似#id的简单形式，则调用原生的方法以提升效率
            if (exprId.test(selector)) {
                var elem    = document.getElementById(selector.replace("#", ""));
                this[offset]     = elem;
                this.length = 1;
            } else {
                //运行到这里意味着选择器是个比较复杂的形式
                //@var {String} selectorEl 选择器的单个元素，如：
                //    $("div#nerd.is ul.happy li p, input.me");
                //    将会被视为
                //        div#nerd.is ul.happy li p,
                //        input.me
                //    2个选择器所匹配的元素的组合
                //@var {Array} nodes 临时存储匹配到的节点
                selectorEl  = selector.split(",");
                this.length = 0;
                for (i = 0, len = selectorEl.length; i < len; i++) {
                    j     = 0;
                    //空白的节点不应该被检测，写错了？
                    if (selectorEl[i] && !/^\s+$/.test(selectorEl[i])) {
                        nodes = matchEl(selectorEl[i], context);
                        while (node = nodes[j++]) {
                            this[offset++] = node;
                            this.length++;
                        }
                    }
                }
            }
        }

        this.offset = 0;
    };

    //像Jquery一样封装一些方法使之成为fizzle对象？
    Fizzle.prototype = {
        //对外的公开的
        //用于获取fizzle对象内部信息的闭包
        size: function () {
            return this.length;
        },
        get: function (index) {
            if (index== undefined) {
                var ret= [];
                for (var i= 0; i< length; i++) {
                    ret[i]= this[i];
                }
                return ret;
            }else {
                return this[index];
            }
        },
        //添加类名
        addClass: function (value) {
            var i = 0, node, offset = this["offset"];
            while (node = this[i++]) {
                css.addClass(node, value);
            }
        },
        //移除类名
        removeClass: function (value) {
            var i = 0, node, offset = this["offset"];
            while (node = this[i++]) {
                css.removeClass(node, value);
            }
        },
        //切换类名
        toggleClass: function (value, stateVal) {
            var i = 0, node, offset = this["offset"];
            while (node = this[i++]) {
                css.toggleClass(node, value, stateVal);
            }
        },
        //判断是否有某个/某些类名
        hasClass: function (value) {
            var i, offset = this["offset"];
            return css.hasClass(this[offset], value);
        },
        //获取或设置一个属性的值
        attr: function (name, value) {
            var i, offset = this["offset"];
            return css.attr(this[offset], name, value);
        },
        //炒菜
        cook: function (condiment) {
            var i, offset = this["offset"];
            for (i in condiment) {
                if (i in this)
                    this[i](condiment[i]);
            }
        },
        //设置样式
        css: function (style, val) {
            var node, i = 0, j, offset = this["offset"];
            //检查是简单的"display", "none"形式（只设置单个属性或获取值）
            //还是如{"position":  "absolute", "left": "1px", "top":"1px"}的复杂形式（同时设置多个）
            if (val === undefined && typeof style === "object") {
                while (node = this[i++]) {
                    for (j in style) {
                        css.style(node, j, style[j]);
                    }
                }
            } else {
                if (val === undefined)
                    return css.style(this[offset], style, val);
                else {
                    while (node = this[i++]) {
                        css.style(node, style, val);
                    }
                }
            }
        },
        //切换至禁用状态,通常是对于提交按钮
        disable: function () {
            var i = 0, node, offset = this["offset"];
            while (node = this[i++]) {
                node.disabled = true;
            }
        },
        //判断是否被禁用
        disabled: function () {
            var offset = this["offset"];
            return css.attr(this[offset], "disabled") === null? false : true;
        },
        //切换至启用状态,通常是对于提交按钮
        enable: function () {
            var i = 0, node, offset = this["offset"];
            while (node = this[i++]) {
                css.removeAttr(node, "disabled");
            }
        },
        //判断是否被启用
        enabled: function () {
            return !this.disabled();
        },
        //用于循环处理每一个元素的方法
        each: function (closure) {
            for (var i=0; i< this.length; i++){
                closure.apply(this[i]);
            }
        },
        //在节点下寻找子元素
        find: function (selector) {
            return new Fizzle(selector, this[0]);
        },
        //设置innerHTML
        html: function (text) {
            var i = 0, node, offset = this["offset"];
            //如果text被设置则设置值，否则返回值
            if (text === undefined)
                return this[offset].innerHTML;
            else
                while (node = this[i++]) {
                    node.innerHTML = text;
                }
        },
        //排除元素
        not: function () {
        },
        //注册事件
        on: function (ets, comp) {
            var node, i = offset = this["offset"], evIds = [];
            while (node = this[i++]) {
                evIds.push(events.on(node, ets, comp));
            }   
            return evIds.length > 1? evIds : evIds[0];
        },
        click: function(et) {
            return this.on({click : et});
        },
        mouseover: function(et) {
            return this.on({mouseover : et});
        },
        mousemove: function(et) {
            return this.on({mousemove : et});
        },
        mouseout: function(et) {
            return this.on({mouseout : et});
        },
        focus: function(et) {
            return this.on({focus : et});
        },
        blur: function(et) {
            return this.on({blur : et});
        },
        load: function(et) {
            return this.on({load : et});
        },
        //主动触发注册在ns命名空间下的事件
        trigger: function(ns) {
            return events.trigger(this[0], ns);
        },
        //offset相关
        offsetLeft: function (acc) {
            var offset = this["offset"], node = this[offset], x = 0;
            if (isWindow(acc)) {
                while (node !== null) {
                    x += node.offsetLeft;
                    node = node.offsetParent;
                }
                return x;
            } else
                return this[offset].offsetLeft;
        },
        offsetTop: function (acc) {
            var offset = this["offset"], node = this[offset], y = 0;
            if (cookJs.isWindow(acc)) {
                while (node !== null) {
                    y += node.offsetTop;
                    node = node.offsetParent;
                }
                return y;
            } else
                return this[offset].offsetTop;
        },
        //获取在父节点中的顺序
        parentIndex: function () {
            var node = this[0];
            if (cookJs.isWindow(node) || node === document.body)
                return -1;

            var chlds = node.parentNode.children, chld, i = -1;
            while (chld = chlds[++i]) {
                if (chld === node)
                    return i;
            }

            return -1;
        },
        //将dom节点顺序置反
        reverse: function () {
        },
        //移除一个或多个属性
        removeAttr: function (value) {
            var i = 0, node, offset = this["offset"];
            while (node = this[i++]) {
                css.removeAttr(node, value);
            }
        },
        //注销事件
        un: function (ets) {
            var offset = this["offset"];
            events.on(this[offset], ets);
        },
        //获取input元素的值
        val: function (val) {
            //如果val被设置则设置值，否则返回值
            if (val === undefined || val === null)
                return this[this.offset].value;
            else
                this[this.offset].value = val;
        },
        //最后，额外定义一些此模块的信息供外界查看
        version: "0.0.1"
    };

    /**
     * @param {String} selector
     *     用于提取节点的选择器
     * @param {Object} context
     *     节点的上下文，即节点的初始选择范围
     */
    return function (selector, context) {
        return new Fizzle(selector, context);
    };
});

/**
 * 2014/03/12   0.0.1   模块创建
 * 2014/03/31   0.0.1   修复id和class只能匹配字母的设计缺陷
 * 2014/04/08   0.0.1   添加了eq, first和last选择器的支持
 *                      添加了parentIndex()方法
 *                      添加了find()方法
 *                      修改了innerHtml()方法,并重命名为html()
 */
