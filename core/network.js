/**
 * @fileoverview 统一的用于和网络通信模块 
 * @author       latelx64@gmail.com (Kezhen Wong)
 * @version      0.0.1
 * @link         https://github.com/latel/cook.js/core/network.js
 */

define(["core://json2"], function () {
    var init = function () {
            var xmlHttp;
            if (window.XMLHttpRequest) {
                xmlHttp = new XMLHttpRequest();
            } else {
                xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
            }
            return xmlHttp;
        },
        parseData = function (data) {
            if (typeof data == "object") {
                var str = "";
                for (var i in data) {
                    str += "&" + i + "=" + encodeURIComponent(data[i]);
                }
                return (str.length== 0) ? str : str.substring(1);
            } else {
                return data;
            }
        };
    return function (opt) {
        var xmlHttp = init();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState=== 4) {
                xmlHttp.status === 200? 
                    opt.success(xmlHttp.responseText, xmlHttp.responseXML) : 
                    opt.error(xmlHttp.responseText, xmlHttp.status);
            }
        }
        opt.data = parseData(opt.data);
        if (opt.method.toLowerCase() === "get") {
            opt.url = opt.data? (opt.url + "?" + opt.data) : opt.url;
            opt.data = null;
        }
        xmlHttp.open(opt.method, opt.url, opt.async);
        if (opt.method.toLowerCase() ==="post")
            xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xmlHttp.send(opt.data);
        return xmlHttp;
    };
});


/**
 * 2014/03/12   0.0.1   模块创建
 * 2014/03/26   0.0.1   修复了IE6下的不兼容
 * 2014/04/12   0.0.1   修复了data为空时会发送一个undefined字符串的严重问题
 */
