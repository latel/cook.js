# cook.js [deleloping](http://github.com/latel/cook.js)

cook.js是一个在学习requireJs期间诞生的一个主要用于研究目的模块和文件加载器的精简实现，然而它同样可以完美的胜任绝大部分工作。 同时我们编写了一些常用的模块，同样是其它实现的精简版本。

Javascript模块化编程会极大的提高您的编码效率和质量。

## 兼容性

下面的浏览器是已经经过测试的可以兼容，当然其实际支持的范围可能比下面列出的更大，
但是限于时间和资源我无法一一测试，如果您在使用过程中发现可以兼容其他浏览器欢迎告诉我。\
IE 6+ ............ ✔
Firefox 4+ ....... ✔
Chrome 34+ ....... ✔

##API
cook.define   定义一个模块文件,以便稍后可以被require方法引用到
    .require  引用您需要并且已定义的模块，并实现自己的过程。
    .extend   挂载您的自定义接口
    .config   配置加载器本身和模块的参数，被加载的模块将会读取您使用此接口做出的配置
    .ready    模块加载完成后使用此接口定义的方法将会被执行
    .version  查看加载器的版本

## 使用
### 加载 javascript 文件
### data-main 入口文件
### 如何定义一个模块

## 配置选项
###

## 使用插件
###fizzle
###css
###netowrk
###events
###placeholder

### 加载cook.js文件

在您的html代码中加入下面的代码即可激活加载器
<script type="text/javascrip" src="scripts/cook.js" data-main="scripts/main"></script>

####两种方式来调用cook.js
1. data-main
  正如上面的data-main所示，您可以通过此属性制定加载器自身在被加载后主动去加载的首个js模块，
  通常这应该是您的代码的入口文件。通常，它应该有类似以下的结构：
    cook.require(["fizze", "network"], function($, net){
        /* your codes are here*/
    });
    熟悉requireJs的你应该很熟悉这里的代码，所以不再阐述

2. 页内调用
  所谓页内调用，即大致就是讲入口文件中的代码直接写入html文件中，
  而不是另建一个文件然后在datamain属性中指明，类似的结构如下：
    <html>
        <head>
            ...
            <script type="text/javascrip" src="scripts/cook.js"></script>
            ...
        </head>
        <body>
            /* html tags here */
            <script type="text/javascript">
                cook.require("module/main", ["fizze", "network"], function($, net){
                    /* your codes are here*/
                });
            </script>
        </body>
    </html>
    _您应该注意到，如果使用内联脚本，您必须指定一个模块名_

####如何构造一个模块
