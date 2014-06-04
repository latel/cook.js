define(function(){
    if (!window.Element) {
        Element = function () {};
        var __IECreateElement = document.createElement;

        document.createElement = function (tagName) {
            var el = __IECreateElement(tagName),
                interfaces = new Element(),
                i;
            for (i in interfaces)
                el[i] = interfaces[i];
            return el;
        };
    }

    Element.prototype.mutationObserver = function (name) {
        var obj = this,
            onGet = function () {
                alert(obj.tagName + "1");
            },
            onSet = function () {
                alert(obj.tagName + "2");
            };

        // Modern browsers, IE9+, and IE8 (must be a DOM object),
        if (Object.defineProperty) {
     
            Object.defineProperty(obj, name, {
                get: onGet,
                set: onSet
            });
     
        // Older Mozilla
        } else if (obj.__defineGetter__) {
     
            obj.__defineGetter__(name, onGet);
            obj.__defineSetter__(name, onSet);
        }

        return obj;
    }
});
