/**
 * 向下兼容的placeholder插件
 * 对于现在浏览器不做任何改变，在旧版本的浏览器上如（IE<=8）做兼容处理
 * @version   0.0.1
 * @link      http://www.oschina.net/code/snippet_1457422_33600
 * @compatity IE6+
 * @todo      解决缩放后位置不对的问题
 */

cookJs.define("placeholder", ["fizzle", "events", "css"], function ($, events, css) {
    //检测是否浏览器是否现代化到足够原生支持placeholder
    /*
    var input = document.createElement('input');
    if ("placeholder" in input) 
        return true;
        */

    //如果这里的代码被调用，意味着浏览器不支持placeHolder，或外部强制调用。我们将模拟这一行为
    $("input[type=text]").each(function(){
        var self = this, sim, left, top;
        //创建一个模拟的浮动层
        sim = document.createElement("div");
        //定位值输入框的地点
        $(sim).cook({
            css: {
                "position"        : "absolute", 
                "left"            : this.offsetLeft + "px", 
                "top"             : this.offsetTop + "px",
                "height"          : $(this).css("height"),
                "backgroundColor" : "transparent",
                "padding"         : $(this).css("padding"),
                "line-height"     : $(this).css("line-height"),
                "border"          : $(this).css("border"),
                "borderColor"     : "transparent",
                "cursor"          : "text",
                "color"           : $(this).css("color"),
                "visibility"      : "hidden",
                "font-size"       : $(this).css("font-size"),
                "pointer-events"  : "none"
            },
            innerHTML: css.attr(this, "placeholders"),
            on: {
                click: function () {
                    alert(1);
                }
            }
        });
        //如果在脚本执行之前输入框已经有输入内容，那么就不再显示
        //可能的网络延迟？
        if (!$(this).val())
            $(sim).css("visibility", "visible");
        this.offsetParent.appendChild(sim);

        //为输入框绑定事件
        $(this).on({
            keyUp: function () {
                alert(1);
                console.log(sim);
                if (this.value.length== 0){
                    $(sim).css("visibility", "visible");
                }else {
                    $(sim).css("visibility", "hidden");
                }
            }
        });
    });

    //对于密码框我们不再处理 :)
    /*
    $("input[type=password]").each(function(){
    });
    */
});

/**
 * 2014/03/19    0.1    添加为cookJs的模块
 */
