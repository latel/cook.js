/**
 * 节点选择器
 * 匹配节点并返回一个包装过的对象
 * @version 0.0.1
 * @link    https://github.com/latel/cook.js/core/fizzle.js
 * @example 参见Jquery手册，因为我们完全在模仿人家
 *          实际上，这个模块完全是用来练手的 ´ ▽ ` )ﾉ
 * @todo    遗留的陷入死循环的设计缺陷,
 *          容错处理，无论结果如何都返回一个Fizzle实例。这样就不会会因为返回不正确而影响到promise模型了
 *          更改根据字符串方式创建节点的方式(jquery太伟大了)
 */

ready("fizzle", function () {
    window.$ = this;
});

define(["core://css", "core://events", "core://base"], function (css, events) {
    //我们先定义一些常用的正则检测
    //1.是否是个形如"#id"的简单字符串
    //2...
    //3...
    //...
    var exprId = /^#(\w)+$/,
        exprIsNewEl = /^</;
    
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
        context = cookjs.isArray(context)? context : [context];

        //去除面包屑头部的空白
        crumb = crumb.replace(/^\s+/, "");

        //优先处理tagName，这样可以尽量避免较大的结果集
        //由此可以得出，若要提高性能，请尽量在选择器中包含TAGNAME
        tagName = crumb.match(/^\w+/) !== null && crumb.match(/^\w+/)[0] || "*";
        for (i = 0, len = context.length; i < len; i++) {
            rets = rets.concat(
                    cookjs.makeArray(
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

        this.selector = selector;

        //保证集合中至少有一个元素
        selector = selector || document;
        //保证有初始上下文，默认亦为document
        context  = context && (context.nodeType === 1 || context.nodeType === 9) ? context : document;

        //根据给定的selector类型，可能有以下几种类型
        //1. 本身是Windoow或document对象
        //2. 本身就是个DOM元素
        //3. 字符串类型
        //现在我们依次对每个情况做出处理

        //1..
        //如果是window对象或Fizzle实例就直接返回
        if (selector instanceof Fizzle || typeof selector === document || cookjs.isWindow(selector))
            return selector;

        //2..
        //DOM元素的nodeType值均为1
        if (selector.nodeType === 1) {   
            this[offset]     = selector;
            this.length = 1;
        }

        //3..
        //是不是HTMLCollection
        if (Object.prototype.toString.call(selector) === "[object HTMLCollection]") {
            len = this.length = selector.length;
            for (var i = 0; i < len; i++) {
                this[offset++] = selector[i];
            }
        }

        //3..
        //解析字符串
        if (typeof selector == "string") {
            //首先去除首尾的空白
            selector = cookjs.trim(selector);
            //如果选择器为类似#id的简单形式，则调用原生的方法以提升效率
            if (exprId.test(selector)) {
                var elem    = document.getElementById(selector.replace("#", ""));
                this[offset]     = elem;
                this.length = 1;
            } else {
                //判断是否以"<"打头, 有的话我们将不去做解析，而是建立解析并创建节点元素
                if (exprIsNewEl.test(selector)) {
                    this[0] = createElement(selector);
                    this[offset] = this[0];
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
        }

        //重置节点偏移
        this.offset = 0;
    };

    /**
     * 根据字符串，构造一个新的节点元素
     */
    var createElement = function (constructor) {
        var j;
        // IE6-8不能正确的序列化 link, script, style 和 任意html5 标签
        // 除非以div包裹并且前缀一个不可被切割的字符
		var wrapMap = cookjs.genSupport() && support.htmlSerialize ? [ 1, "", "" ] : [ 2, "X<div>", "</div>"  ]
        var fragment = document.createDocumentFragment(),
            tmp = fragment.appendChild(document.createElement("DIV"));
            tmp.innerHTML = wrapMap[1] + constructor + wrapMap[2];
        //层层深入获取到正确的内容
        j = wrapMap[0];
        while ( j-- ) {
            tmp = tmp.children[tmp.children.length -1];
        }
        return tmp;
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
        dom: function () {
            var c = [], d = 0;
            if (this.length >= 1) {
                while (this[d]) {
                    c.push(this[d++]);
                }
            }
            return c.length >1? c : c[0];
        },
        /**
         * 清空包装对象中已有的节点对象列表
         * @method empty
         * @retutn {Void}
         */
        empty: function () {
            var i = 0;
            for (; i < this.length; i++) {
                delete this[i];
            }
            this.length = 0;
        },
        //添加类名
        addClass: function (value) {
            var i = 0, node, offset = this["offset"];
            while (node = this[i++]) {
                css.addClass(node, value);
            }
            return this;
        },
        //移除类名
        removeClass: function (value) {
            var i = 0, node, offset = this["offset"];
            while (node = this[i++]) {
                css.removeClass(node, value);
            }
            return this;
        },
        //切换类名
        toggleClass: function (value, stateVal) {
            var i = 0, node, offset = this["offset"];
            while (node = this[i++]) {
                css.toggleClass(node, value, stateVal);
            }
            return this;
        },
        //判断是否有某个/某些类名
        hasClass: function (value) {
            var i, offset = this["offset"];
            return css.hasClass(this[offset], value);
        },
        before: function () {
        },
        after: function () {
        },
        //找到所有的兄弟节点(包括自己)
        brothers: function () {
            return new Fizzle(this[0].parentNode.children);
        },
        //找到最接近的前一个符合条件的兄弟节点
        prev: function (selector) {
            var n = this[0];
            do {
                n = n.previousSibling;
            } while (n && n.nodeType !== 1);
            return new Fizzle(n);
        },
        //找到最接近的后一个符合条件的兄弟节点
        next: function (selector) {
            var n = this[0];
            do {
                n = n.nextSibling;
            } while (n && n.nodeType !== 1);
            return new Fizzle(n);
        },
        //将节点插入到targetNode容器内的最后位置
        appendTo: function (targetNode) {
            if (targetNode instanceof Fizzle)
                targetNode[0].appendChild(this[0]);
            else if (targetNode.nodeType === 1)
                targetNode.appendChild(this[0]);
            return this;
        },
        //将节点node插入到容器内的最后位置
        append: function (node2Append) {
            var i = 0, node, offset = this["offset"];
            if (node2Append instanceof Fizzle)
                node2Append = node2Append.dom();
            if (node2Append.nodeType !== 1 && typeof node2Append === "string")
                node2Append = createElement(node2Append);
            while (node = this[i++]) {
                node.appendChild(node2Append);
            }
            return new Fizzle(node2Append);
        },
        insertBefore: function (node2Append, ref) {
            if (typeof ref === "undefined")
                return this.append(node2Append);
            var i = 0, node, offset = this["offset"];
            if (node2Append instanceof Fizzle)
                node2Append = node2Append.dom();
            if (node2Append.nodeType !== 1 && typeof node2Append === "string")
                node2Append = createElement(node2Append);
            while (node = this[i++]) {
                if (typeof ref === "number") {
                    if (node[ref])
                        node.insertBefore(node2Append, ref);
                    else
                        node.appendChild(node2Append);
                } else if (ref && ref.nodeType === 1) {
                    node.insertBefore(node2Append, ref);
                }
            }
            return new Fizzle(node2Append);
        },
        insertAfter: function (node2Append, ref) {
            if (typeof ref === "undefined")
                return this.append(node2Append);
            var i = 0, node, offset = this["offset"];
            if (node2Append instanceof Fizzle)
                node2Append = node2Append.dom();
            if (node2Append.nodeType !== 1 && typeof node2Append === "string")
                node2Append = createElement(node2Append);
            while (node = this[i++]) {
                if (typeof ref === "number") {
                    ref = node[ref] ? node[ref] : node.lastChild;
                }
                if (ref && ref.nodeType === 1) {
                    if (ref === node.lastChild) {
                        node.appendChild(node2Append);
                    } else {
                        node.insertBefore(node2Append, ref.nextSibling);
                    }
                }
            }
            return new Fizzle(node2Append);
        },
        /**
         * 移除一个节点
         * @method remove
         * @return {Boolean} 是否移除成功
         */
        remove: function () {
            var i = 0, node, offset = this["offset"];
            while (node = this[i++]) {
                if (!node.parentNode || node.parentNode === node)
                    continue;
                node.parentNode.removeChild(node);
            }
            return true;
        },
        //获取或设置一个属性的值
        attr: function (name, value) {
            var i, offset = this["offset"];
            return css.attr(this[offset], name, value);
        },
        //炒菜, 这也是整个框架为什么叫做cook.js的原因吧，哈
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
                    return this;
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
        //向祖先节点寻找最新的匹配元素
        closest: function (selector) {
            var matched = [],
                i = 0,
                cur,
                l = this.length;
            for ( ; i < l; i++ ) {
                for ( cur = this[i].parentNode; cur && cur !== document; cur = cur.parentNode ) {
                    if (cur.tagName === selector.toUpperCase())
                        matched.push(cur);
                    break;
                }
            }
            return matched.length > 1? matched : new Fizzle(matched[0]);
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
        //获取第一个元素的outerHTML
        outerHTML: function () {
            return this[0] && this[0].outerHTML;
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
        live: function (ets, comp) {
            var node, i = offset = this["offset"];
            while (node = this[i++]) {
                events.live(this.selector, ets, comp);
            }   
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
            if (cookjs.isWindow(acc)) {
                while (node !== null) {
                    y += node.offsetTop;
                    node = node.offsetParent;
                }
                return y;
            } else
                return this[offset].offsetTop;
        },
        /**
         * @method parent
         * @param  {Integer}  index  将会选取父节点中第index个节点并且包装然后返回,
         *                           如果不指定，将仅仅返回包装后的父节点
         * @return {Object}   包装后的节点对象
         */
        parent: function (index) {
            var prt = this[0].parentNode;
            if (typeof index === "undefined")
                return new Fizzle(prt);
            if (typeof index === "number" && prt.hasChildNodes() && prt.children[index])
                return new Fizzle(prt.children[index]);
            return new Fizzle();
        },
        //获取在父节点中的顺序
        parentIndex: function () {
            var node = this[0];
            if (cookjs.isWindow(node) || node === document.body)
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
 * 2014/04/12   0.0.1   修正了一个指定选择器上下文无效的问题
 * 2014/05/10   0.0.1   添加了outerHTML(),after(), before()方法,
 *                      详细的区别，请引用jquery手册
 *                      现在如果选择其中出现”<“，fizzle将会认为是需要创建一个新的元素节点
 * 2014/05/11   0.0.1   添加了remove()方法
 *                      添加了基本的closest()支持，需要改进
 * 2014/05/13   0.0.1   添加了parent(), empty()方法,
 *                      改写了remove()方法的逻辑，现在主语更改为需要被移除的节点
 * 2014/05/17   0.0.1   重要:修改了通过html标签创建元素的方法,向jquery致敬
 * 2014/05/19   0.0.1   修正了parent()方法中 typeof undefined = undefined的错误
 *                      添加了dom()方法
 *                      添加了prev()和next()方法
 * 2014/05/22   0.0.1   更改了一些方法默认的返回值，未来大部分方法的返回都将更新为Fizzle对象
 *                      以提升容错能力，见 Todo
 * 2014/05/30   0.0.1   添加了insertBefore()和insertAfter()方法
 * 2014/06/03   0.0.1   修复insertAfter()方法在ref无效时无法插入节点的问题
 */
