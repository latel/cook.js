/**
 * 更改网站的全局颜色至灰色
 * @author    Kezhong Wong <latelx64@gmail.com>
 * @version   0.0.1
 * @example   
 * @compatity IE6+, Chrome, Firefox, Opera
 */

define(function(){
    var instance = null;

    var req = {};
        req.create = function () {
            //如果已经存在了，我们不能重复创建
            if (instance)
                return;
            var cssText = "<style type=\"text/css\" title=\"yixuan-base-color\">\n\
                *{\n\
                    filter:grayscale(100%);\n\
                    -webkit-filter:grayscale(100%);\n\
                    -moz-filter:grayscale(100%);\n\
                    -ms-filter:grayscale(100%);\n\
                    -o-filter:grayscale(100%);\n\
                    filter:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'><filter id='grayscale'><feColorMatrix type='matrix' values='0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0'></feColorMatrix></filter></svg>#grayscale\");\n\
                    filter:progid:DXImageTransform.Microsoft.BasicImage(grayscale=1);\n\
                }\n\
            </style>";
            // IE6-8 不支持 link, script, style 或者其他 html5(无包裹)的标签
            // 除非外部使用div包含，并且前面有一个不可切割的字符
            var div = document.createElement( "div" );
                div.innerHTML = "<link/>";
            var wrap = !!div.getElementsByTagName( "link" ).length? ["", ""] : ["X<div>", "</div>"],
                node = document.createElement("DIV");
                node.innerHTML = wrap[0] + cssText + wrap[1];
            var tmp;
                if (wrap[0])
                    tmp = node.lastChild.lastChild;
                else
                    tmp = node.lastChild;
            document.documentElement.firstChild.appendChild(tmp);
            instance = tmp;
            node.textContent = "";
            node = null;
        },
        req.enable = function () {
            instance || this.create();
            instance.disabled = false;
        };
        req.disable = function () {
            instance && (instance.disabled = true);
        };

    return function (apply) {
        //检查我们创建的内联样式节点是否依然存在
        //如果不存在我们需要建立一个
        if (apply && !instance)
            req.create();

        //返回包装后的接口
        return req;
    };
});
