// Copyright 2014 Cniil Inc. All Rights Reserved.

/**
 * @fileoverview cookJs是一个主要用于研究目的的实验性Javascript框架，宗旨是
 *               让编写Javascript代码变得和做菜一样轻松和愉悦。
 * @author       latelx64@gmail.com (Kezhen Wong)
 * @version      0.3-dev
 * @link         https://github.com/latel/cookJs
 * @license      GPL
 */

/**
 * 主要的框架入口
 * 使用匿名立即执行函数以便将框架的内部环境同全局作用域隔绝开，
 * 同时传递全局变量至框架内部以同样避免框架内直接访问
 * 全局作用域而丧失优雅性。
 * @param global
 */
(function (global) {
    //申明以 ES5严格标准运行框架
    "use strict";

    /**
     * 一些模块内部的属性
     * @var {Object} moduleMap 已载入的模块定义
     * @var {Object} pathMap 已载入的模块文件物理路径
     * @var {Function} noop 空函数
     * @var {Object} runtime 运行时寄存器
     * @var {Object} ready 保存注册的ready方法
     */
    var moduleMap = {},
        pathMap   = {},
        noop      = function () {
            return undefined;
        },
        runtime   = {
            paths : {
                root: "http://localhost/pi/application/www/js/vendor/module/"
            },
            compat: {}
        },
        ready     = {
        };
   /**
    * autoconf stuff
    */

   /**
    * 处理依赖并返回模块的实例
    * @param {String} name 要请求的模块名称
    * @return {Mixed} 视模块的工厂而定，此返回地类型可能为任意类型
    *     但大多部分情况下，很可能是个包含多种方法的类或仅仅是个函数
    */
   function use (name) {
        var module = moduleMap[name];
        //检查模块是否已经生成过实例
        if (!module.entity){
            //运行到这里意味着模块的实例尚未生成，
            //那么先遍历检查它的每个依赖模块的实例是否已经生成是很有必要的
            var args = [];
            for (var i = 0, len = module.dependencies.length; i< len; i++){
                //检查单个所依赖的模块的实例是否已经生成过了，
                //如果没有则先 生成它后压入args
                //如果有则直接压入上面定义的args，我们最后将会把arg当作module工厂方法的参数
                if (!moduleMap[module.dependencies[i]].entity)
                    args.push(use(module.dependencies[i]));
                else
                    args.push(moduleMap[module.dependencies[i]].entity);
            }

            //最后生成该模块的实例，并将在上面生成的它所依赖的模块的实例挂载一下
            //当然我们利用一个空函数以期解决this指针的指向
            module.entity = module.factory.apply(noop, args);

            //检查是否注册了Ready方法
            ready[name] && ready[name].call(module.entity);
        }
        
        //返回模块的实例
        return module.entity;
    }

    /**
     * 对外公开的所有可供使用的框架功能接口和属性
     */
    window.cookJs = {
        /**
         * 配置cookJs
         * @mathod config
         */
        config: function (configr) {
            var i;
            runtime["paths"]["root"] = typeof configr.root === "string"? 
                this.extend.isEndWidthSlash(configr.root)? configr.root : configr.root + "/" : 
                "";
            while (i in configr.paths) {
                if (configr.paths.hasOwnProperty(i) && i != "root") {
                    runtime["paths"][i] = this.extend.isEndWidthSlash(configr.paths[i])? 
                        configr.paths[i] : 
                        configr.paths[i] + "/";
                }
            }
            while (i in configr.compat) {
                if (configr.compat.hasOwnProperty(i)) {
                    runtime["compat"][i] = configr.compat[i];
                }
            }
        },
        /**
         * 定义和注册模块信息
         * 供模块调用，使用者不应该调用此方法
         * @method define
         * @param {String} name 模块的名称
         * @param {Array}  dependencies 模块依赖哪些其他模块
         * @param {Object} method 模块的工厂方法和自运行的启动脚本、销毁脚本等
         * @return {Array} 模块注册的信息
         */
        define: function (name, dependencies, factory) {
            //是否已经载入过了，
            //如果是则直接返回该模块的信息
            //如果否则将新的模块信息压入已注册模块列表
            if (!moduleMap[name])
                moduleMap[name] = {
                    name: name,
                    dependencies: dependencies,
                    factory: factory
                };
            //为核心扩展写的丑陋的例外
            //求改进方法
            name === "core" && use("core");

            //返回注册的信息
            return moduleMap[name];
        },
        /**
         * 异步加载所需的模块
         * @method require
         * @param {Mixed} modules 模块的名称（列表）
         * @param {Function} callback 回调函数，当所有模块
         *     被载入后，此函数会被执行
         * @param {Array} register 用于注册此次请求的加载的模块列表，以避免依赖的干扰
         *     最后返回的模块实例顺序也将是这个。
         *     框架会自动设置这个值，一般不需要在外部调用时指定
         */
        require: function (modules, callback) {
            var module, i, j, k, l, m = 0, self = this, len, deps, depsLen, depsToRequire = [], entityList = [], entity,
                moduleRoot = runtime["paths"]["root"], cached = true;
            var register = arguments[2] ? arguments[2] : modules;
            var head = document.head || document.getElementsByTagName("head")[0];

            //先格式化一下给定的模块名，目标为数组
            //并清理可能的额外空白字符
            modules = this.extend.trim(this.extend.isArray(modules) ? 
                    modules :
                    typeof modules === "string" && [modules]
                || []);

            //因为模块是异步加载的，实际激活的顺序可能不同
            //所以我们要确保最后返回的顺序与请求参数modules中的顺序相同
            //这样外界调用者才能确保获取到的模块是正确对应的
            function arrangeEntity () {
                for (k = 0, len = register.length; k < len; k++) {
                    entity = use(register[k]);
                    entityList.push(entity);
                }
                return entityList;
            }

            //定义一个用来检查模块是否已经全部注册的回调函数，
            //如果检查所有的文件都被载入，则执行回调函数。
            function checkLoaded () {
                var allLoaded = true;
                for (l = 0, len = modules.length; l< len; l++) {
                    if (!pathMap[modules[l]]){
                        allLoaded = false;
                        break;
                    }
                }

                //如果这一层的模块都已载入，检测是否有下一层
                //即更多的依赖需要被载入
                if (allLoaded) {
                    //解决依赖
                    for (i = 0, len = modules.length; i < len; i++) {
                        for (j = 0, deps = moduleMap[modules[i]].dependencies, depsLen = deps.length; j < depsLen; j++) {
                            if (self.extend.inArray(deps[j], self.extend.keys(moduleMap)) < 0)
                                depsToRequire.push(deps[j]);
                        }
                    }
                    if (depsToRequire.length > 0) {
                        //还有依赖需要载入，进入下一层
                        //处理一下参数，以便让回调函数的实际调用者zhidao zuizhong要返回哪些模块SHILI
                        self.require.apply(self, [depsToRequire, callback, register]);
                    } else {
                        //最后，如果callback是函数，则执行它
                        //并且将其请求的模块实例按指定顺序返回作为其参数
                        self.extend.isFunction(callback) && callback(arrangeEntity());
                    }
                }
            };

            debugger;
            //遍历每个需要加载的模块，并异步加载
            while (module = modules[m++]){
                //检查是否是一个已经载入的模块
                //如果是我们将跳过此模块否则加载之
                if (!pathMap[module]){
                    //将已缓存的标志更为否
                    cached = false;
                    //在HEAD中插入一个script标签，以便让浏览器
                    //开始下载该模块的文件，我们会在完成工作后删除这一标签
                    var scriptNode = document.createElement("script");
                    scriptNode.id = module;
                    scriptNode.type = "text/javascript";
                    scriptNode.async = "true";
                    scriptNode.defer = "true";
                    scriptNode.src = moduleRoot+ module+ ".js";
                    scriptNode.onload = function(){
                        //如果运行到这里，以为这单个模块已经加载成功，那么：
                        //将加载状态标记为成功
                        //移除script标签
                        //调用在上面定义的检查所有模块是否都已载入的函数
                        pathMap[this.id] = true;
                        head.removeChild(this);
                        checkLoaded();
                    };
                    head.appendChild(scriptNode);
                }
            }

            //如果没有要加载的模块，即在先前的操作中已经载入和初始化过了
            //则直接执行回调函数
            cached && self.extend.isFunction(callback) && callback(arrangeEntity());
        },
        /**
         * 注册当某个模块准备就绪后执行的方法
         * 由模块自行定义或由使用者外部定义
         * @param {String} name 模块名
         * @param {Function} callback 要执行的方法
         * @see http://www.oschina.net/code/snippet_926655_34118
         */
        ready: function (name, callback) {
            if (ready[name]) {
                ready[name] = function () {
                    ready[name]();
                    callback();
                };
            } else {
                ready[name] = callback;
            }
        },
        /**
         * 最后我们公开一些属性
         */
        version: "0.2-dev",
        build: "2014/03/14 nightly"
    };
})(this);

/**
 * cookJs的核心工具库
 * 附送的一些好用的工具？
 */
cookJs.ready("core", function(){
    var host;
    cookJs.extend = this;
    host = cookJs.extend.detectHost();
    if (host !== null)
        window["is" + host[0]] = host[1].replace(/[.].*$/, "");
});

cookJs.define("core", [], function () {
    return {
        //一些有用的正则表达式
        //匹配注释
        commentRegExp : /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
        //匹配左右空白字符
        trimRegExp    : /^\s+|\s+$/g,
        //是否是window对象
        isWindow: function(obj) {
            return obj != null && obj.window == window;
        },
        //是否是一个数组
        isArray: function (obj) {
            return Object.prototype.toString.call(obj) == "[object Array]";
        },
        //是否是一个空的对象
        isEmptyObject: function (obj) {
            var name;
            for (name in obj) {
                return false;
            }
            return true;
        },
        //是否是一个数字
        isNumeric: function (obj) {
            return obj - parseFloat(obj) >= 0;
        },
        //是否是一个函数
        isFunction: function (obj) {
            return Object.prototype.toString.call(obj) == "[object Function]";
        },
        //目录是否以/结尾
        isEndWithSlash: function (path) {
            if (typeof path !== "string")
                return -1;
            return path.indexOf("/", path.length - 1) > 0;
        },
        //返回对象的索引
        keys: function (obj) {
            var keys, i;
            if (obj !== Object(obj)) {
                throw new TypeError("Invalid object");
            }
            
            keys = [];

            for (i in obj) {
                if (obj.hasOwnProperty(i))
                    keys[keys.length] = i;
            }

            return keys;
        },
        //将目标转换为数组
        makeArray: function (iterable) {
            var ret = [],
                len = iterable.length;
            //String、window和function也有length属性
            if (len == null || typeof iterable === "string" || this.isFunction(iterable) || this.isWindow(iterable))
                ret[0] = iterable;
            else
                while (len)
                    ret[--len] = iterable[len];
            return ret;
        },
        //日志
        log : function () {
            try {
                // Modern browsers
                if (typeof console != 'undefined' && typeof console.log == 'function') {
                    // Opera 11
                    if (window.opera) {
                        var i = 0;
                        while (i < arguments.length) {
                            console.log('Item ' + (i + 1) + ': ' + arguments[i]);
                            i++;
                        }
                    }
                    // All other modern browsers
                    else if ((Array.prototype.slice.call(arguments)).length == 1 && typeof Array.prototype.slice.call(arguments)[0] == 'string') {
                        console.log((Array.prototype.slice.call(arguments)).toString());
                    } else {
                        console.log.apply(console, Array.prototype.slice.call(arguments));
                    }
                }
                // IE8
                else if ((!Function.prototype.bind || treatAsIE8) && typeof console != 'undefined' && typeof console.log == 'object') {
                    Function.prototype.call.call(console.log, console, slice.call(arguments));
                }

                // IE7 and lower, and other old browsers
            } catch (ignore) { }
        },
        //清除Firefox和基于webikit的标准浏览器节点列表中的空白节点
        clearWhite: function (obj) {
            for(var i = 0; i < obj.childNodes.length; i++){
                var node = obj.childNodes[i];
                if(node.nodeType == 3 && !/\S/.test(node.nodeValue)){
                    node.parentNode.removeChild(node)
                }
            }
        },
        //在节点之后插入
        insertAfter: function (newEl, targetEl) {
            //opposite to insertbefore
            var parentEl = targetEl.parentNode;
            if (parentEl.lastChild == targetEl){
                parentEl.appendChild(newEl);
            }else {
                parentEl.insertBefore(newEl, targetEl.nextSibling);
            }            
        },
        //转义HTML标签
        htmlEncode: function (str) {
            var s = "";
            if (str.length == 0) return "";
            s = str.replace(/</g, "&lt;");
            s = s.replace(/>/g, "&gt;");
            s = s.replace(/ /g, "&nbsp;");
            s = s.replace(/\'/g, "&#39;");
            s = s.replace(/\"/g, "&quot;");
            s = s.replace(/\n/g, "<br>");
            return s;
        },
        //反转义HTML标签
        htmlDecode: function (str) {
            var s = "";
            if (str.length == 0) return "";
            s = str.replace(/&lt;/g, "<");
            s = s.replace(/&gt;/g, ">");
            s = s.replace(/&nbsp;/g, " ");
            s = s.replace(/&#39;/g, "\'");
            s = s.replace(/&quot;/g, "\"");
            s = s.replace(/<br>/g, "\n");
            return s;
        },
        //字符串两端的空白，包括数组每个条目或仅仅是一个字符串
        trim: function (ct) {
            var i, len;
            if (this.isArray(ct)) {
                for (i = 0, len = ct.length; i < len; i++) {
                    if (typeof ct[i] == "string")
                        ct[i] = ct[i].replace(this.trimRegExp, "");
                }
                return ct;
            } else 
                return ct.replace(this.trimRegExp, "");
        },
        //检测宿主
        detectHost: function () {
            //尽管不应该信任navigator.userAgent
            //但由用户篡改导致脚本不能运行的责任应由用户自行承担
            var userAgent = navigator.userAgent.toLowerCase(),
                s;
                return (s = userAgent.match(/msie ([\d.]+)/)) ? 
                           ["IE", s[1]] : 
                           (s = userAgent.match(/firefox\/([\d/]+)/)) ? 
                               ["Firefox", s[1]] : 
                               (s = userAgent.match(/chrome\/([\d.]+)/)) ? 
                                   ["Chrome", s[1]] : 
                                   (s = userAgent.match(/opera.([\d.]+)/)) ? 
                                       ["Opera", s[1]] : 
                                       (s = userAgent.match(/version\/([\d.]+).*safari/)) ? 
                                           ["Safari", s[1]] : 
                                           null;
        },
        //一些借鉴其他语言的增强功能
        /**
         * 检查数组中是否存在某个值
         * @param {Mixed} needle 待搜索的值,如果needle是字符串，则是比较大小写的
         * @param {Array} haystack 这个数组
         * @param {Integer} offset 位置偏移，从哪个位置开始搜索
         * @return {Integer} 如果找到needle，则返回其第一次出现的位置，如果没有找到则返回-1
         * @example inArray(3, [1,2,3]) > 0 && alert("Nerd is happy");
         */
        inArray: function (needle, haystack, offset) {
            var len;
            if (!this.isArray(haystack))
                return -1;
            else
                len = haystack.length;

            offset = offset ? offset < 0 ? Math.max(0, len + offset) : offset : 0;

            for (; offset < len; offset++) {
                if (haystack[offset] === needle) 
                    return offset; 
            }
            return -1;
        },
        /**
         * 用回调函数过滤数组中的单元
         * 依次将 input 数组中的每个值传递到 callback 函数。
         * 如果 callback 函数返回 TRUE，则 input 数组的当前值会被包含在返回的结果数组中。
         * @param {Array} input 要循环的数组
         * @param {Function} callback 使用的回调函数，
         *     回调函数将会接受数组中的一个值作为唯一参数，
         *     如果没有提供 callback 函数， 将删除 input 中所有等值为 FALSE 的条目。
         * @return {Array} 返回过滤后的数组
         * @example arrayFilter([1,2,3,0,4]);
         */
        arrayFilter: function (input, callback) {
            //数组是否是数组
            if (!this.isArray(input))
                return false;

            var i, len, ret = [];

            callback = this.isFunction(callback)? 
                callback : 
                function (val) {
                    if (val) 
                        return true; 
                    else 
                        return false;
                };

            for (i = 0, len = input.length; i < len; i++) {
                if (callback(input[i]))
                    ret.push(input[i]);
            }

            return ret;
        }
    };
});


/**
 * 2014/03/13    0.2-dev    现在框架可以异步载入的所需要的模块了
 *                          添加了Jsdoc风格的注释
 * 2014/03/14    0.3-dev    现在框架遵循更为标准的AMD规范，use接口现在只供内部使用
 *                          同女朋友分手，框架名由danJs更为cookJs
 * 2014/03/15    0.3-dev    修复了一个如果请求的模块已缓存，模块代码就不会被执行的问题
 * 2014/03/16    0.3-dev    添加了设置接口
 * 2014/03/22    0.3-dev    删除了启动脚本概念。改为ready方法
 */
