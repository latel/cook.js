/**
 * @fileoverview 事件管理器模块
 *               提供一个跨浏览器兼容的可注册并注销的事件管理器
 * @author       latelx64@gmail.com (Kezhen Wong)
 * @version      0.0.1
 * @link         https://github.com/latel/cookJs/module/event.js
 * @example      以下实例均假定本模块的实体被返回给变量 events
 *               1.添加多个事件
 *               ================================================
 *               var nerd = document.getElementById("nerd");
 *               events.on(nerd, {
 *                   click: function () {
 *                       alert("I'm happy");
 *                   },
 *                   hover: function () {
 *                       console.log("Yep, she is looking at me");
 *                   }
 *               });
 *               将会返回绑定的事件ID列表,如
 *               [1,2]
 *               ------------------------------------------------
 *               2.只添加一个事件时，你可以使用以下语法
 *               events.on(nerd, "click", function(){
 *                   alert("I'm happy");
 *               });
 *               将会返回绑定事件的ID，如
 *               3
 *               ------------------------------------------------
 *               你可以在绑定事件时指定一个命名空间，如：
 *               events.on(nerd, "click/namespace", function(){
 *                   alert("I'm happy");
 *               });
 *               一个命名空间下可以同时存在多个处理函数
 *
 *               解除绑定事件的方法与此类似
 *               ================================================
 *               --------------------------------
 *               要解除一个命名函数
 *               var nerd = document.getElementById("nerd");
 *               var fn = function () {
 *                   alert("I'm happy");
 *               };
 *               events.on(nerd, "click", fn);//假设返回的事件ID是2
 *               events.un(nerd, "click", fn);
 *               或根据返回的事件ID解绑
 *               events.un(2);
 *               --------------------------------
 *               要解除匿名函数，您可以使用返回的事件ID解绑
 *               events.on(nerd, "click", function(){
 *                   alert("I'm sad");
 *               });
 *               假设返回的事件ID是2,则你可以这样解绑
 *               events.un(2);
 *               或者在定义时添加一个命名空间，然后根据此命名空间解绑,如：
 *               events.on(nerd, "click/doAlert", function(){
 *                   alert("I'm sad");
 *               });
 *               然后这样解绑
 *               events.un(nerd, "click/doAlert");
 *               --------------------------------
 *               要解除所有某个类型的事件
 *               events.un(nerd, "click");
 *               注意，这样也会解除由 onclick= 形式注册的事件
 *               要解除某个命名空间下的事件
 *               events.un(nerd, "click/namespace");
 *
 * @compatity    IE6+, Chrome, Firefox
 */

cookJs.define("events", [], function() {
    var fnLength    = 0,
        fnRegistery = {},
        evId        = 0,
        evRegistery = {},
        nsRegistery = {},
        debounce    = function (func, threshold, execAsap) {
            var timeout;
            return function debounced () {
                var obj  = this,
                    args = arguments;
                function delayed () {
                    if (!execAsap) 
                        func.apply(obj, args);
                    timeout = null;
                };
                if (timeout) 
                    clearTimeout(timeout);
                else if (execAsap) 
                    func.apply(obj, args);
                timeout = setTimeout(delayed, threshold || 100);
        };
    }
    return {
        /**
         * 绑定事件
         * @param {HTML DOM OBJECT} obj 要绑定事件的目标节点
         * @param {String|Object} ets 命名空间字符串(单个事件时的写法)或对象(多个事件时的写法)
         * @param {Function} comp (可选) 单个事件写法时的事件处理函数
         * @return {Number|Array Object} 返回事件ID（单个)或ID列表(多个)
         */
        on: function (obj, ets, comp) {
            var fid, fn, i, j, len, et, ns, evIds = [];
            //初步检查传递的参数格式并可能做出相应的转换
            //用于支持单个事件的语法
            if (obj.nodeType !== 1) 
                return false;
            if (typeof ets === "string" && typeof comp === "function") {
                //将单个事件的简洁写法转换成标准写法
                et      = {};
                et[ets] = comp;
                ets     = et;
            } else if (typeof ets !== "object")
                return false;

            //遍历事件
            for (i in ets) {
                if (!ets.hasOwnProperty(i))
                    continue;

                //给传递的事件处理函数以唯一标记以用于识别
                //如果已经有标记则直接从缓存中读取
                if (ets[i].fid) {
                    fid = ets[i].fid;
                    fn  = fnRegistery[fid];
                } else {
                    ets[i].fid = fid = fnLength;
                    //是否是resize，如果是，我们需要做防抖动处理
                    if (i === "resize") 
                        ets[i] = debounce(ets[i]);
                    fn = (function(i){
                        return function () {
                            ets[i].call(obj);
                        };
                    })(i);
                    //将函数(经过修改的)放入缓存
                    fnRegistery[fnLength++] = fn;
                }

                //检查是否有命名空间
                if (/\//.test(i)) {
                    ns = i.match(/\/.+$/)[0].replace("/", "");
                    i  = i.replace("/" + ns, "");
                    if (nsRegistery[ns]) {
                        nsRegistery[ns].push(fid);
                    } else
                        nsRegistery[ns] = [fid];
                }

                if (obj.addEventListener) {
                    //标准浏览器的事件绑定
                    obj.addEventListener(i, fn, false);
                    evIds.push(evId);
                    evRegistery[evId++] = [obj, i, fid];
                } else if (obj,attachEvent) {
                    //低版本IE的事件绑定
                    obj.attachEvent("on" + i, fn);
                    evIds.push(evId);
                    evRegistery[evId++] = [obj, i, fid];
                } else {
                    //不提供事件绑定的兼容性处理
                    j = "on" + i;
                    if (typeof obj[j] === "function") {
                        try {
                            obj[j] = function () {
                                obj[j]();
                                fn();
                            };
                        } catch(e) {}
                    } else {
                        try {
                            obj[j] = fn;
                        } catch(e) {}
                    }
                }
            }

            if (evIds.length === 0)
                return null;
            else if (evIds.length ===1 ) {
                return evIds[0];
            } else
                return evIds;
        },
        /**
         * 解绑事件
         * @param {HTML DOM OBJECT} 要解除事件的目标节点
         * @param {String|Object} ets 字符串(单个事件时的写法)或对象(多个事件时的写法)
         * @param {Function|Number} comp (可选) 单个事件写法时的事件处理函数或事件ID
         */
        un: function(obj, ets, comp) {
            var fn, i, fid, et;
            //初步检查传递的参数格式并可能做出相应的转换
            //用于支持单个事件的语法
            if (obj.nodeType != 1) 
                return false;
            if (typeof ets === "string" && comp === undefined) {
                //注销所有某个类型的事件
                ets
            } else if (typeof ets === "string" && (typeof comp === "function" || typeof comp === "number")) {
                //将单个事件的简洁写法转换成标准写法
                et      = {};
                et[ets] = comp;
                ets     = et;
            } else if (typeof ets !== "object")
                return false;

            for (i in ets) {
                //如果类型为number则意味着传递的是事件ID，否则
                //根据标记在事件处理程序上的事件id，找到实际绑定的事件
                fid = typeof ets[i] === "numbert"? ets[i] : ets[i].fid || -1;
                fn  = fnRegistery[fid];
                if (!fn)
                    continue;

                if (obj.removeEventListener) {
                    obj.removeEventListener(i, fn, false);
                } else if (obj.detachEvent) {
                    i = "on" + i;
                    obj.detachEvent(i, fn);
                } else {
                    i = "on" + i;
                    obj[i] = null;
                }
            }
        }
    };
});


/**
 * 2014/03/12   0.0.1   模块创建
 * 2014/03/22   0.0.1   根据cookJs框架的最新标准修订，根据专注职能的设计条约，
 *                      对多obj的支持被取消，同时只能进行一个节点的事件处理;
 *                      添加了单个事件操作的简洁语法
 */
