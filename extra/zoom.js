/**
 * @fileoverview 跨浏览器的网页缩放接口
 * @author       latelx64@gmail.com (Kezhen Wong)
 * @version      0.0.1
 * @link         https://github.com/latel/cook.js/core/zoom.js
 * @compatity    IE6+, Firefox, Chrome
 */

define(function(){
    return function (zoomLv) {
        var zoomLv = (zoomLv = zoomLv.toString()) && (typeof parseFloat(zoomLv) !== "number"?
                 1 : 
                 (zoomLv.indexOf("%") > -1)?
                     parseFloat(zoomLv)/100 :
                     parseFloat(zoomLv)
            ) || 1,
            dbs     = document.body.style;
        if ("webkitTransform" in dbs) {
            /* webkit support*/
            dbs["webkitTransform"] = "scale(" + zoomLv + ")";
            dbs["webkitTransformOrigin"] = "0 0";
        } else if ("MozTransform" in dbs) {
            /* firefox support*/
            dbs["MozTransform"] = "scale(" + zoomLv + ")";
            dbs["MozTransformOrigin"] = "0 0";
        } else if ("-ms-transform" in dbs) {
            /* IE9+ support*/
            dbs["-ms-transform"] = "scale(" + zoomLv + ")";
            dbs["-ms-transform-origin"] = "0 0";
        } else { 
            /* old IE support*/
            dbs["zoom"] = zoomLv;
        }
    }
});
