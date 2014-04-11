/**
 * @fileoverview 事件管理器模块
 *               提供一个跨浏览器兼容的可注册并注销的事件管理器
 * @author       latelx64@gmail.com (Kezhen Wong)
 * @version      0.0.1
 * @link         https://github.com/latel/cookJs/module/event.js
 * @example      以下实例均假定本模块的实体被返回给变量 events,即
 *               require("events", function(events){/您的代码/});
 *
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
 *               同一个命名空间下可以存在多个处理函数
 *
 *               解除绑定事件的方法与此类似
 *               ================================================
 *               --------------------------------
 *               要解除一个命名函数
 *               var nerd = document.getElementById("nerd");
 *               var fn = function () {
 *                   alert("I'm happy");
 *               };
 *               events.on(nerd, "click", fn);//我们假设返回的事件ID是213
 *               可以这样解绑
 *               events.un(nerd, "click", fn);
 *               或根据返回的事件ID解绑
 *               events.un(213);
 *               --------------------------------
 *               要解除匿名函数绑定的事件，您可以同上使用返回的事件ID解绑
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
 *               注意，这样也会解除由 onclick= 形式注册的处理函数
 *                     这样也会解除隶属于此操作的子命名空间下的处理函数
 *               要单纯的解除某个命名空间下的所有处理函数,可以这样：
 *               events.un(nerd, "click/namespace");
 *
 *               3.主动触发事件
 *               ================================================
 *
 * @compatity    IE6+, Chrome, Firefox, Safari
 */

cookJs.define("events", [], function() {
    /**
     * @var {Object}   fnCache     缓存修改过的处理函数（主要是出于IE下的this指针问题）
     * @var {Integer}  evIdOffset  事件序号偏移，模块自动处理，不需要维护此值
     * @var {Integer}  HTMLElementOffet
     *                             HTMLElement序号偏移
     * @var {Object}   evHash      事件索引，藉此可以使用事件序号找到具体的事件类型(type)和绑定的对象
     * @var {Object}   nsMap       命名空间表，查阅注册到此命名空间下的处理函数
     *                             (不同的对象，即使命名空间相同，也是独立的)
     * @var {Function} debounce    用于防止某些函数被触发多次
     */
    var fnCache    = {},
        evIdOffset = 0,
        HTMLElementOffset = 0,
        evHash     = {},
        nsMap      = {},
        debounce   = function (func, threshold, execAsap) {
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
    };

    return {
        /**
         * 绑定事件
         * @param {HTML DOM OBJECT} obj 要绑定事件的目标节点
         * @param {String|Object} ets 命名空间字符串|事件名(单个事件时的写法)或对象(多个事件时的写法)
         * @param {Function} comp (可选) 单个事件写法时的事件处理函数
         * @return {Number|Array Object} 返回事件ID（单个)或ID列表(多个)
         */
        on: function (obj, ets, comp) {
            var fn, i, j, len, et, evIds = [], hid;
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

                hid = 0;

                //是否是resize，如果是，我们需要做防抖动处理
                if (i === "resize") 
                    ets[i] = debounce(ets[i]);
                //修改一下函数，使得在IE下，this的指针同样指向触发事件的对象
                fn = (function(obj, i){
                    return function (ev) {
                        ev = ev || window.event;
                        if (ev) {
                            ev.target = ev.target || ev.srcElement;
                            ev.layerX = ev.layerX || ev.offsetX;
                            ev.layerY = ev.layerY || ev.offsetY;
                            if (!ev.preventDefault)
                                ev.preventDefault = function () {
                                    window.event.returnValue = false;
                                };
                            if (!ev.stopPropagation)
                                ev.stopPropagation = function () {
                                    window.event.cancelBubble = true;
                                };
                        }
                        ets[i].call(obj, ev);
                    };
                })(obj, i);
                //将函数(经过修改的)放入缓存
                fnCache[++evIdOffset] = fn;
                //记录到事件索引
                evHash[evIdOffset] = [obj, i];

                //从HTMLElementOffset生产一个惟一的DOM序号
                hid = obj.getAttribute("data-cookJsEv-id");
                if (!hid) {
                    hid = ++HTMLElementOffset;
                    obj.setAttribute("data-cookJsEv-id", hid, true);
                }

                //记录命名空间
                if (nsMap[hid] === undefined)
                    nsMap[hid] = {};
                if (nsMap[hid][i]) {
                    nsMap[hid][i].push(evIdOffset);
                } else
                    nsMap[hid][i] = [evIdOffset];
                i  = i.match(/^\w+/)[0];

                if (obj.addEventListener) {
                    //标准浏览器的事件绑定
                    obj.addEventListener(i, fn, false);
                    evIds.push(evIdOffset);
                } else if (obj,attachEvent) {
                    //低版本IE的事件绑定
                    obj.attachEvent("on" + i, fn);
                    evIds.push(evIdOffset);
                } else {
                    //不提供事件绑定的浏览器做兼容性处理
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
            else if (evIds.length === 1 ) {
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
            var fn, i = 0, j = 0, objets, nsets, et, ns;
            //初步检查传递的参数格式并做出可能的转换
            //用于支持单个事件的语法
            if (obj.nodeType != 1) 
                return false;

            //提前注册一个事件处理函数
            function removeEvent (obj, type, fn) {
                if (obj.removeEventListener) {
                    obj.removeEventListener(type, fn, false);
                } else if (obj.detachEvent) {
                    type = "on" + type;
                    obj.detachEvent(type, fn);
                } else {
                    type = "on" + type;
                    obj[type] = null;
                }
            }

            //判断参数的组合类型
            if (typeof obj === "integer") {
                //由事件ID注销对用的事件
                removeEvent(evHash[obj][0], evHash[obj][1], fnCache[obj]);

            } else if (typeof ets === "string" && comp === undefined) {
                //注销所有某个类型的事件或某个命名空间下的
                objets = nsMap[obj];
                for (i in objets) {
                    if (new RegExp("^" + ets + "$|^" + ets + "/", "").test(i)) {
                        //意味着命名空间相同或是其子命名空间
                        nsets = objets[i];
                        while (et = nsets[j++]) {
                            removeEvent(evHash[et][0], evHash[et][1], fnCache[et]);
                        }
                    }
                }

            } else if (typeof ets === "string" && typeof comp === "function") {
                /**
                 * 暂不支持
                //注销单个处理函数,提供了实际的函数体，这是不推荐的
                //推荐使用上面的命名空间来注销处理函数
                objets = nsMap[obj];
                if (objets[ets]) {
                    nsets = objets[ets];
                    while (et = nsets[j++]) {
                        if (fnCache[et].arguments.callee == comp.arguments.callee)
                            removeEvent(evHash[et][0], evHash[et][1], fnCache[et]);
                    }
                }
                */

            } else if (typeof ets !== "object")
                return false;
        },
        trigger: function(obj, ns) {
            var hid, nsets, i = 0, et;
            if (!(hid = obj.getAttribute("data-cookJsEv-id")))
                return false;
            if (!(nsets = nsMap[hid][ns]))
                return false;

            for (i in nsets) {
                while (et = nsets[i++]) {
                    fnCache[et]();
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
 * 2014/03/24   0.0.1   添加了命名空间的支持，这样就可以注销匿名函数了
 * 2014/04/01   0.0.1   修复了event事件无法传递的问题和IE下的兼容性问题
 * 2014/04/04   0.0.1   修复了命名空间表的下标不准确问题（在HTMLElement上添加索引）
 *                      添加了trigger方法
 *                      ie现在兼容ev.preventDefault()
 */
