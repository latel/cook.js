// Super amazing, cross browser property function, based on http://thewikies.com/
function addProperty(obj, name) {
    var onGet = function () {
        },
        onSet = function () {
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
 
    // IE6-7
    // must be a real DOM object (to have attachEvent) and must be attached to document (for onpropertychange to fire)
    } else {
 
        var onPropertyChange = function (e) {
 
            if (event.propertyName == name) {
                // temporarily remove the event so it doesn't fire again and create a loop
                obj.detachEvent("onpropertychange", onPropertyChange);
 
                // get the changed value, run it through the set function
                var newValue = onSet(obj[name]);
 
                // restore the get function
                obj[name] = onGet;
                obj[name].toString = onGet;
 
                // restore the event
                obj.attachEvent("onpropertychange", onPropertyChange);
            }
        };  
 
        obj[name] = onGet;
        obj[name].toString = onGet;
 
        obj.attachEvent("onpropertychange", onPropertyChange);
 
    }
}
 
var c = document.createElement("SCRIPT");
addProperty(Element.prototype, "__src__", 
        function(){
            alert(this.src);
        }, 
        function(val){
            this.src=val;
        }
);

c.__src__ = "./t.js";
c.__src__;
