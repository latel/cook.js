/**
 * @fileoverview cook.js的核心工具库
 *               附送的一些好用的工具？
 * @author       latelx64@gmail.com (Kezhen Wong)
 * @version      0.1
 * @link         https://github.com/latel/cook.js/module/core.js
 */
ready("core://base", function(){
    var host;
    cookjs.extend(this);
    host = cookjs.detectHost();
    window.is = {};
    if (host !== null)
        window.is[host[0]] = host[1].replace(/[.].*/, "");
});

define(function () {
    return {
        //一些有用的正则表达式
        //匹配注释
        commentRegExp : /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*))/mg,
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
