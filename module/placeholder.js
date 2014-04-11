/**
 * 向下兼容的placeholder插件
 * 对于现在浏览器不做任何改变，在旧版本的浏览器上如（IE<=8）做兼容处理
 * @version   0.0.1
 * @link      http://www.oschina.net/code/snippet_1457422_33600
 * @compatity IE6+
 * @todo      
 */

cookJs.define("placeholder", ["fizzle", "events", "css"], function ($, events, css) {
    //检测是否浏览器是否现代化到足够原生支持placeholder
    var input = document.createElement('input');
    if ("placeholder" in input) 
        return true;

    //如果这里的代码被调用，意味着浏览器不支持placeHolder，我们将模拟这一行为
    $("input[type=text], input[type=password]").each(function(){
        var self = this, sim, left, top, ofprt;
        //如果申明不需要模拟则略过
        if ($(this).hasClass("noplaceholder"))
            return;

        //创建一个模拟的浮动层
        sim = document.createElement("div");
        //模拟原来的输入框的属性
        $(sim).cook({
            css: {
                "position"        : "absolute", 
                "height"          : $(this).css("height"),
                "backgroundColor" : "transparent",
                "padding"         : $(this).css("padding"),
                "line-height"     : $(this).css("line-height"),
                "border-width"    : $(this).css("border-width"),
                "borderColor"     : "transparent",
                "cursor"          : "text",
                "color"           : "#999",
                "visibility"      : "hidden",
                "font-size"       : $(this).css("font-size"),
                "pointer-events"  : "none"
            },
            html: css.attr(this, "placeholder")
        });

        //生成一个字符串以标记浮动层和输入框之间的一一对应关系
        clazzes = cookJs.trim(
                      cookJs.arrayFilter(
                          this.className.split(/\s+/g)
                      )
                  ).join(".");
        $(sim).attr("data-input", "input#" + this.id + "." + clazzes);

        //修正IE6, IE7, IE8下由hasLayout特性导致的offsetParent无法正确判定的问题
        //@see http://www.w3help.org/zh-cn/causes/SD9018
        ofprt = this.offsetParent;
        if (ofprt !== document.body && $(ofprt).css("position") === "static")
            $(ofprt).css("position", "relative");

        //设置一个定时脚本，不断的修正虚拟层的位置和决策是否应该隐藏或显示（根据输入框的值）
        //缩放和页面节点的状态变化（如隐藏和显示，节点的添加和删除）都会隐藏到应该显示的位置
        setInterval(function(){
            $(sim).css({
                "left"    : self.offsetLeft + "px", 
                "top"     : self.offsetTop + "px",
                "visibility" : $(self).val()? "hidden" : "visible"
            });
        }, 50);

        //将虚拟层添加值页面
        this.parentNode.appendChild(sim);
    });
});

/**
 * 2014/03/19    0.1    添加为cookJs的模块
 * 2014/03/25    0.1    兼容性改善
 */
