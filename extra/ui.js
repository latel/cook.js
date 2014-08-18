/**
 * 图形控件库
 * 提供一种用于快速创建图形环境的一种方法;
 * 包含多种控件类型的支持
 * 支持主题并且支持动态切换
 * @version 0.0.1
 * @link    https://github.com/latel/cook.js/core/ui.js
 * @example 
 * @todo    提高兼容性，制作更多的主题
 */

define(["core://fizzle", "core://events", "core://animation", "core://network"], function($, events, animation, net) {
    /*维护内部状态
     * ---------------------------------------------------------------*/
    var uiEnvDefault, uiEnv, uiEls, uiResourceLoader, uiCtl;
    //默认配置参数
    uiEnvDefault = {
    };
    //缓存用户的配置参数
    uiEnv = {
    };
    //控件记录表
    uiEls = {
        dialog: [],
        confirmer: [],
        grid: []
    };

    /*主题资源
     * ---------------------------------------------------------------*/
    //缓存的主题
    uiResourceCache = {
    };
    //主题资源加载器
    uiResourceLoader = function (themeName) {
        net({
            url: "http://localhost/pi/application/www/js/vendor/module/uiResource/mse/template.html",
            method: "GET",
            async: true,
            type: "TEXT",
            success: function (temp) {
                console.log(temp);
            },
            error: function () {
                console.log("加载主题资源" + themeName + "时出错");
            }
        });
    };
    //自动配置
    //载入用户的定义，缺失的定义将会采用默认值

    //根据用户的配置，第一次运行时载入第一个主题
    events.on(window, "load", function () {
        uiResourceLoader();
    });


    /*对外暴露的ui引擎的接口
     * ---------------------------------------------------------------*/
    uiCtl = {
        /**
         * 弹出一个提示框
         * @param {String} level 提示框的级别
         * @param {Object Object} data 提交的数据
         * @var level
         *      提示框拥有三个级别，“提示”、“警告”和“错误”
         *      通常以颜色区分三个级别，但对于ui引擎本身来说，没有任何区别
         *      仅用于提示用户此消息的重要程度
         */
        prompt: function(level, data){
        },
        /**
         * 弹出一个确认对话框
         * @param {String} level 提示框的级别
         * @param {Object Object} data 提交的数据
         * @var level
         *      确认提示拥有三个级别，“提示”、“警告”和“错误”
         *      通常以颜色区分三个级别，但对于ui引擎本身来说，没有任何区别
         *      仅用于提示用户此消息的重要程度
         */
        confirm: function(level, data){
        }
    };

    console.log("ui module loaded");
    return uiCtl;
});
