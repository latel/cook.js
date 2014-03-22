/**
 * @fileoverview 事件管理器模块
 *               提供一个跨浏览器兼容的可注册并注销的事件管理器
 * @author       latelx64@gmail.com (Kezhen Wong)
 * @version      0.0.1
 * @link         https://github.com/latel/cookJs/module/event.js
 * @example      以下实例均假定本模块的实体被返回给变量 events
 *               1.添加多个事件
 *               var nerd = document.getElementById("nerd");
 *               events.on(nerd, {
 *                   click: function () {
 *                       alert("I'm happy");
 *                   },
 *                   hover: function () {
 *                       console.log("Yep, she is looking at me");
 *                   }
 *               });
 *               2.只添加一个事件时，你可以使用以下语法
 *               events.on(nerd, "click", function(){
 *                   alert("I'm happy");
 *               });
 *               解除绑定事件的方法与此类似
 *               !!!注意：匿名函数不支持解绑!!!
 *               var nerd = document.getElementById("nerd");
 *               var fn = function () {
 *                   alert("I'm happy");
 *               };
 *               events.on(nerd, "click", fn);
 *               events.un(nerd, "click", fn);
 * @compatity    IE6+, Chrome, Firefox
 */

cookJs.define("events", [], {
    factory: function() {
        var fnRegistery = {},
            fnLength    = 0,
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
             * @param {String|Object} ets 字符串(单个事件时的写法)或对象(多个事件时的写法)
             * @param {Function} comp (可选) 单个事件写法时的事件处理函数
             * @return {Number|Array Object} 返回事件ID（单个)或ID列表(多个)
             */
            on: function (obj, ets, comp) {
                var fn, i, len, et;
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
                    //给传递的事件处理函数标记一个唯一的事件ID以用于解绑
                    ets[i].fid = fnLength;
                    //是否是自身属性
                    if (!ets.hasOwnProperty(i))
                        continue;
                    //是否是resize，如果是，我们需要做防抖动处理
                    if (i === "resize") 
                        ets[i] = debounce(ets[i]);

                    //shortcut
                    fn = ets[i];
                    if (obj.addEventListener) {
                        //标准浏览器的事件绑定
                        fnRegistery[fnLength++] = fn;
                        obj.addEventListener(i, fn, false);
                    } else if (obj,attachEvent) {
                        //低版本IE的事件绑定
                        i  = "on" + i;
                        fn = function () {
                            fn.call(obj);
                        };
                        fnRegistery[fnLength++] = fn;
                        obj.attachEvent(i, fn);
                    } else {
                        //不提供事件绑定的兼容性处理
                        i = "on" + i;
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
            },
            /**
             * 解绑事件
             * @param {HTML DOM OBJECT} 要解除事件的目标节点
             * @param {String|Object} ets 字符串(单个事件时的写法)或对象(多个事件时的写法)
             * @param {Function|Number} comp (可选) 单个事件写法时的事件处理函数或事件ID
             */
            un: function(obj, ets, comp) {
                var fn, i, fid;
                //初步检查传递的参数格式并可能做出相应的转换
                //用于支持单个事件的语法
                if (obj.nodeType != 1) 
                    return false;
                if (typeof ets === "string" && (typeof comp === "function" || typeof comp === "number")) {
                    //将单个事件的简洁写法转换成标准写法
                } else if (typeof ets !== "object")
                    return false;

                for (i in ets) {
                    //根据标记在事件处理程序上的id，解绑事件
                    fid = ets[i].fid;
                    fn  = fnRegistery[fid];
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
    }
});


/**
 * 2014/03/12   0.0.1   模块创建
 * 2014/03/22   0.0.1   根据cookJs框架的最新标准修订，根据专注职能的设计条约，
 *                      对多obj的支持被取消，同时只能进行一个节点的事件处理
 */
