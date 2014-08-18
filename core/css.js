/**
 * @fileoverview 元素的样式和属性管理模块
 * @author       latelx64@gmail.com (Kezhen Wong)
 * @version      0.0.1
 * @link         https://github.com/latel/cook.js/core/css.js
 */

define(["core://base"], function() {
    //我们来先定义一些重要的正则用来匹配内容
    //1.用于匹配空白字节
    var rclass = /[\t\r\n\f]/g;
    //2.用于匹配类名文字
    var rnotwhite = /\S+/g;

    //定义一些会被重用的函数
    //1. 判定是否设定了非法的css属性
    var invalidCss = function(key, value) {
        return (key == "width" || key == "height") && parseFloat(value) < 0;
    };
    //2. 修正属性名，如line-height会被修正为lineHeight
    function niceProp (prop) {
        //如果没有-就直接返回
        if (!/-/.test(prop))
            return prop;
        props = prop.split("-");
        len   = props.length;
        while (len) {
            props[--len] = len == 0? props[len].toLowerCase() : 
                props[len].toLowerCase().replace(/(\s(\w)|\b(\w))/g, function (c) {
                    return c.toUpperCase();
                });
        }
        return prop = props.join("");
    }
    //3. 修正值，如style['width']=32 会被修正为32px(缺省)

    return {
        //添加类名
        addClass: function(obj, value) {
            var classes, current, clazz, finalValue, j = 0;

            //处理给定的类名生成数组
            classes = (value || "").match(rnotwhite) || [];

            //读取当前元素拥有的类名并处理格式
            current = obj.nodeType === 1 && (
                    obj.className ? 
                    (" " + obj.className + " ").replace(rclass, " ") :
                    " "
                );

            if (current) {
                //循环处理每一个要添加的类名
                while (clazz = classes[j++]) {
                    if (current.indexOf(" " + clazz + " ") < 0)
                        current += clazz + " ";
                }

                //清除我们在上面为了方便匹配而在首尾额外添加的空格
                finalValue = cookjs.trim(current);

                //只有在真正发生更改时才去更新
                if (finalValue != obj.className)
                    obj.className = finalValue;
            }

            return obj;
        },
        //移除类名
        removeClass: function(obj, value) {
            var classes, current, clazz, finalValue, j = 0;

            //处理给定的类名生成数组
            classes = (value || "").match(rnotwhite) || [];

            //读取当前元素拥有的类名并处理格式
            current = obj.nodeType === 1 && (
                    obj.className ? 
                    (" " + obj.className + " ").replace(rclass, " ") : 
                    " "
                );

            if (current) {
                //循环处理每一个要移除的类名
                while (clazz = classes[j++]) {
                    if (current.indexOf(" " + clazz + " ") >= 0) 
                        current = current.replace(" " + clazz + " ", " ");
                }

                //清除我们在上面为了方便匹配而在首尾额外添加的空格
                finalValue = cookjs.trim(current);

                //只有在真正发生更改时才去更新
                if (finalValue != obj.className)
                    obj.className = finalValue;
            }

            return obj;
        },
        //切换某个/某些类名的存在
        toggleClass: function(obj, value, stateVal) {
            //stateVal
            // =(undefined): 单纯的切换存在与不存在
            // =false    : 全部移除（关闭）
            // =true     : 全部添加（打开）
            // =(integer): 除了指定的index为真，其他的都为假
            var classes, j = 0;
            stateVal = typeof stateVal === "boolean" ? stateVal: undefined;

            //处理给定的类名生成数组
            classes = (value || "").match(rnotwhite) || [];

            //遍历每一个需要处理的类名
            while (clazz = classes[j++]) {
                if (stateVal === undefined) {
                    if (this.hasClass(obj, clazz))
                        this.removeClass(obj, clazz);
                    else
                        this.addClass(obj, clazz);
                } else {
                    if (stateVal)
                        this.addClass(obj, clazz);
                    else
                        this.removeClass(obj, clazz);
                }
            }

            return obj;
        },
        //是否含有某个/某些类名
        hasClass: function(obj, value) {
            var classes, current, clazz, finalValue, j = 0;

            //处理给定的类名并生成数组
            classes = (value || "").match(rnotwhite) || [];

            //取得当前元素拥有的类名并处理格式
            current = obj.nodeType === 1 && (
                    obj.className ? 
                    (" " + obj.className + " ").replace(rclass, " ") : 
                    " "
                );

            //遍历每一个需要判定存在的类名,
            //如果有一个不存在，则返回否定的答案
            while (clazz = classes[j++]) {
                if (current.indexOf(" " + clazz + " ") < 0)
                    return false;
            }

            return true;
        },
        //设置元素的属性，如：title, name等
        //如果没有提供值，将获取该值
        attr: function(obj, name, value) {
            //分两种情况
            //1.只有name被赋值且为字符串，则可以断言是获取attr属性
            //2.name和value都被赋值且为字符串类型，则可以断言为设置attr属性
            var propName = { 
                'tabindex'        : 'tabIndex', 
                'readonly'        : 'readOnly', 
                'for'             : 'htmlFor', 
                'class'           : 'className', 
                'maxlength'       : 'maxLength', 
                'cellspacing'     : 'cellSpacing', 
                'cellpadding'     : 'cellPadding', 
                'rowspan'         : 'rowSpan', 
                'colspan'         : 'colSpan', 
                'usemap'          : 'useMap', 
                'frameborder'     : 'frameBorder', 
                'contenteditable' : 'contentEditable' 
            };
            if (value == undefined) {
                (is.IE < 8) && propName[name] && (name = propName[name]);
                return obj.getAttribute(name);
            } else {
                obj.setAttribute(name, value, true);
            }
        },
        //移除属性
        removeAttr: function(obj, value) {
            var i = 0, attrNames, attrName;
            attrNames = value && value.match(/\S+/g);
            //如果没有指定要移除的name或obj不是一个节点就返回
            if (!attrNames || obj.nodeType !== 1)
                return false;

            while (attrName = attrNames[i++]) {
                //我们似乎应当对bool值区分对待，暂时不考虑
                obj.removeAttribute(attrName);
            }
        },
        //设置样式
        style: function(obj, key, value) {
            //分三种情况
            //1.只有key被赋值且为字符串，则可以断言是获取css属性
            //2.只有key被赋值且为对象，则可以断言是设置多个css属性值
            //3.key和value都被赋值且为字符串类型，则可以断言为设置单个css属性值
            //现在我们来分别处理
            if (value == undefined) {
                if (typeof key == "string") {
                    //1...
                    key = niceProp(key);
                    return obj.style[key] ? 
                        obj.style[key] : 
                        obj.currentStyle ? 
                            obj.currentStyle[key] : 
                            window.getComputedStyle(obj, null)[key];
                } else if (typeof key == "object") {
                    //2...
                    for (var i in key) {
                        i = niceProp(i);
                        if (!invalidCss(i, key[i])) 
                            obj.style[i] = key[i];
                    }
                }
            } else {
                //3....
                if (typeof(key) == "string" && typeof(value) == "string") {
                    //设置width和height为负值会被忽略
                    key = niceProp(key);
                    if (!invalidCss(key, value))
                        obj.style[key] = value;
                }
            }
        },
        //获取匹配元素的文本
        text: function() {
        },
        //最后，向外界公开模块的一些基本信息
        version: '0.0.1'
    };
});


/**
 * 2014/03/12   0.0.1   模块创建
 * 2014/03/20   0.0.1   功能完善
 * 2014/04/18   0.0.1   修复一个批量添加css属性时的小错误
 * 2014/06/10   0.0.1   修复IE6,7下属性设置和获取时的兼容性错误
 */
