/** vim: et:ts=4:sw=4:sts=4
 * @fileoverview cook.js是一个在学习requireJs期间诞生的一个主要
 *               用于研究目的模块和文件加载器的精简实现， 然而
 *               它同样可以完美的胜任绝大部分工作。
 * @author       latelx64@gmail.com (Kezhen Wong)
 * @version      0.2
 * @link         https://github.com/latel/cook.js
 * @license      GPL
 * @todo         完善使用文档,单元测试和容错
 *               完善兼容不标准的模块，如jquery
 *               支持插件 （语法 模块名!，如core://domReady!，插件区别于核心模块库）
 */

//外部缩写接口，以期兼容requireJs
var cookjs, define, ready, require;
/**
 * 加载器入口
 * 使用匿名立即执行函数以便将加载器的内部环境同全局作用域隔绝开，
 * 同时传递全局变量至加载器内部以同样避免加载器内直接访问全局作用域而丧失优雅性。
 * @param  {Object} global
 * @return {Object} 加载器接口
 */
cookjs = (function (global) {
    //申明以 ES5严格标准运行
    "use strict";

    /**
     * 维护模块内部的环境
     * @var {String}  baseUrl   引用用户模块文件的相对URL路径
     * @var {String}  repoUrl   加载器自带的模块目录地址
     * @var {Object}  moduleMap 已载入的模块定义表
     * @var {Object}  cfg       寄存运行时的配置
     */
    var moduleDefQueue = [];
    var baseUrl, repoUrl,
        moduleMap = {},
        cfg = {paths: {}, oldies: {}, ready: {}},
        headNode = document.head || document.getElementsByTagName("head")[0],
        _define, _require;
    var trimRegExp  = /^\s+|\s+$/g,
        isRepo      = /^(core|extra|community):\/\//i,
        realJs      = /^http(s?):\/\/|\.js$/ig,
        endWithSlash   = /\/$/;

    /**
     * 一些必要的自动化处理
     * 综合判定加载器自身模块的地址和用户空间模块的引用地址，不过后面的config接口可能会更改此值
     */
    var cookJsNode = document.scripts[document.scripts.length - 1],
        dataMain   = cookJsNode.getAttribute("data-main"),
        repoUrl    = cookJsNode.getAttribute("data-repoUrl"),
        baseUrl    = cookJsNode.getAttribute("data-baseUrl"),
        autoLoad   = cookJsNode.getAttribute("data-autoLoad"),
        main;

    //如果define已经被另一个符合AMD标准的加载器使用
    //不要去覆盖它
    if (typeof define === "function" || typeof require === "function") {
        _define = define;
        _require = require;
    }

    repoUrl = repoUrl? 
        (endWithSlash.test(repoUrl)?
            repoUrl : 
            repoUrl + "/"
        ) : 
        ((cookJsNode.src.indexOf("/") > 0)?
            cookJsNode.src.substring(0, cookJsNode.src.lastIndexOf("/") + 1) : 
            "./"
        );
    baseUrl = baseUrl?
        (endWithSlash.test(baseUrl)?
            baseUrl : 
            baseUrl + "/"
        ) : 
        ((dataMain = dataMain.replace(endWithSlash, ""))? 
            ((dataMain.indexOf("/") > 0)? 
                (main = dataMain.substring(dataMain.lastIndexOf("/") + 1) , dataMain.substring(0, dataMain.lastIndexOf("/") + 1)) : 
                (main = dataMain , "./")
            ) : 
            "/"
        );
    if (dataMain || autoLoad) {
        getJs(main, parseJsPath(main));
    }

    /**
     * 判断一个对象是否是数组
     * @param  {Object}  obj
     * @return {boolean}
     */
    function isArray (obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
    }

    /**
     * 判断一个对象是否是函数
     * @param  {Object}  obj
     * @return {boolean}
     */
    function isFunction (obj) {
        return Object.prototype.toString.call(obj) === "[object Function]";
    }

    /**
     * 取得一个模块的实际js地址
     * @param  {String} module 用户提供的字串
     * @return {String} 对浏览器有效的实际地址
     */
    function parseJsPath (module) {
        return realJs.test(module)? 
            module :
            isRepo.test(module)? 
                repoUrl + module.match(isRepo)[0].replace(":/", "")+ module.replace(isRepo, "") + ".js" : 
                baseUrl + module + ".js";
    }
    /**
     * 注册一个模块定义到moduleMap
     * @return {Void}
     */
    function addModuleDef () {
        var moduleDef, moduleId;
        if (moduleDef = moduleDefQueue.shift()) {
            moduleId = this.getAttribute("data-module"),
            moduleMap[moduleId] = {
                name: moduleId,
                deps: moduleDef[1],
                factory: moduleDef[2]
            };
        }
    }
    /**
     * 异步加载一个js文件
     * @param  {String}   url js文件的绝对地址
     * @param  {Function} 回调函数
     * @return {Void}
     */
    function getJs (module, url, callback) {
        var scriptNode = document.createElement("script");
        scriptNode.type = "text/javascript";
        scriptNode.async = "true";
        scriptNode.defer = "true";
        scriptNode.setAttribute("data-module", module);
        if ("onload" in scriptNode) {
            scriptNode.onload = function(){
                var moduleId, moduleDef;
                headNode.removeChild(this);
                addModuleDef.call(this);
                isFunction(callback) && callback();
            };
        } else {
            scriptNode.onreadystatechange = function () {
                if (/loaded|complete/.test(this.readyState)) {
                    this.onreadystatechange = null;
                    headNode.removeChild(this);
                    addModuleDef.call(this);
                    isFunction(callback) && callback();
                }
            };
        }
        /**
         * 我们先定义事件函数，因为IE有可能在给src赋值后便立即开始加载相应
         * 的脚本文件，而不管我们是否已经将其插入到Dom中
         */
        scriptNode.src = url;
        headNode.appendChild(scriptNode);
    }
    /**
     * 处理依赖并返回模块的实例
     * @param  {String} name 要请求的模块名称
     * @return {Mixed}  视模块的工厂而定，通常是个完成该模块的主要功能的回调函数
     */
   function use (name) {
        var module = moduleMap[name],
            args   = [];
        //检查模块是否已经生成过实例
        if (module && !module.entity){
            //运行到这里意味着模块的实例尚未生成，
            //那么先遍历检查它的每个依赖模块的实例是否已经生成是很有必要的
            for (var i = 0, len = module.deps.length; i< len; i++){
                //检查单个所依赖的模块的实例是否已经生成过了，
                //如果没有则先递归生成它及它的依赖后压入args
                //如果有则直接压入上面定义的args，我们最后将会把arg当作module工厂方法的参数
                if (!moduleMap[module.deps[i]].entity)
                    args.push(use(module.deps[i]));
                else
                    args.push(moduleMap[module.deps[i]].entity);
            }

            //最后生成该模块的实例，并将在上面生成的它所依赖的模块的实例挂载一下
            //当然我们利用一个空函数以期解决this指针的指向
            module.entity = module.factory.apply(module.factory, args);

            //检查是否注册了Ready方法
            cfg.ready[name] && cfg.ready[name].call(module.entity);
        }
        
        //返回模块的实例
        return module.entity;
    }

    /**
     * 返回给外部的API
     * config/define/require/ready/extend/version/build
     */
    var cookJsApi =  {
        /**
         * 配置cook.js
         * @method config
         */
        config: function (module, configr) {
            var i;
            if (typeof module === "object") {
                //加载器设置接口
                configr = module;
                if (typeof configr.baseUrl === "string")
                    baseUrl = (configr.baseUrl.indexOf("/", configr.baseUrl.length - 1) > 0) ? configr.baseUrl.substr(0, -2) : configr.baseUrl;
                if (typeof configr.repoUrl === "string")
                    repoUrl = (configr.repoUrl.indexOf("/", configr.repoUrl.length - 1) > 0) ? configr.repoUrl.substr(0,-2) : configr.repoUrl;
                for (i in configr.paths) {
                    if (configr.paths.hasOwnProperty(i) && i !== "baseUrl") {
                        cfg["paths"][i] = (configr.paths[i].indexOf("/", configr.paths[i].length - 1) > 0) ? 
                            configr.paths[i] : 
                            configr.paths[i] + "/";
                    }
                }
                for (i in configr.oldies) {
                    if (configr.oldies.hasOwnProperty(i)) {
                        cfg["oldies"][i] = configr.oldies[i];
                    }
                }
            } else {
                //模块设置接口
            }
        },
        /**
         * 定义和注册模块信息
         * 供模块调用，使用者不应该调用此方法
         * @method define
         * @param  {String} name     模块的名称
         * @param  {Array}  deps     模块依赖哪些其他模块
         * @param  {Object} factory  模块的工厂方法和自运行的启动脚本、销毁脚本等
         * @return {Void}
         */
        define: function (name, deps, factory) {
            //允许匿名模块
            if (typeof name !== "string") {
                //适当的调整参数顺序
                factory = deps;
                deps = name;
                name = null;
            }
            //模块也许没有依赖
            if (!isArray(deps)) {
                factory = deps;
                deps = [];
            }
            moduleDefQueue.push([name, deps, factory]);
        },
        /**
         * 定义自己的依赖，然后将依赖作为自己的参数完成模块自身的功能
         * @method define/require
         * @param {String}   name     新模块的名称
         * @param {Mixed}    modules  模块的依赖（列表）
         * @param {Function} factory  模块工厂，当所有模块被载入后，此工厂方法会被执行，完成该模块的主要工作
         * @param {Array}    register 用于注册此次请求的加载的模块列表，以避免依赖模块的干扰
         *                            最后返回的模块实例顺序也将是这个。加载器会自动设置这个值，无需在外部调用时指定
         */
        require: function (deps, factory) {
            var module, i, j, k, l, m = 0, self = this, len, entityList = [], nestDeps, nestDepsLen, nestDepsToRequire = [], entity, src, allCached = true;
            var register;
            switch (arguments.length) {
                case 3:
                    register = arguments[2];
                    break;
                case 2:
                    register = deps;
                    break;
                case 1:
                    deps = [];
                    factory = deps;
                    break;
                default:
                    return;
                    break;
            }

            //先格式化一下给定的模块名，目标为数组
            //并清理可能的额外空白字符
            deps = isArray(deps) ? 
                deps :
                typeof deps === "string" && [deps] || [];

            //因为模块是异步加载的，实际激活的顺序可能不同
            //所以我们要确保最后返回的顺序与请求参数deps中的顺序相同
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
                var keys = [], len2, alreayLoaded = false;
                var allLoaded = true, alreadyLoaded = false;
                for (l = 0, len = deps.length; l< len; l++) {
                    if (!moduleMap[deps[l]]){
                        allLoaded = false;
                        break;
                    }
                }

                //如果这一层的模块都已载入，检测是否有下一层
                //即更多的依赖需要被载入
                if (allLoaded) {
                    //解决依赖
                    for (i in moduleMap) {
                        if (moduleMap.hasOwnProperty(i))
                            keys[keys.length] = i;
                    }
                    for (i = 0, len = deps.length; i < len; i++) {
                        for (j = 0, nestDeps = moduleMap[deps[i]].deps, nestDepsLen = nestDeps.length; j < nestDepsLen; j++, alreadyLoaded = false) {
                            for (k = 0, len2 = keys.length; k < len2; k++) {
                                if (keys[k] === nestDeps[j]) {
                                    alreadyLoaded = true;
                                    break;
                                }
                            }
                            if (!alreadyLoaded) nestDepsToRequire.push(nestDeps[j]);
                        }
                    }
                    if (nestDepsToRequire.length > 0) {
                        //还有依赖需要载入，进入下一层
                        //处理一下参数，以便让回调函数的实际调用者知晓最终要返回哪些模块实例
                        self.require.apply(self, [nestDepsToRequire, factory, register]);
                    } else {
                        //最后，如果factory是函数，则执行它
                        //并且将其请求的模块实例按指定顺序返回作为其参数
                        isFunction(factory) && factory.apply(factory, arrangeEntity());
                    }
                }
            };

            //遍历每个需要加载的模块，并异步加载
            while (module = deps[m++]) {
                //去掉空格
                module = module.replace(trimRegExp, "");
                //检查是否是一个已经载入的模块
                //如果是我们将跳过此模块否则加载之
                if (!moduleMap[module]){
                    //将已缓存的标志更为否
                    allCached = false;
                    //加载该模块文件并定义一个闭包回调函数
                    getJs(module, parseJsPath(module), checkLoaded);
                }
            }

            //如果没有要加载的模块，即在先前的操作中已经载入和初始化过了
            //则直接执行回调函数
            allCached && isFunction(factory) && factory(arrangeEntity());
        },
        /**
         * 扩展接口
         * 外部可以藉此接口扩展加载器的基础接口
         */
        extend: function (ext) {
            var i;
            for (i in ext) {
                if (ext.hasOwnProperty(i) && i !== "require" && i !== "ready" && i !== "extend" && i !== "config")
                    this[i] = ext[i];
            }
        },
        /**
         * 注册当某个模块准备就绪后执行的方法
         * 由模块自行定义或由使用者外部定义
         * @param {String} name 模块名
         * @param {Function} callback 要执行的方法
         * @see   http://www.oschina.net/code/snippet_926655_34118
         */
        ready: function (name, callback) {
            if (cfg.ready[name]) {
                cfg.ready[name] = function () {
                    cfg.ready[name]();
                    callback();
                };
            } else {
                cfg.ready[name] = callback;
            }
        },
        /**
         * 最后我们公开一些属性
         */
        version: "0.2-dev",
        build: "2014/05/09 nightly"
    };

    define  = function(){cookJsApi.define.apply(cookJsApi, arguments);};
    ready   = function(){cookJsApi.ready.apply(cookJsApi, arguments);};
    require = function(){cookJsApi.require.apply(cookJsApi, arguments);};

    cookJs.noConflict = function() {
        if (global.define === define) {
            global.define = _define;
        }
        if (global.require === require) {
            global.require = _require;
        }
    };

    return cookJsApi;
})(window);


/**
 * 2014/03/13    0.1-dev    现在框架可以异步载入的所需要的模块了
 *                          添加了Jsdoc风格的注释
 * 2014/03/14    0.1-dev    现在框架遵循更为标准的AMD规范，use接口现在只供内部使用
 *                          框架名由danJs更为cookJs
 * 2014/03/15    0.1-dev    修复了一个如果请求的模块都已缓存，模块代码就不会被执行的问题
 * 2014/03/16    0.1-dev    添加了设置接口
 * 2014/03/22    0.1-dev    删除了启动脚本initrc的概念。改为ready方法
 * 2014/03/25    0.1-dev    兼容性改善，现在框架可在IE6+的浏览器中正常工作
 * 2014/03/28    0.1-dev    不再将cook.js注册到window，而是注册到引用框架的命名空间
 * 2014/04/07    0.1-dev    完善config方法
 * 2014/04/18    0.1-dev    cookJs现更名为cook.js
 * 2014/05/06    0.2-dev    大量逻辑更改，错误修正和功能性能提升，不再定位于框架而仅仅是个加载器，
 *                          core现在成为了一个核心模块[base]，不再和加载器绑定
 *                          更接近requireJs的事实标准
 * 2014/05/07    0.2-dev    支持data-main方式申明的入口,此外还额外支持data-baseUrl,data-coreUrl,data-autoload
 * 2014/05/08    0.2-dev    cookJs.ready, cookJs.require和cookJs.define添加了ready, require和define的全局变量缩写引用，
 *                          这样就可以使用requireJs或其他加载器的标准化模块兼容了
 * 2014/05/09    0.2-dev    错误和兼容性修正
 * 2014/06/03    0.2-dev    cook.js现在支持模块库了 [core://, extra://, community://], 
 *                          分别用开支持核心库模块，扩展支持库模块和社区库模块
 */
