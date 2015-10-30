window.hydra = {};

if (!DOMParser) {
	window.DOMParser = function () {};
	DOMParser.prototype.parseFromString = function (markup, type) {
		if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
			var doc = document.implementation.createHTMLDocument("");
			if (markup.toLowerCase().indexOf('<!doctype') > -1) {
				doc.documentElement.innerHTML = markup;
			} else {
				doc.body.innerHTML = markup;
			}
			return doc;
		}
	};
}

var _ = (function () {
	var _ = {};
	_.loadCache = {};
	_.uid = 0;

	//isFunction
	if (typeof (/./) !== 'function') {
		_.isFunction = function (obj) {
			return typeof obj === 'function';
		};
	}
	//isObject
	_.isObject = function (obj) {
		return obj === Object(obj);
	};
	//isArray
	_.isArray = function (obj) {
		if (obj.length !== undefined) {
			return true;
		} else {
			return toString.call(obj) == '[object Array]';
		}
	};
	_.isEmptyObject = function (obj) {
		if (obj == null) return true;
		for (var key in obj)
			if (_.has(obj, key)) return false;
		return true;
	};
	//trim
	_.trim = function (str) {
		if (!str) return '';
		return str.replace(/^\s*|\s*$/g, '');
	};
	_.has = function (obj, key) {
		return obj != null && Object.prototype.hasOwnProperty.call(obj, key);
	};
	_.keys = function (obj) {
		if (!_.isObject(obj)) return [];
		if (Object.keys) return Object.keys(obj);
		var keys = [];
		for (var key in obj)
			if (_.has(obj, key)) keys.push(key);
		return keys;
	};
	//each
	_.each = function (obj, iterator, context) {
		if (obj == null) return obj;
		if (obj.length === +obj.length) {
			for (var i = 0, length = obj.length; i < length; i++) {
				if (iterator.call(context, i, obj[i], obj)) return;
			}
		} else {
			var keys = _.keys(obj);
			for (var i = 0, length = keys.length; i < length; i++) {
				if (iterator.call(context, keys[i], obj[keys[i]], obj)) return;
			}
		}
		return obj;
	};
	//extend
	_.extend = function (obj) {
		if (!_.isObject(obj)) return obj;
		_.each(Array.prototype.slice.call(arguments, 1), function (i, source) {
			for (var prop in source) {
				obj[prop] = source[prop];
			}
		});
		return obj;
	};
	_.copy = function (obj) {
		if (!_.isObject(obj)) return obj;
		_.each(Array.prototype.slice.call(arguments, 1), function (i, source) {
			for (var prop in source) {
				obj.prototype[prop] = source[prop];
			}
		});
		return obj;
	};
	//clone
	_.clone = function (obj) {
		if (!_.isObject(obj)) return obj;
		return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
	};
	_.param = function (obj) {
		var temp = [];
		_.each(obj, function (key, item) {
			temp.push(key + '=' + encodeURIComponent(item));
		});
		return temp.join('&');
	};
	_.md5 = function (n) {
		var nc = n || 3,
			i = 0,
			v = '';
		for (; i < nc; i++) {
			v += Math.floor(Math.random() * 65535).toString(32) + _.uuid();
		}
		return v;
	};
	_.uuid = function () {
		return ++_.uid;
	};
	_.render = function (template, data, func) {
		return template.replace(/\{\{(.*?)\}\}/g, function (s0, s1) {
			if (_.isFunction(func)) {
				return func(s1, data);
			} else {
				var key, val, filter;
				if (s1.indexOf('|') > 0) {
					var parts = s1.split('|');
					key = _.trim(parts[0]),
						filter = _.trim(parts[1]);
				} else {
					key = _.trim(s1);
				}
				var ks;
				if (key.indexOf('.') != -1) {
					var ks = key.split('.');
					var val = data[ks[0]];
					_.each(ks, function (i, k) {
						i > 0 && val && (val = val[k]);
					});
				} else {
					val = data[key];
				}
				if (filter) {
					var mat = filter.match(/\s*in(\{.*?\})/);
					if (mat && mat.length > 1) {
						var json = (new Function("", "return " + mat[1]))();
						json && (val = json[val] ? json[val] : '');
					} else {
						if (func.filter && func.filter[filter]) {
							val = func.filter[filter](val);
						} else {
							console.error('filter[' + filter + '] not exist');
						}
					}
				}
				return val;
			}
		});
	};
	_.recurse = function (node, fn) {
		var children = node.children;
		if (children.length > 0) {
			_.each(children, function (idx, child) {
				if (child.nodeType == 1) {
					fn(child);
					_.recurse(child, fn);
				}
			});
		}
	};
	_.upFirstLetter = function (word) {
		return word.replace(/(\w)/, function (s0) {
			return s0.toUpperCase();
		});
	};
	_.downFirstLetter = function (word) {
		return word.replace(/(\w)/, function (s0) {
			return s0.toLowerCase();
		});
	};
	_.loadCss = function (path) {
		if (path) {
			if (_.loadCache[path]) return;
			_.loadCache[path] = true;
			var head = document.getElementsByTagName('head')[0];
			var link = document.createElement('link');
			link.href = path;
			link.rel = 'stylesheet';
			link.type = 'text/css';
			head.appendChild(link);
		}
	};
	_.loadJs = function (path, fn, error) {
		if (_.loadCache[path]) {
			fn && fn();
			return;
		}
		_.loadCache[path] = true;
		var head = document.getElementsByTagName('head')[0];
		var script = document.createElement('script');
		// script.onreadystatechange = function () {
		// 	if (this.readyState == 'complete') {
		// 		fn && fn();
		// 	}
		// }
		script.onload = function () {
			fn && fn();
		};
		script.onerror = function () {
			error && error();
		};
		script.type = 'text/javascript';
		script.src = path;
		head.appendChild(script);
		return script;
	};
	_.runJs = function (path, fn, error) {
		if (_.loadCache[path]) return;
		_.loadCache[path] = true;
		var head = document.getElementsByTagName('head')[0];
		var script = document.createElement('script');
		// script.onreadystatechange = function () {
		// 	if (this.readyState == 'complete') {
		// 		fn && fn();
		// 	}
		// }
		script.onload = function () {
			fn && fn();
		};
		script.onerror = function () {
			error && error();
		};
		script.type = 'text/javascript';
		script.src = path;
		head.appendChild(script);
		return script;
	};
	_.ajax = (function () {
		function send(url, method, params, postData, cb) {
			var xhr = null;
			if (window.XMLHttpRequest) {
				xhr = new XMLHttpRequest();
			} else if (window.ActiveXObject) {
				xhr = new ActiveXObject("Microsoft.XMLHTTP");
			}
			if (xhr != null) {
				var fullUrl = url,
					urlParam = _.param(params);
				if (urlParam) {
					fullUrl = url + '?' + urlParam;
				}
				xhr.open(method, fullUrl, true);
				xhr.onreadystatechange = function () {
					if (xhr.readyState == 4) {
						if (xhr.status == 200) {
							var data = xhr.responseText;
							cb && cb(data);
						}
					}
				}
			}
			var body;
			if (postData) {
				var bodies = [];
				for (var name in postData) {
					bodies.push(name + '=' + encodeURIComponent(postData[name]));
				}
				body = bodies.join('&');
				if (body.length) {
					xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				}
			}
			xhr.send(body);
		}
		return {
			get: function (url, params, cb) {
				send(url, 'GET', params, null, cb);
			},
			post: function (url, params, postData, cb) {
				send(url, 'POST', params, postData, cb);
			}
		};
	})();
	return _;
})();
/*--------------------------------------------------------*/
var DomEvent = {
	on: function (evtName, element, listener, capture) {
		var evt = '',
			useCapture = (capture === undefined) ? true : capture,
			handler = null;
		if (window.addEventListener === undefined) {
			evt = 'on' + evtName;
			handler = function (evt, listener) {
				element.attachEvent(evt, listener);
				return listener;
			};
		} else {
			evt = evtName;
			handler = function (evt, listener, useCapture) {
				element.addEventListener(evt, listener, useCapture);
				return listener;
			};
		}
		return handler.apply(element, [evt, function (ev) {
			var e = ev || event,
				src = e.srcElement || e.target;
			listener(e, src);
		}, useCapture]);
	},
	delegate: function (element, selector, event, callback) {
		var me = this;
		if (!me._events) {
			me._events = {};
		}
		var capture = false;
		if (event == 'blur' || event == 'focus') {
			event = event == 'blur' ? 'focusout' : event == 'focus' ? 'focusin' : event
		}
		if (!me._events[event]) {
			me._events[event] = [{
				selector: selector,
				fn: callback
			}];
			element.addEventListener(event, function (e) {
				var de = me._events[event];
				var tar = e.target;
				for (var i = 0, len = de.length; i < len; i++) {
					var item = de[i];
					var all = element.querySelectorAll(item.selector);
					if (all) {
						for (var j = 0, l = all.length; j < l; j++) {
							var se = all[j];
							if (se === tar || se.contains(tar)) {
								e.currentTarget = se;
								item.fn.call(se, e);
								return;
							}
						}
					}
				}
			}, capture);
		} else {
			me._events[event].push({
				selector: selector,
				fn: callback
			});
		}
	},
	off: function (evtName, element, listener, capture) {
		var evt = '',
			useCapture = (capture === undefined) ? true : capture;
		if (window.removeEventListener === undefined) {
			evt = 'on' + evtName;
			// element.detachEvent(evt, listener);
			element[evt] = null;
		} else {
			evt = evtName;
			element.removeEventListener(evt, listener, useCapture);
		}
	},
	stopPropagation: function (evt) {
		evt.cancelBubble = true;
		if (evt.stopPropagation) {
			evt.stopPropagation();
		}
	},
	preventDefault: function (evt) {
		if (evt.preventDefault) {
			evt.preventDefault();
		} else {
			evt.returnValue = false;
		}
	},
	swipeLeft: function (elem, handler) {
		this.swipe(elem, function (e, fixEvent) {
			if (fixEvent.direction === DIR.LEFT) {
				handler.apply(this, arguments);
			}
		});
	},
	swipe: function (elem, handler) {
		startTrack();
		var isFired = false;
		var swipDir = DIR.NONE;
		dispatcher.on('touchstart', function () {
			isFired = false;
		});
		this.on(elem, 'touchmove', function (e, fixEvent) {
			if (isFired || (Math.abs(fixEvent.xSpeed) < 1 && Math.abs(fixEvent.ySpeed) < 1)) {
				return;
			}
			fixEvent.direction = getDirectionFromXY(fixEvent.dx, fixEvent.dy);
			handler.apply(this, arguments);
			isFired = true;
		});
	},
	swipeRight: function (elem, handler) {
		this.swipe(elem, function (e, fixEvent) {
			if (fixEvent.direction === DIR.LEFT) {
				handler.apply(this, arguments);
			}
		});
	},
	swipeTop: function (elem, handler) {
		this.swipe(elem, function (e, fixEvent) {
			if (fixEvent.direction === DIR.TOP) {
				handler.apply(this, arguments);
			}
		});
	},
	swipeBottom: function (elem, handler) {
		this.swipe(elem, function (e, fixEvent) {
			if (fixEvent.direction === DIR.BOTTOM) {
				handler.apply(this, arguments);
			}
		});
	}
};


var Event = {
	on: function (eventType, func) {
		if (!this._events) {
			this._events = {};
		}
		this._events[eventType] = func;
	},
	off: function (eventType) {
		delete this._events[eventType];
	},
	dispatchEvent: function () {
		var args = Array.prototype.slice.call(arguments, 1);
		var eventType = arguments[0];
		if (eventType && this._events) {
			var handler = this._events[eventType];
			handler && handler.apply(this, _.isArray(args) ? args : [args]);
		}
	}
};

var EventPipe = {
	pipe: function (pipeName) {
		var me = this;
		if (!me._eventPips) {
			me._eventPips = {};
		}
		if (!me._eventPips[pipeName]) {
			me._eventPips[pipeName] = [];
		}
		var p = me._eventPips[pipeName];

		return {
			receive: function (obj) {
				for (var k in obj) {
					p.push({
						eventType: k,
						func: obj[k],
						level: 5
					});
				}
				// p.sort(function (i1, i2) {
				// 	return LEVEL[i2.level] - LEVEL[i1.level];
				// });
			},
			write: function (k) {
				var args = Array.prototype.slice.call(arguments, 1);
				p.forEach(function (item, i) {
					if (item.eventType == k) {
						item.func.apply(me, args);
					}
				});
			}
		};
	}
};


/*--------------------------------------------------------*/

function LRUCache(size) {
	this.size = size || 50;
	this.cache = [];
	this.map = {};
}

LRUCache.prototype.add = function (path, file) {
	if (this.map[path] !== undefined) {
		var idx = this.map[path];
		var item = this.cache.splice(idx, 1);
		this.cache.unshift(item);
		this.map[path] = 0;
	} else {
		if (this.cache.length >= this.size) {
			this.cache[thi.size - 1] = file;
			this.map[path] = thi.size - 1;
		} else {
			this.cache.push(file);
			this.map[path] = this.cache.length - 1;
		}
	}
};

LRUCache.prototype.get = function (path) {
	if (this.map[path]) {
		return this.cache[this.map[path]];
	}
};;! function (e) {
    if ("object" == typeof exports && "undefined" != typeof module) module.exports = e();
    else if ("function" == typeof define && define.amd) define([], e);
    else {
        var f;
        "undefined" != typeof window ? f = window : "undefined" != typeof global ? f = global : "undefined" != typeof self && (f = self), f.virtualDom = e()
    }
}(function () {
    var define, module, exports;
    return (function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == "function" && require;
                    if (!u && a) return a(o, !0);
                    if (i) return i(o, !0);
                    var f = new Error("Cannot find module '" + o + "'");
                    throw f.code = "MODULE_NOT_FOUND", f
                }
                var l = n[o] = {
                    exports: {}
                };
                t[o][0].call(l.exports, function (e) {
                    var n = t[o][1][e];
                    return s(n ? n : e)
                }, l, l.exports, e, t, n, r)
            }
            return n[o].exports
        }
        var i = typeof require == "function" && require;
        for (var o = 0; o < r.length; o++) s(r[o]);
        return s
    })({
        1: [function (require, module, exports) {
            var createElement = require("./vdom/create-element.js")

            module.exports = createElement

        }, {
            "./vdom/create-element.js": 15
        }],
        2: [function (require, module, exports) {
            var diff = require("./vtree/diff.js")

            module.exports = diff

        }, {
            "./vtree/diff.js": 35
        }],
        3: [function (require, module, exports) {
            var h = require("./virtual-hyperscript/index.js")

            module.exports = h

        }, {
            "./virtual-hyperscript/index.js": 22
        }],
        4: [function (require, module, exports) {
            var diff = require("./diff.js")
            var patch = require("./patch.js")
            var h = require("./h.js")
            var create = require("./create-element.js")
            var VNode = require('./vnode/vnode.js')
            var VText = require('./vnode/vtext.js')

            module.exports = {
                diff: diff,
                patch: patch,
                h: h,
                create: create,
                VNode: VNode,
                VText: VText
            }

        }, {
            "./create-element.js": 1,
            "./diff.js": 2,
            "./h.js": 3,
            "./patch.js": 13,
            "./vnode/vnode.js": 31,
            "./vnode/vtext.js": 33
        }],
        5: [function (require, module, exports) {
            /*!
             * Cross-Browser Split 1.1.1
             * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
             * Available under the MIT License
             * ECMAScript compliant, uniform cross-browser split method
             */

            /**
             * Splits a string into an array of strings using a regex or string separator. Matches of the
             * separator are not included in the result array. However, if `separator` is a regex that contains
             * capturing groups, backreferences are spliced into the result each time `separator` is matched.
             * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
             * cross-browser.
             * @param {String} str String to split.
             * @param {RegExp|String} separator Regex or string to use for separating the string.
             * @param {Number} [limit] Maximum number of items to include in the result array.
             * @returns {Array} Array of substrings.
             * @example
             *
             * // Basic use
             * split('a b c d', ' ');
             * // -> ['a', 'b', 'c', 'd']
             *
             * // With limit
             * split('a b c d', ' ', 2);
             * // -> ['a', 'b']
             *
             * // Backreferences in result array
             * split('..word1 word2..', /([a-z]+)(\d+)/i);
             * // -> ['..', 'word', '1', ' ', 'word', '2', '..']
             */
            module.exports = (function split(undef) {

                var nativeSplit = String.prototype.split,
                    compliantExecNpcg = /()??/.exec("")[1] === undef,
                    // NPCG: nonparticipating capturing group
                    self;

                self = function (str, separator, limit) {
                    // If `separator` is not a regex, use `nativeSplit`
                    if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
                        return nativeSplit.call(str, separator, limit);
                    }
                    var output = [],
                        flags = (separator.ignoreCase ? "i" : "") + (separator.multiline ? "m" : "") + (separator.extended ? "x" : "") + // Proposed for ES6
                        (separator.sticky ? "y" : ""),
                        // Firefox 3+
                        lastLastIndex = 0,
                        // Make `global` and avoid `lastIndex` issues by working with a copy
                        separator = new RegExp(separator.source, flags + "g"),
                        separator2, match, lastIndex, lastLength;
                    str += ""; // Type-convert
                    if (!compliantExecNpcg) {
                        // Doesn't need flags gy, but they don't hurt
                        separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
                    }
                    /* Values for `limit`, per the spec:
                     * If undefined: 4294967295 // Math.pow(2, 32) - 1
                     * If 0, Infinity, or NaN: 0
                     * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
                     * If negative number: 4294967296 - Math.floor(Math.abs(limit))
                     * If other: Type-convert, then use the above rules
                     */
                    limit = limit === undef ? -1 >>> 0 : // Math.pow(2, 32) - 1
                        limit >>> 0; // ToUint32(limit)
                    while (match = separator.exec(str)) {
                        // `separator.lastIndex` is not reliable cross-browser
                        lastIndex = match.index + match[0].length;
                        if (lastIndex > lastLastIndex) {
                            output.push(str.slice(lastLastIndex, match.index));
                            // Fix browsers whose `exec` methods don't consistently return `undefined` for
                            // nonparticipating capturing groups
                            if (!compliantExecNpcg && match.length > 1) {
                                match[0].replace(separator2, function () {
                                    for (var i = 1; i < arguments.length - 2; i++) {
                                        if (arguments[i] === undef) {
                                            match[i] = undef;
                                        }
                                    }
                                });
                            }
                            if (match.length > 1 && match.index < str.length) {
                                Array.prototype.push.apply(output, match.slice(1));
                            }
                            lastLength = match[0].length;
                            lastLastIndex = lastIndex;
                            if (output.length >= limit) {
                                break;
                            }
                        }
                        if (separator.lastIndex === match.index) {
                            separator.lastIndex++; // Avoid an infinite loop
                        }
                    }
                    if (lastLastIndex === str.length) {
                        if (lastLength || !separator.test("")) {
                            output.push("");
                        }
                    } else {
                        output.push(str.slice(lastLastIndex));
                    }
                    return output.length > limit ? output.slice(0, limit) : output;
                };

                return self;
            })();

        }, {}],
        6: [function (require, module, exports) {

        }, {}],
        7: [function (require, module, exports) {
            'use strict';

            var OneVersionConstraint = require('individual/one-version');

            var MY_VERSION = '7';
            OneVersionConstraint('ev-store', MY_VERSION);

            var hashKey = '__EV_STORE_KEY@' + MY_VERSION;

            module.exports = EvStore;

            function EvStore(elem) {
                var hash = elem[hashKey];

                if (!hash) {
                    hash = elem[hashKey] = {};
                }

                return hash;
            }

        }, {
            "individual/one-version": 9
        }],
        8: [function (require, module, exports) {
            (function (global) {
                'use strict';

                /*global window, global*/

                var root = typeof window !== 'undefined' ?
                    window : typeof global !== 'undefined' ?
                    global : {};

                module.exports = Individual;

                function Individual(key, value) {
                    if (key in root) {
                        return root[key];
                    }

                    root[key] = value;

                    return value;
                }

            }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
        }, {}],
        9: [function (require, module, exports) {
            'use strict';

            var Individual = require('./index.js');

            module.exports = OneVersion;

            function OneVersion(moduleName, version, defaultValue) {
                var key = '__INDIVIDUAL_ONE_VERSION_' + moduleName;
                var enforceKey = key + '_ENFORCE_SINGLETON';

                var versionValue = Individual(enforceKey, version);

                if (versionValue !== version) {
                    throw new Error('Can only have one copy of ' +
                        moduleName + '.\n' +
                        'You already have version ' + versionValue +
                        ' installed.\n' +
                        'This means you cannot install version ' + version);
                }

                return Individual(key, defaultValue);
            }

        }, {
            "./index.js": 8
        }],
        10: [function (require, module, exports) {
            (function (global) {
                var topLevel = typeof global !== 'undefined' ? global :
                    typeof window !== 'undefined' ? window : {}
                var minDoc = require('min-document');

                if (typeof document !== 'undefined') {
                    module.exports = document;
                } else {
                    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

                    if (!doccy) {
                        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
                    }

                    module.exports = doccy;
                }

            }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
        }, {
            "min-document": 6
        }],
        11: [function (require, module, exports) {
            "use strict";

            module.exports = function isObject(x) {
                return typeof x === "object" && x !== null;
            };

        }, {}],
        12: [function (require, module, exports) {
            var nativeIsArray = Array.isArray
            var toString = Object.prototype.toString

            module.exports = nativeIsArray || isArray

            function isArray(obj) {
                return toString.call(obj) === "[object Array]"
            }

        }, {}],
        13: [function (require, module, exports) {
            var patch = require("./vdom/patch.js")

            module.exports = patch

        }, {
            "./vdom/patch.js": 18
        }],
        14: [function (require, module, exports) {
            var isObject = require("is-object")
            var isHook = require("../vnode/is-vhook.js")

            module.exports = applyProperties

            function applyProperties(node, props, previous) {
                for (var propName in props) {
                    var propValue = props[propName]

                    if (propValue === undefined) {
                        removeProperty(node, propName, propValue, previous);
                    } else if (isHook(propValue)) {
                        removeProperty(node, propName, propValue, previous)
                        if (propValue.hook) {
                            propValue.hook(node,
                                propName,
                                previous ? previous[propName] : undefined)
                        }
                    } else {
                        if (isObject(propValue)) {
                            patchObject(node, props, previous, propName, propValue);
                        } else {
                            node[propName] = propValue
                        }
                    }
                }
            }

            function removeProperty(node, propName, propValue, previous) {
                if (previous) {
                    var previousValue = previous[propName]

                    if (!isHook(previousValue)) {
                        if (propName === "attributes") {
                            for (var attrName in previousValue) {
                                node.removeAttribute(attrName)
                            }
                        } else if (propName === "style") {
                            for (var i in previousValue) {
                                node.style[i] = ""
                            }
                        } else if (typeof previousValue === "string") {
                            node[propName] = ""
                        } else {
                            node[propName] = null
                        }
                    } else if (previousValue.unhook) {
                        previousValue.unhook(node, propName, propValue)
                    }
                }
            }

            function patchObject(node, props, previous, propName, propValue) {
                var previousValue = previous ? previous[propName] : undefined

                // Set attributes
                if (propName === "attributes") {
                    for (var attrName in propValue) {
                        var attrValue = propValue[attrName]

                        if (attrValue === undefined) {
                            node.removeAttribute(attrName)
                        } else {
                            node.setAttribute(attrName, attrValue)
                        }
                    }

                    return
                }

                if (previousValue && isObject(previousValue) &&
                    getPrototype(previousValue) !== getPrototype(propValue)) {
                    node[propName] = propValue
                    return
                }

                if (!isObject(node[propName])) {
                    node[propName] = {}
                }

                var replacer = propName === "style" ? "" : undefined

                for (var k in propValue) {
                    var value = propValue[k]
                    node[propName][k] = (value === undefined) ? replacer : value
                }
            }

            function getPrototype(value) {
                if (Object.getPrototypeOf) {
                    return Object.getPrototypeOf(value)
                } else if (value.__proto__) {
                    return value.__proto__
                } else if (value.constructor) {
                    return value.constructor.prototype
                }
            }

        }, {
            "../vnode/is-vhook.js": 26,
            "is-object": 11
        }],
        15: [function (require, module, exports) {
            var document = require("global/document")

            var applyProperties = require("./apply-properties")

            var isVNode = require("../vnode/is-vnode.js")
            var isVText = require("../vnode/is-vtext.js")
            var isWidget = require("../vnode/is-widget.js")
            var handleThunk = require("../vnode/handle-thunk.js")

            module.exports = createElement

            function createElement(vnode, opts) {
                var doc = opts ? opts.document || document : document
                var warn = opts ? opts.warn : null

                vnode = handleThunk(vnode).a

                if (isWidget(vnode)) {
                    return vnode.init()
                } else if (isVText(vnode)) {
                    return doc.createTextNode(vnode.text)
                } else if (!isVNode(vnode)) {
                    if (warn) {
                        warn("Item is not a valid virtual dom node", vnode)
                    }
                    return null
                }

                var node = (vnode.namespace === null) ?
                    doc.createElement(vnode.tagName) :
                    doc.createElementNS(vnode.namespace, vnode.tagName)

                var props = vnode.properties
                applyProperties(node, props)

                var children = vnode.children

                for (var i = 0; i < children.length; i++) {
                    var childNode = createElement(children[i], opts)
                    if (childNode) {
                        node.appendChild(childNode)
                    }
                }

                return node
            }

        }, {
            "../vnode/handle-thunk.js": 24,
            "../vnode/is-vnode.js": 27,
            "../vnode/is-vtext.js": 28,
            "../vnode/is-widget.js": 29,
            "./apply-properties": 14,
            "global/document": 10
        }],
        16: [function (require, module, exports) {
            // Maps a virtual DOM tree onto a real DOM tree in an efficient manner.
            // We don't want to read all of the DOM nodes in the tree so we use
            // the in-order tree indexing to eliminate recursion down certain branches.
            // We only recurse into a DOM node if we know that it contains a child of
            // interest.

            var noChild = {}

            module.exports = domIndex

            function domIndex(rootNode, tree, indices, nodes) {
                if (!indices || indices.length === 0) {
                    return {}
                } else {
                    indices.sort(ascending)
                    return recurse(rootNode, tree, indices, nodes, 0)
                }
            }

            function recurse(rootNode, tree, indices, nodes, rootIndex) {
                nodes = nodes || {}


                if (rootNode) {
                    if (indexInRange(indices, rootIndex, rootIndex)) {
                        nodes[rootIndex] = rootNode
                    }

                    var vChildren = tree.children

                    if (vChildren) {

                        var childNodes = rootNode.childNodes

                        for (var i = 0; i < tree.children.length; i++) {
                            rootIndex += 1

                            var vChild = vChildren[i] || noChild
                            var nextIndex = rootIndex + (vChild.count || 0)

                            // skip recursion down the tree if there are no nodes down here
                            if (indexInRange(indices, rootIndex, nextIndex)) {
                                recurse(childNodes[i], vChild, indices, nodes, rootIndex)
                            }

                            rootIndex = nextIndex
                        }
                    }
                }

                return nodes
            }

            // Binary search for an index in the interval [left, right]
            function indexInRange(indices, left, right) {
                if (indices.length === 0) {
                    return false
                }

                var minIndex = 0
                var maxIndex = indices.length - 1
                var currentIndex
                var currentItem

                while (minIndex <= maxIndex) {
                    currentIndex = ((maxIndex + minIndex) / 2) >> 0
                    currentItem = indices[currentIndex]

                    if (minIndex === maxIndex) {
                        return currentItem >= left && currentItem <= right
                    } else if (currentItem < left) {
                        minIndex = currentIndex + 1
                    } else if (currentItem > right) {
                        maxIndex = currentIndex - 1
                    } else {
                        return true
                    }
                }

                return false;
            }

            function ascending(a, b) {
                return a > b ? 1 : -1
            }

        }, {}],
        17: [function (require, module, exports) {
            var applyProperties = require("./apply-properties")

            var isWidget = require("../vnode/is-widget.js")
            var VPatch = require("../vnode/vpatch.js")

            var updateWidget = require("./update-widget")

            module.exports = applyPatch

            function applyPatch(vpatch, domNode, renderOptions) {
                var type = vpatch.type
                var vNode = vpatch.vNode
                var patch = vpatch.patch

                switch (type) {
                    case VPatch.REMOVE:
                        return removeNode(domNode, vNode)
                    case VPatch.INSERT:
                        return insertNode(domNode, patch, renderOptions)
                    case VPatch.VTEXT:
                        return stringPatch(domNode, vNode, patch, renderOptions)
                    case VPatch.WIDGET:
                        return widgetPatch(domNode, vNode, patch, renderOptions)
                    case VPatch.VNODE:
                        return vNodePatch(domNode, vNode, patch, renderOptions)
                    case VPatch.ORDER:
                        reorderChildren(domNode, patch)
                        return domNode
                    case VPatch.PROPS:
                        applyProperties(domNode, patch, vNode.properties)
                        return domNode
                    case VPatch.THUNK:
                        return replaceRoot(domNode,
                            renderOptions.patch(domNode, patch, renderOptions))
                    default:
                        return domNode
                }
            }

            function removeNode(domNode, vNode) {
                var parentNode = domNode.parentNode

                if (parentNode) {
                    parentNode.removeChild(domNode)
                }

                destroyWidget(domNode, vNode);

                return null
            }

            function insertNode(parentNode, vNode, renderOptions) {
                var newNode = renderOptions.render(vNode, renderOptions)

                if (parentNode) {
                    parentNode.appendChild(newNode)
                }

                return parentNode
            }

            function stringPatch(domNode, leftVNode, vText, renderOptions) {
                var newNode

                if (domNode.nodeType === 3) {
                    domNode.replaceData(0, domNode.length, vText.text)
                    newNode = domNode
                } else {
                    var parentNode = domNode.parentNode
                    newNode = renderOptions.render(vText, renderOptions)

                    if (parentNode && newNode !== domNode) {
                        parentNode.replaceChild(newNode, domNode)
                    }
                }

                return newNode
            }

            function widgetPatch(domNode, leftVNode, widget, renderOptions) {
                var updating = updateWidget(leftVNode, widget)
                var newNode

                if (updating) {
                    newNode = widget.update(leftVNode, domNode) || domNode
                } else {
                    newNode = renderOptions.render(widget, renderOptions)
                }

                var parentNode = domNode.parentNode

                if (parentNode && newNode !== domNode) {
                    parentNode.replaceChild(newNode, domNode)
                }

                if (!updating) {
                    destroyWidget(domNode, leftVNode)
                }

                return newNode
            }

            function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
                var parentNode = domNode.parentNode
                var newNode = renderOptions.render(vNode, renderOptions)

                if (parentNode && newNode !== domNode) {
                    parentNode.replaceChild(newNode, domNode)
                }

                return newNode
            }

            function destroyWidget(domNode, w) {
                if (typeof w.destroy === "function" && isWidget(w)) {
                    w.destroy(domNode)
                }
            }

            function reorderChildren(domNode, moves) {
                var childNodes = domNode.childNodes
                var keyMap = {}
                var node
                var remove
                var insert

                for (var i = 0; i < moves.removes.length; i++) {
                    remove = moves.removes[i]
                    node = childNodes[remove.from]
                    if (remove.key) {
                        keyMap[remove.key] = node
                    }
                    domNode.removeChild(node)
                }

                var length = childNodes.length
                for (var j = 0; j < moves.inserts.length; j++) {
                    insert = moves.inserts[j]
                    node = keyMap[insert.key]
                        // this is the weirdest bug i've ever seen in webkit
                    domNode.insertBefore(node, insert.to >= length++ ? null : childNodes[insert.to])
                }
            }

            function replaceRoot(oldRoot, newRoot) {
                if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
                    oldRoot.parentNode.replaceChild(newRoot, oldRoot)
                }

                return newRoot;
            }

        }, {
            "../vnode/is-widget.js": 29,
            "../vnode/vpatch.js": 32,
            "./apply-properties": 14,
            "./update-widget": 19
        }],
        18: [function (require, module, exports) {
            var document = require("global/document")
            var isArray = require("x-is-array")

            var render = require("./create-element")
            var domIndex = require("./dom-index")
            var patchOp = require("./patch-op")
            module.exports = patch

            function patch(rootNode, patches, renderOptions) {
                renderOptions = renderOptions || {}
                renderOptions.patch = renderOptions.patch && renderOptions.patch !== patch ? renderOptions.patch : patchRecursive
                renderOptions.render = renderOptions.render || render

                return renderOptions.patch(rootNode, patches, renderOptions)
            }

            function patchRecursive(rootNode, patches, renderOptions) {
                var indices = patchIndices(patches)

                if (indices.length === 0) {
                    return rootNode
                }

                var index = domIndex(rootNode, patches.a, indices)
                var ownerDocument = rootNode.ownerDocument

                if (!renderOptions.document && ownerDocument !== document) {
                    renderOptions.document = ownerDocument
                }

                for (var i = 0; i < indices.length; i++) {
                    var nodeIndex = indices[i]
                    rootNode = applyPatch(rootNode,
                        index[nodeIndex],
                        patches[nodeIndex],
                        renderOptions)
                }

                return rootNode
            }

            function applyPatch(rootNode, domNode, patchList, renderOptions) {
                if (!domNode) {
                    return rootNode
                }

                var newNode

                if (isArray(patchList)) {
                    for (var i = 0; i < patchList.length; i++) {
                        newNode = patchOp(patchList[i], domNode, renderOptions)

                        if (domNode === rootNode) {
                            rootNode = newNode
                        }
                    }
                } else {
                    newNode = patchOp(patchList, domNode, renderOptions)

                    if (domNode === rootNode) {
                        rootNode = newNode
                    }
                }

                return rootNode
            }

            function patchIndices(patches) {
                var indices = []

                for (var key in patches) {
                    if (key !== "a") {
                        indices.push(Number(key))
                    }
                }

                return indices
            }

        }, {
            "./create-element": 15,
            "./dom-index": 16,
            "./patch-op": 17,
            "global/document": 10,
            "x-is-array": 12
        }],
        19: [function (require, module, exports) {
            var isWidget = require("../vnode/is-widget.js")

            module.exports = updateWidget

            function updateWidget(a, b) {
                if (isWidget(a) && isWidget(b)) {
                    if ("name" in a && "name" in b) {
                        return a.id === b.id
                    } else {
                        return a.init === b.init
                    }
                }

                return false
            }

        }, {
            "../vnode/is-widget.js": 29
        }],
        20: [function (require, module, exports) {
            'use strict';

            var EvStore = require('ev-store');

            module.exports = EvHook;

            function EvHook(value) {
                if (!(this instanceof EvHook)) {
                    return new EvHook(value);
                }

                this.value = value;
            }

            EvHook.prototype.hook = function (node, propertyName) {
                var es = EvStore(node);
                var propName = propertyName.substr(3);

                es[propName] = this.value;
            };

            EvHook.prototype.unhook = function (node, propertyName) {
                var es = EvStore(node);
                var propName = propertyName.substr(3);

                es[propName] = undefined;
            };

        }, {
            "ev-store": 7
        }],
        21: [function (require, module, exports) {
            'use strict';

            module.exports = SoftSetHook;

            function SoftSetHook(value) {
                if (!(this instanceof SoftSetHook)) {
                    return new SoftSetHook(value);
                }

                this.value = value;
            }

            SoftSetHook.prototype.hook = function (node, propertyName) {
                if (node[propertyName] !== this.value) {
                    node[propertyName] = this.value;
                }
            };

        }, {}],
        22: [function (require, module, exports) {
            'use strict';

            var isArray = require('x-is-array');

            var VNode = require('../vnode/vnode.js');
            var VText = require('../vnode/vtext.js');
            var isVNode = require('../vnode/is-vnode');
            var isVText = require('../vnode/is-vtext');
            var isWidget = require('../vnode/is-widget');
            var isHook = require('../vnode/is-vhook');
            var isVThunk = require('../vnode/is-thunk');

            var parseTag = require('./parse-tag.js');
            var softSetHook = require('./hooks/soft-set-hook.js');
            var evHook = require('./hooks/ev-hook.js');

            module.exports = h;

            function h(tagName, properties, children) {
                var childNodes = [];
                var tag, props, key, namespace;

                if (!children && isChildren(properties)) {
                    children = properties;
                    props = {};
                }

                props = props || properties || {};
                tag = parseTag(tagName, props);

                // support keys
                if (props.hasOwnProperty('key')) {
                    key = props.key;
                    props.key = undefined;
                }

                // support namespace
                if (props.hasOwnProperty('namespace')) {
                    namespace = props.namespace;
                    props.namespace = undefined;
                }

                // fix cursor bug
                if (tag === 'INPUT' &&
                    !namespace &&
                    props.hasOwnProperty('value') &&
                    props.value !== undefined &&
                    !isHook(props.value)
                ) {
                    props.value = softSetHook(props.value);
                }

                transformProperties(props);

                if (children !== undefined && children !== null) {
                    addChild(children, childNodes, tag, props);
                }


                return new VNode(tag, props, childNodes, key, namespace);
            }

            function addChild(c, childNodes, tag, props) {
                if (typeof c === 'string') {
                    childNodes.push(new VText(c));
                } else if (typeof c === 'number') {
                    childNodes.push(new VText(String(c)));
                } else if (isChild(c)) {
                    childNodes.push(c);
                } else if (isArray(c)) {
                    for (var i = 0; i < c.length; i++) {
                        addChild(c[i], childNodes, tag, props);
                    }
                } else if (c === null || c === undefined) {
                    return;
                } else {
                    throw UnexpectedVirtualElement({
                        foreignObject: c,
                        parentVnode: {
                            tagName: tag,
                            properties: props
                        }
                    });
                }
            }

            function transformProperties(props) {
                for (var propName in props) {
                    if (props.hasOwnProperty(propName)) {
                        var value = props[propName];

                        if (isHook(value)) {
                            continue;
                        }

                        if (propName.substr(0, 3) === 'ev-') {
                            // add ev-foo support
                            props[propName] = evHook(value);
                        }
                    }
                }
            }

            function isChild(x) {
                return isVNode(x) || isVText(x) || isWidget(x) || isVThunk(x);
            }

            function isChildren(x) {
                return typeof x === 'string' || isArray(x) || isChild(x);
            }

            function UnexpectedVirtualElement(data) {
                var err = new Error();

                err.type = 'virtual-hyperscript.unexpected.virtual-element';
                err.message = 'Unexpected virtual child passed to h().\n' +
                    'Expected a VNode / Vthunk / VWidget / string but:\n' +
                    'got:\n' +
                    errorString(data.foreignObject) +
                    '.\n' +
                    'The parent vnode is:\n' +
                    errorString(data.parentVnode)
                '\n' +
                'Suggested fix: change your `h(..., [ ... ])` callsite.';
                err.foreignObject = data.foreignObject;
                err.parentVnode = data.parentVnode;

                return err;
            }

            function errorString(obj) {
                try {
                    return JSON.stringify(obj, null, '    ');
                } catch (e) {
                    return String(obj);
                }
            }

        }, {
            "../vnode/is-thunk": 25,
            "../vnode/is-vhook": 26,
            "../vnode/is-vnode": 27,
            "../vnode/is-vtext": 28,
            "../vnode/is-widget": 29,
            "../vnode/vnode.js": 31,
            "../vnode/vtext.js": 33,
            "./hooks/ev-hook.js": 20,
            "./hooks/soft-set-hook.js": 21,
            "./parse-tag.js": 23,
            "x-is-array": 12
        }],
        23: [function (require, module, exports) {
            'use strict';

            var split = require('browser-split');

            var classIdSplit = /([\.#]?[a-zA-Z0-9\u007F-\uFFFF_:-]+)/;
            var notClassId = /^\.|#/;

            module.exports = parseTag;

            function parseTag(tag, props) {
                if (!tag) {
                    return 'DIV';
                }

                var noId = !(props.hasOwnProperty('id'));

                var tagParts = split(tag, classIdSplit);
                var tagName = null;

                if (notClassId.test(tagParts[1])) {
                    tagName = 'DIV';
                }

                var classes, part, type, i;

                for (i = 0; i < tagParts.length; i++) {
                    part = tagParts[i];

                    if (!part) {
                        continue;
                    }

                    type = part.charAt(0);

                    if (!tagName) {
                        tagName = part;
                    } else if (type === '.') {
                        classes = classes || [];
                        classes.push(part.substring(1, part.length));
                    } else if (type === '#' && noId) {
                        props.id = part.substring(1, part.length);
                    }
                }

                if (classes) {
                    if (props.className) {
                        classes.push(props.className);
                    }

                    props.className = classes.join(' ');
                }

                return props.namespace ? tagName : tagName.toUpperCase();
            }

        }, {
            "browser-split": 5
        }],
        24: [function (require, module, exports) {
            var isVNode = require("./is-vnode")
            var isVText = require("./is-vtext")
            var isWidget = require("./is-widget")
            var isThunk = require("./is-thunk")

            module.exports = handleThunk

            function handleThunk(a, b) {
                var renderedA = a
                var renderedB = b

                if (isThunk(b)) {
                    renderedB = renderThunk(b, a)
                }

                if (isThunk(a)) {
                    renderedA = renderThunk(a, null)
                }

                return {
                    a: renderedA,
                    b: renderedB
                }
            }

            function renderThunk(thunk, previous) {
                var renderedThunk = thunk.vnode

                if (!renderedThunk) {
                    renderedThunk = thunk.vnode = thunk.render(previous)
                }

                if (!(isVNode(renderedThunk) ||
                        isVText(renderedThunk) ||
                        isWidget(renderedThunk))) {
                    throw new Error("thunk did not return a valid node");
                }

                return renderedThunk
            }

        }, {
            "./is-thunk": 25,
            "./is-vnode": 27,
            "./is-vtext": 28,
            "./is-widget": 29
        }],
        25: [function (require, module, exports) {
            module.exports = isThunk

            function isThunk(t) {
                return t && t.type === "Thunk"
            }

        }, {}],
        26: [function (require, module, exports) {
            module.exports = isHook

            function isHook(hook) {
                return hook &&
                    (typeof hook.hook === "function" && !hook.hasOwnProperty("hook") ||
                        typeof hook.unhook === "function" && !hook.hasOwnProperty("unhook"))
            }

        }, {}],
        27: [function (require, module, exports) {
            var version = require("./version")

            module.exports = isVirtualNode

            function isVirtualNode(x) {
                return x && x.type === "VirtualNode" && x.version === version
            }

        }, {
            "./version": 30
        }],
        28: [function (require, module, exports) {
            var version = require("./version")

            module.exports = isVirtualText

            function isVirtualText(x) {
                return x && x.type === "VirtualText" && x.version === version
            }

        }, {
            "./version": 30
        }],
        29: [function (require, module, exports) {
            module.exports = isWidget

            function isWidget(w) {
                return w && w.type === "Widget"
            }

        }, {}],
        30: [function (require, module, exports) {
            module.exports = "2"

        }, {}],
        31: [function (require, module, exports) {
            var version = require("./version")
            var isVNode = require("./is-vnode")
            var isWidget = require("./is-widget")
            var isThunk = require("./is-thunk")
            var isVHook = require("./is-vhook")

            module.exports = VirtualNode

            var noProperties = {}
            var noChildren = []

            function VirtualNode(tagName, properties, children, key, namespace) {
                this.tagName = tagName
                this.properties = properties || noProperties
                this.children = children || noChildren
                this.key = key != null ? String(key) : undefined
                this.namespace = (typeof namespace === "string") ? namespace : null

                var count = (children && children.length) || 0
                var descendants = 0
                var hasWidgets = false
                var hasThunks = false
                var descendantHooks = false
                var hooks

                for (var propName in properties) {
                    if (properties.hasOwnProperty(propName)) {
                        var property = properties[propName]
                        if (isVHook(property) && property.unhook) {
                            if (!hooks) {
                                hooks = {}
                            }

                            hooks[propName] = property
                        }
                    }
                }

                for (var i = 0; i < count; i++) {
                    var child = children[i]
                    if (isVNode(child)) {
                        descendants += child.count || 0

                        if (!hasWidgets && child.hasWidgets) {
                            hasWidgets = true
                        }

                        if (!hasThunks && child.hasThunks) {
                            hasThunks = true
                        }

                        if (!descendantHooks && (child.hooks || child.descendantHooks)) {
                            descendantHooks = true
                        }
                    } else if (!hasWidgets && isWidget(child)) {
                        if (typeof child.destroy === "function") {
                            hasWidgets = true
                        }
                    } else if (!hasThunks && isThunk(child)) {
                        hasThunks = true;
                    }
                }

                this.count = count + descendants
                this.hasWidgets = hasWidgets
                this.hasThunks = hasThunks
                this.hooks = hooks
                this.descendantHooks = descendantHooks
            }

            VirtualNode.prototype.version = version
            VirtualNode.prototype.type = "VirtualNode"

        }, {
            "./is-thunk": 25,
            "./is-vhook": 26,
            "./is-vnode": 27,
            "./is-widget": 29,
            "./version": 30
        }],
        32: [function (require, module, exports) {
            var version = require("./version")

            VirtualPatch.NONE = 0
            VirtualPatch.VTEXT = 1
            VirtualPatch.VNODE = 2
            VirtualPatch.WIDGET = 3
            VirtualPatch.PROPS = 4
            VirtualPatch.ORDER = 5
            VirtualPatch.INSERT = 6
            VirtualPatch.REMOVE = 7
            VirtualPatch.THUNK = 8

            module.exports = VirtualPatch

            function VirtualPatch(type, vNode, patch) {
                this.type = Number(type)
                this.vNode = vNode
                this.patch = patch
            }

            VirtualPatch.prototype.version = version
            VirtualPatch.prototype.type = "VirtualPatch"

        }, {
            "./version": 30
        }],
        33: [function (require, module, exports) {
            var version = require("./version")

            module.exports = VirtualText

            function VirtualText(text) {
                this.text = String(text)
            }

            VirtualText.prototype.version = version
            VirtualText.prototype.type = "VirtualText"

        }, {
            "./version": 30
        }],
        34: [function (require, module, exports) {
            var isObject = require("is-object")
            var isHook = require("../vnode/is-vhook")

            module.exports = diffProps

            function diffProps(a, b) {
                var diff

                for (var aKey in a) {
                    if (!(aKey in b)) {
                        diff = diff || {}
                        diff[aKey] = undefined
                    }

                    var aValue = a[aKey]
                    var bValue = b[aKey]

                    if (aValue === bValue) {
                        continue
                    } else if (isObject(aValue) && isObject(bValue)) {
                        if (getPrototype(bValue) !== getPrototype(aValue)) {
                            diff = diff || {}
                            diff[aKey] = bValue
                        } else if (isHook(bValue)) {
                            diff = diff || {}
                            diff[aKey] = bValue
                        } else {
                            var objectDiff = diffProps(aValue, bValue)
                            if (objectDiff) {
                                diff = diff || {}
                                diff[aKey] = objectDiff
                            }
                        }
                    } else {
                        diff = diff || {}
                        diff[aKey] = bValue
                    }
                }

                for (var bKey in b) {
                    if (!(bKey in a)) {
                        diff = diff || {}
                        diff[bKey] = b[bKey]
                    }
                }

                return diff
            }

            function getPrototype(value) {
                if (Object.getPrototypeOf) {
                    return Object.getPrototypeOf(value)
                } else if (value.__proto__) {
                    return value.__proto__
                } else if (value.constructor) {
                    return value.constructor.prototype
                }
            }

        }, {
            "../vnode/is-vhook": 26,
            "is-object": 11
        }],
        35: [function (require, module, exports) {
            var isArray = require("x-is-array")

            var VPatch = require("../vnode/vpatch")
            var isVNode = require("../vnode/is-vnode")
            var isVText = require("../vnode/is-vtext")
            var isWidget = require("../vnode/is-widget")
            var isThunk = require("../vnode/is-thunk")
            var handleThunk = require("../vnode/handle-thunk")

            var diffProps = require("./diff-props")

            module.exports = diff

            function diff(a, b) {
                var patch = {
                    a: a
                }
                walk(a, b, patch, 0)
                return patch
            }

            function walk(a, b, patch, index) {
                if (a === b) {
                    return
                }

                var apply = patch[index]
                var applyClear = false

                if (isThunk(a) || isThunk(b)) {
                    thunks(a, b, patch, index)
                } else if (b == null) {

                    // If a is a widget we will add a remove patch for it
                    // Otherwise any child widgets/hooks must be destroyed.
                    // This prevents adding two remove patches for a widget.
                    if (!isWidget(a)) {
                        clearState(a, patch, index)
                        apply = patch[index]
                    }

                    apply = appendPatch(apply, new VPatch(VPatch.REMOVE, a, b))
                } else if (isVNode(b)) {
                    if (isVNode(a)) {
                        if (a.tagName === b.tagName &&
                            a.namespace === b.namespace &&
                            a.key === b.key) {
                            var propsPatch = diffProps(a.properties, b.properties)
                            if (propsPatch) {
                                apply = appendPatch(apply,
                                    new VPatch(VPatch.PROPS, a, propsPatch))
                            }
                            apply = diffChildren(a, b, patch, apply, index)
                        } else {
                            apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
                            applyClear = true
                        }
                    } else {
                        apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
                        applyClear = true
                    }
                } else if (isVText(b)) {
                    if (!isVText(a)) {
                        apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
                        applyClear = true
                    } else if (a.text !== b.text) {
                        apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
                    }
                } else if (isWidget(b)) {
                    if (!isWidget(a)) {
                        applyClear = true
                    }

                    apply = appendPatch(apply, new VPatch(VPatch.WIDGET, a, b))
                }

                if (apply) {
                    patch[index] = apply
                }

                if (applyClear) {
                    clearState(a, patch, index)
                }
            }

            function diffChildren(a, b, patch, apply, index) {
                var aChildren = a.children
                var orderedSet = reorder(aChildren, b.children)
                var bChildren = orderedSet.children

                var aLen = aChildren.length
                var bLen = bChildren.length
                var len = aLen > bLen ? aLen : bLen

                for (var i = 0; i < len; i++) {
                    var leftNode = aChildren[i]
                    var rightNode = bChildren[i]
                    index += 1

                    if (!leftNode) {
                        if (rightNode) {
                            // Excess nodes in b need to be added
                            apply = appendPatch(apply,
                                new VPatch(VPatch.INSERT, null, rightNode))
                        }
                    } else {
                        walk(leftNode, rightNode, patch, index)
                    }

                    if (isVNode(leftNode) && leftNode.count) {
                        index += leftNode.count
                    }
                }

                if (orderedSet.moves) {
                    // Reorder nodes last
                    apply = appendPatch(apply, new VPatch(
                        VPatch.ORDER,
                        a,
                        orderedSet.moves
                    ))
                }

                return apply
            }

            function clearState(vNode, patch, index) {
                // TODO: Make this a single walk, not two
                unhook(vNode, patch, index)
                destroyWidgets(vNode, patch, index)
            }

            // Patch records for all destroyed widgets must be added because we need
            // a DOM node reference for the destroy function
            function destroyWidgets(vNode, patch, index) {
                if (isWidget(vNode)) {
                    if (typeof vNode.destroy === "function") {
                        patch[index] = appendPatch(
                            patch[index],
                            new VPatch(VPatch.REMOVE, vNode, null)
                        )
                    }
                } else if (isVNode(vNode) && (vNode.hasWidgets || vNode.hasThunks)) {
                    var children = vNode.children
                    var len = children.length
                    for (var i = 0; i < len; i++) {
                        var child = children[i]
                        index += 1

                        destroyWidgets(child, patch, index)

                        if (isVNode(child) && child.count) {
                            index += child.count
                        }
                    }
                } else if (isThunk(vNode)) {
                    thunks(vNode, null, patch, index)
                }
            }

            // Create a sub-patch for thunks
            function thunks(a, b, patch, index) {
                var nodes = handleThunk(a, b)
                var thunkPatch = diff(nodes.a, nodes.b)
                if (hasPatches(thunkPatch)) {
                    patch[index] = new VPatch(VPatch.THUNK, null, thunkPatch)
                }
            }

            function hasPatches(patch) {
                for (var index in patch) {
                    if (index !== "a") {
                        return true
                    }
                }

                return false
            }

            // Execute hooks when two nodes are identical
            function unhook(vNode, patch, index) {
                if (isVNode(vNode)) {
                    if (vNode.hooks) {
                        patch[index] = appendPatch(
                            patch[index],
                            new VPatch(
                                VPatch.PROPS,
                                vNode,
                                undefinedKeys(vNode.hooks)
                            )
                        )
                    }

                    if (vNode.descendantHooks || vNode.hasThunks) {
                        var children = vNode.children
                        var len = children.length
                        for (var i = 0; i < len; i++) {
                            var child = children[i]
                            index += 1

                            unhook(child, patch, index)

                            if (isVNode(child) && child.count) {
                                index += child.count
                            }
                        }
                    }
                } else if (isThunk(vNode)) {
                    thunks(vNode, null, patch, index)
                }
            }

            function undefinedKeys(obj) {
                var result = {}

                for (var key in obj) {
                    result[key] = undefined
                }

                return result
            }

            // List diff, naive left to right reordering
            function reorder(aChildren, bChildren) {
                // O(M) time, O(M) memory
                var bChildIndex = keyIndex(bChildren)
                var bKeys = bChildIndex.keys
                var bFree = bChildIndex.free

                if (bFree.length === bChildren.length) {
                    return {
                        children: bChildren,
                        moves: null
                    }
                }

                // O(N) time, O(N) memory
                var aChildIndex = keyIndex(aChildren)
                var aKeys = aChildIndex.keys
                var aFree = aChildIndex.free

                if (aFree.length === aChildren.length) {
                    return {
                        children: bChildren,
                        moves: null
                    }
                }

                // O(MAX(N, M)) memory
                var newChildren = []

                var freeIndex = 0
                var freeCount = bFree.length
                var deletedItems = 0

                // Iterate through a and match a node in b
                // O(N) time,
                for (var i = 0; i < aChildren.length; i++) {
                    var aItem = aChildren[i]
                    var itemIndex

                    if (aItem.key) {
                        if (bKeys.hasOwnProperty(aItem.key)) {
                            // Match up the old keys
                            itemIndex = bKeys[aItem.key]
                            newChildren.push(bChildren[itemIndex])

                        } else {
                            // Remove old keyed items
                            itemIndex = i - deletedItems++
                                newChildren.push(null)
                        }
                    } else {
                        // Match the item in a with the next free item in b
                        if (freeIndex < freeCount) {
                            itemIndex = bFree[freeIndex++]
                            newChildren.push(bChildren[itemIndex])
                        } else {
                            // There are no free items in b to match with
                            // the free items in a, so the extra free nodes
                            // are deleted.
                            itemIndex = i - deletedItems++
                                newChildren.push(null)
                        }
                    }
                }

                var lastFreeIndex = freeIndex >= bFree.length ?
                    bChildren.length :
                    bFree[freeIndex]

                // Iterate through b and append any new keys
                // O(M) time
                for (var j = 0; j < bChildren.length; j++) {
                    var newItem = bChildren[j]

                    if (newItem.key) {
                        if (!aKeys.hasOwnProperty(newItem.key)) {
                            // Add any new keyed items
                            // We are adding new items to the end and then sorting them
                            // in place. In future we should insert new items in place.
                            newChildren.push(newItem)
                        }
                    } else if (j >= lastFreeIndex) {
                        // Add any leftover non-keyed items
                        newChildren.push(newItem)
                    }
                }

                var simulate = newChildren.slice()
                var simulateIndex = 0
                var removes = []
                var inserts = []
                var simulateItem

                for (var k = 0; k < bChildren.length;) {
                    var wantedItem = bChildren[k]
                    simulateItem = simulate[simulateIndex]

                    // remove items
                    while (simulateItem === null && simulate.length) {
                        removes.push(remove(simulate, simulateIndex, null))
                        simulateItem = simulate[simulateIndex]
                    }

                    if (!simulateItem || simulateItem.key !== wantedItem.key) {
                        // if we need a key in this position...
                        if (wantedItem.key) {
                            if (simulateItem && simulateItem.key) {
                                // if an insert doesn't put this key in place, it needs to move
                                if (bKeys[simulateItem.key] !== k + 1) {
                                    removes.push(remove(simulate, simulateIndex, simulateItem.key))
                                    simulateItem = simulate[simulateIndex]
                                        // if the remove didn't put the wanted item in place, we need to insert it
                                    if (!simulateItem || simulateItem.key !== wantedItem.key) {
                                        inserts.push({
                                            key: wantedItem.key,
                                            to: k
                                        })
                                    }
                                    // items are matching, so skip ahead
                                    else {
                                        simulateIndex++
                                    }
                                } else {
                                    inserts.push({
                                        key: wantedItem.key,
                                        to: k
                                    })
                                }
                            } else {
                                inserts.push({
                                    key: wantedItem.key,
                                    to: k
                                })
                            }
                            k++
                        }
                        // a key in simulate has no matching wanted key, remove it
                        else if (simulateItem && simulateItem.key) {
                            removes.push(remove(simulate, simulateIndex, simulateItem.key))
                        }
                    } else {
                        simulateIndex++
                        k++
                    }
                }

                // remove all the remaining nodes from simulate
                while (simulateIndex < simulate.length) {
                    simulateItem = simulate[simulateIndex]
                    removes.push(remove(simulate, simulateIndex, simulateItem && simulateItem.key))
                }

                // If the only moves we have are deletes then we can just
                // let the delete patch remove these items.
                if (removes.length === deletedItems && !inserts.length) {
                    return {
                        children: newChildren,
                        moves: null
                    }
                }

                return {
                    children: newChildren,
                    moves: {
                        removes: removes,
                        inserts: inserts
                    }
                }
            }

            function remove(arr, index, key) {
                arr.splice(index, 1)

                return {
                    from: index,
                    key: key
                }
            }

            function keyIndex(children) {
                var keys = {}
                var free = []
                var length = children.length

                for (var i = 0; i < length; i++) {
                    var child = children[i]

                    if (child.key) {
                        keys[child.key] = i
                    } else {
                        free.push(i)
                    }
                }

                return {
                    keys: keys, // A hash of key name to index
                    free: free // An array of unkeyed item indices
                }
            }

            function appendPatch(apply, patch) {
                if (apply) {
                    if (isArray(apply)) {
                        apply.push(patch)
                    } else {
                        apply = [apply, patch]
                    }

                    return apply
                } else {
                    return patch
                }
            }

        }, {
            "../vnode/handle-thunk": 24,
            "../vnode/is-thunk": 25,
            "../vnode/is-vnode": 27,
            "../vnode/is-vtext": 28,
            "../vnode/is-widget": 29,
            "../vnode/vpatch": 32,
            "./diff-props": 34,
            "x-is-array": 12
        }]
    }, {}, [4])(4)
});;(function (DOMParser) {
	"use strict";
	var
		proto = DOMParser.prototype,
		nativeParse = proto.parseFromString;

	// Firefox/Opera/IE throw errors on unsupported types
	try {
		// WebKit returns null on unsupported types
		if ((new DOMParser()).parseFromString("", "text/html")) {
			// text/html parsing is natively supported
			return;
		}
	} catch (ex) {}

	proto.parseFromString = function (markup, type) {
		if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
			var
				doc = document.implementation.createHTMLDocument("");
			if (markup.toLowerCase().indexOf('<!doctype') > -1) {
				doc.documentElement.innerHTML = markup;
			} else {
				doc.body.innerHTML = markup;
			}
			return doc;
		} else {
			return nativeParse.apply(this, arguments);
		}
	};
}(DOMParser));


(function (f) {
	if (typeof exports === "object" && typeof module !== "undefined") {
		module.exports = f()
	} else if (typeof define === "function" && define.amd) {
		define([], f)
	} else {
		var g;
		if (typeof window !== "undefined") {
			g = window
		} else if (typeof global !== "undefined") {
			g = global
		} else if (typeof self !== "undefined") {
			g = self
		} else {
			g = this
		}
		g.vdomParser = f()
	}
})(function () {
	var define, module, exports;
	return (function e(t, n, r) {
		function s(o, u) {
			if (!n[o]) {
				if (!t[o]) {
					var a = typeof require == "function" && require;
					if (!u && a) return a(o, !0);
					if (i) return i(o, !0);
					var f = new Error("Cannot find module '" + o + "'");
					throw f.code = "MODULE_NOT_FOUND", f
				}
				var l = n[o] = {
					exports: {}
				};
				t[o][0].call(l.exports, function (e) {
					var n = t[o][1][e];
					return s(n ? n : e)
				}, l, l.exports, e, t, n, r)
			}
			return n[o].exports
		}
		var i = typeof require == "function" && require;
		for (var o = 0; o < r.length; o++) s(r[o]);
		return s
	})({
		1: [function (require, module, exports) {

			/**
			 * index.js
			 *
			 * A client-side DOM to vdom parser based on DOMParser API
			 */

			'use strict';

			var VNode = virtualDom.VNode;
			var VText = virtualDom.VText;
			var domParser = new DOMParser();

			var propertyMap = require('./property-map');
			var namespaceMap = require('./namespace-map');

			var HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

			module.exports = parser;

			/**
			 * DOM/html string to vdom parser
			 *
			 * @param   Mixed   el    DOM element or html string
			 * @param   String  attr  Attribute name that contains vdom key
			 * @return  Object        VNode or VText
			 */
			function parser(el, attr) {
				// empty input fallback to empty text node
				if (!el) {
					return createNode(document.createTextNode(''));
				}

				if (typeof el === 'string') {
					var doc = domParser.parseFromString(el, 'text/html');

					// most tags default to body
					if (doc.body.firstChild) {
						el = doc.body.firstChild;

						// some tags, like script and style, default to head
					} else if (doc.head.firstChild && (doc.head.firstChild.tagName !== 'TITLE' || doc.title)) {
						el = doc.head.firstChild;

						// special case for html comment, cdata, doctype
					} else if (doc.firstChild && doc.firstChild.tagName !== 'HTML') {
						el = doc.firstChild;

						// other element, such as whitespace, or html/body/head tag, fallback to empty text node
					} else {
						el = document.createTextNode('');
					}
				}

				if (typeof el !== 'object' || !el || !el.nodeType) {
					throw new Error('invalid dom node', el);
				}

				return createNode(el, attr);
			}

			/**
			 * Create vdom from dom node
			 *
			 * @param   Object  el    DOM element
			 * @param   String  attr  Attribute name that contains vdom key
			 * @return  Object        VNode or VText
			 */
			function createNode(el, attr) {
				// html comment is not currently supported by virtual-dom
				if (el.nodeType === 3) {
					return createVirtualTextNode(el);

					// cdata or doctype is not currently supported by virtual-dom
				} else if (el.nodeType === 1 || el.nodeType === 9) {
					return createVirtualDomNode(el, attr);
				}

				// default to empty text node
				return new VText('');
			}

			/**
			 * Create vtext from dom node
			 *
			 * @param   Object  el  Text node
			 * @return  Object      VText
			 */
			function createVirtualTextNode(el) {
				return new VText(el.nodeValue);
			}

			/**
			 * Create vnode from dom node
			 *
			 * @param   Object  el    DOM element
			 * @param   String  attr  Attribute name that contains vdom key
			 * @return  Object        VNode
			 */
			function createVirtualDomNode(el, attr) {
				var ns = el.namespaceURI !== HTML_NAMESPACE ? el.namespaceURI : null;
				var key = attr && el.getAttribute(attr) ? el.getAttribute(attr) : null;

				return new VNode(
					el.tagName, createProperties(el), createChildren(el, attr), key, ns
				);
			}

			/**
			 * Recursively create vdom
			 *
			 * @param   Object  el    Parent element
			 * @param   String  attr  Attribute name that contains vdom key
			 * @return  Array         Child vnode or vtext
			 */
			function createChildren(el, attr) {
				var children = [];
				for (var i = 0; i < el.childNodes.length; i++) {
					children.push(createNode(el.childNodes[i], attr));
				};

				return children;
			}

			/**
			 * Create properties from dom node
			 *
			 * @param   Object  el  DOM element
			 * @return  Object      Node properties and attributes
			 */
			function createProperties(el) {
				var properties = {};

				if (!el.hasAttributes()) {
					return properties;
				}

				var ns;
				if (el.namespaceURI && el.namespaceURI !== HTML_NAMESPACE) {
					ns = el.namespaceURI;
				}

				var attr;
				for (var i = 0; i < el.attributes.length; i++) {
					if (ns) {
						attr = createPropertyNS(el.attributes[i]);
					} else {
						attr = createProperty(el.attributes[i]);
					}

					// special case, namespaced attribute, use properties.foobar
					if (attr.ns) {
						properties[attr.name] = {
							namespace: attr.ns,
							value: attr.value
						};

						// special case, use properties.attributes.foobar
					} else if (attr.isAttr) {
						// init attributes object only when necessary
						if (!properties.attributes) {
							properties.attributes = {}
						}
						properties.attributes[attr.name] = attr.value;

						// default case, use properties.foobar
					} else {
						properties[attr.name] = attr.value;
					}
				};

				return properties;
			}

			/**
			 * Create property from dom attribute 
			 *
			 * @param   Object  attr  DOM attribute
			 * @return  Object        Normalized attribute
			 */
			function createProperty(attr) {
				var name, value, isAttr;

				// using a map to find the correct case of property name
				if (propertyMap[attr.name]) {
					name = propertyMap[attr.name];
				} else {
					name = attr.name;
				}

				// special cases for style attribute, we default to properties.style
				if (name === 'style') {
					var style = {};
					attr.value.split(';').forEach(function (s) {
						var pos = s.indexOf(':');
						if (pos < 0) {
							return;
						}
						style[s.substr(0, pos).trim()] = s.substr(pos + 1).trim();
					});
					value = style;
					// special cases for data attribute, we default to properties.attributes.data
				} else if (name.indexOf('data-') === 0) {
					value = attr.value;
					isAttr = true;
				} else {
					value = attr.value;
				}

				return {
					name: name,
					value: value,
					isAttr: isAttr || false
				};
			}

			/**
			 * Create namespaced property from dom attribute 
			 *
			 * @param   Object  attr  DOM attribute
			 * @return  Object        Normalized attribute
			 */
			function createPropertyNS(attr) {
				var name, value;

				return {
					name: attr.name,
					value: attr.value,
					ns: namespaceMap[attr.name] || ''
				};
			}

		}, {
			"./namespace-map": 2,
			"./property-map": 10
		}],
		2: [function (require, module, exports) {

			/**
			 * namespace-map.js
			 *
			 * Necessary to map svg attributes back to their namespace
			 */

			'use strict';

			// extracted from https://github.com/Matt-Esch/virtual-dom/blob/master/virtual-hyperscript/svg-attribute-namespace.js
			var DEFAULT_NAMESPACE = null;
			var EV_NAMESPACE = 'http://www.w3.org/2001/xml-events';
			var XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink';
			var XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace';

			var namespaces = {
				'about': DEFAULT_NAMESPACE,
				'accent-height': DEFAULT_NAMESPACE,
				'accumulate': DEFAULT_NAMESPACE,
				'additive': DEFAULT_NAMESPACE,
				'alignment-baseline': DEFAULT_NAMESPACE,
				'alphabetic': DEFAULT_NAMESPACE,
				'amplitude': DEFAULT_NAMESPACE,
				'arabic-form': DEFAULT_NAMESPACE,
				'ascent': DEFAULT_NAMESPACE,
				'attributeName': DEFAULT_NAMESPACE,
				'attributeType': DEFAULT_NAMESPACE,
				'azimuth': DEFAULT_NAMESPACE,
				'bandwidth': DEFAULT_NAMESPACE,
				'baseFrequency': DEFAULT_NAMESPACE,
				'baseProfile': DEFAULT_NAMESPACE,
				'baseline-shift': DEFAULT_NAMESPACE,
				'bbox': DEFAULT_NAMESPACE,
				'begin': DEFAULT_NAMESPACE,
				'bias': DEFAULT_NAMESPACE,
				'by': DEFAULT_NAMESPACE,
				'calcMode': DEFAULT_NAMESPACE,
				'cap-height': DEFAULT_NAMESPACE,
				'class': DEFAULT_NAMESPACE,
				'clip': DEFAULT_NAMESPACE,
				'clip-path': DEFAULT_NAMESPACE,
				'clip-rule': DEFAULT_NAMESPACE,
				'clipPathUnits': DEFAULT_NAMESPACE,
				'color': DEFAULT_NAMESPACE,
				'color-interpolation': DEFAULT_NAMESPACE,
				'color-interpolation-filters': DEFAULT_NAMESPACE,
				'color-profile': DEFAULT_NAMESPACE,
				'color-rendering': DEFAULT_NAMESPACE,
				'content': DEFAULT_NAMESPACE,
				'contentScriptType': DEFAULT_NAMESPACE,
				'contentStyleType': DEFAULT_NAMESPACE,
				'cursor': DEFAULT_NAMESPACE,
				'cx': DEFAULT_NAMESPACE,
				'cy': DEFAULT_NAMESPACE,
				'd': DEFAULT_NAMESPACE,
				'datatype': DEFAULT_NAMESPACE,
				'defaultAction': DEFAULT_NAMESPACE,
				'descent': DEFAULT_NAMESPACE,
				'diffuseConstant': DEFAULT_NAMESPACE,
				'direction': DEFAULT_NAMESPACE,
				'display': DEFAULT_NAMESPACE,
				'divisor': DEFAULT_NAMESPACE,
				'dominant-baseline': DEFAULT_NAMESPACE,
				'dur': DEFAULT_NAMESPACE,
				'dx': DEFAULT_NAMESPACE,
				'dy': DEFAULT_NAMESPACE,
				'edgeMode': DEFAULT_NAMESPACE,
				'editable': DEFAULT_NAMESPACE,
				'elevation': DEFAULT_NAMESPACE,
				'enable-background': DEFAULT_NAMESPACE,
				'end': DEFAULT_NAMESPACE,
				'ev:event': EV_NAMESPACE,
				'event': DEFAULT_NAMESPACE,
				'exponent': DEFAULT_NAMESPACE,
				'externalResourcesRequired': DEFAULT_NAMESPACE,
				'fill': DEFAULT_NAMESPACE,
				'fill-opacity': DEFAULT_NAMESPACE,
				'fill-rule': DEFAULT_NAMESPACE,
				'filter': DEFAULT_NAMESPACE,
				'filterRes': DEFAULT_NAMESPACE,
				'filterUnits': DEFAULT_NAMESPACE,
				'flood-color': DEFAULT_NAMESPACE,
				'flood-opacity': DEFAULT_NAMESPACE,
				'focusHighlight': DEFAULT_NAMESPACE,
				'focusable': DEFAULT_NAMESPACE,
				'font-family': DEFAULT_NAMESPACE,
				'font-size': DEFAULT_NAMESPACE,
				'font-size-adjust': DEFAULT_NAMESPACE,
				'font-stretch': DEFAULT_NAMESPACE,
				'font-style': DEFAULT_NAMESPACE,
				'font-variant': DEFAULT_NAMESPACE,
				'font-weight': DEFAULT_NAMESPACE,
				'format': DEFAULT_NAMESPACE,
				'from': DEFAULT_NAMESPACE,
				'fx': DEFAULT_NAMESPACE,
				'fy': DEFAULT_NAMESPACE,
				'g1': DEFAULT_NAMESPACE,
				'g2': DEFAULT_NAMESPACE,
				'glyph-name': DEFAULT_NAMESPACE,
				'glyph-orientation-horizontal': DEFAULT_NAMESPACE,
				'glyph-orientation-vertical': DEFAULT_NAMESPACE,
				'glyphRef': DEFAULT_NAMESPACE,
				'gradientTransform': DEFAULT_NAMESPACE,
				'gradientUnits': DEFAULT_NAMESPACE,
				'handler': DEFAULT_NAMESPACE,
				'hanging': DEFAULT_NAMESPACE,
				'height': DEFAULT_NAMESPACE,
				'horiz-adv-x': DEFAULT_NAMESPACE,
				'horiz-origin-x': DEFAULT_NAMESPACE,
				'horiz-origin-y': DEFAULT_NAMESPACE,
				'id': DEFAULT_NAMESPACE,
				'ideographic': DEFAULT_NAMESPACE,
				'image-rendering': DEFAULT_NAMESPACE,
				'in': DEFAULT_NAMESPACE,
				'in2': DEFAULT_NAMESPACE,
				'initialVisibility': DEFAULT_NAMESPACE,
				'intercept': DEFAULT_NAMESPACE,
				'k': DEFAULT_NAMESPACE,
				'k1': DEFAULT_NAMESPACE,
				'k2': DEFAULT_NAMESPACE,
				'k3': DEFAULT_NAMESPACE,
				'k4': DEFAULT_NAMESPACE,
				'kernelMatrix': DEFAULT_NAMESPACE,
				'kernelUnitLength': DEFAULT_NAMESPACE,
				'kerning': DEFAULT_NAMESPACE,
				'keyPoints': DEFAULT_NAMESPACE,
				'keySplines': DEFAULT_NAMESPACE,
				'keyTimes': DEFAULT_NAMESPACE,
				'lang': DEFAULT_NAMESPACE,
				'lengthAdjust': DEFAULT_NAMESPACE,
				'letter-spacing': DEFAULT_NAMESPACE,
				'lighting-color': DEFAULT_NAMESPACE,
				'limitingConeAngle': DEFAULT_NAMESPACE,
				'local': DEFAULT_NAMESPACE,
				'marker-end': DEFAULT_NAMESPACE,
				'marker-mid': DEFAULT_NAMESPACE,
				'marker-start': DEFAULT_NAMESPACE,
				'markerHeight': DEFAULT_NAMESPACE,
				'markerUnits': DEFAULT_NAMESPACE,
				'markerWidth': DEFAULT_NAMESPACE,
				'mask': DEFAULT_NAMESPACE,
				'maskContentUnits': DEFAULT_NAMESPACE,
				'maskUnits': DEFAULT_NAMESPACE,
				'mathematical': DEFAULT_NAMESPACE,
				'max': DEFAULT_NAMESPACE,
				'media': DEFAULT_NAMESPACE,
				'mediaCharacterEncoding': DEFAULT_NAMESPACE,
				'mediaContentEncodings': DEFAULT_NAMESPACE,
				'mediaSize': DEFAULT_NAMESPACE,
				'mediaTime': DEFAULT_NAMESPACE,
				'method': DEFAULT_NAMESPACE,
				'min': DEFAULT_NAMESPACE,
				'mode': DEFAULT_NAMESPACE,
				'name': DEFAULT_NAMESPACE,
				'nav-down': DEFAULT_NAMESPACE,
				'nav-down-left': DEFAULT_NAMESPACE,
				'nav-down-right': DEFAULT_NAMESPACE,
				'nav-left': DEFAULT_NAMESPACE,
				'nav-next': DEFAULT_NAMESPACE,
				'nav-prev': DEFAULT_NAMESPACE,
				'nav-right': DEFAULT_NAMESPACE,
				'nav-up': DEFAULT_NAMESPACE,
				'nav-up-left': DEFAULT_NAMESPACE,
				'nav-up-right': DEFAULT_NAMESPACE,
				'numOctaves': DEFAULT_NAMESPACE,
				'observer': DEFAULT_NAMESPACE,
				'offset': DEFAULT_NAMESPACE,
				'opacity': DEFAULT_NAMESPACE,
				'operator': DEFAULT_NAMESPACE,
				'order': DEFAULT_NAMESPACE,
				'orient': DEFAULT_NAMESPACE,
				'orientation': DEFAULT_NAMESPACE,
				'origin': DEFAULT_NAMESPACE,
				'overflow': DEFAULT_NAMESPACE,
				'overlay': DEFAULT_NAMESPACE,
				'overline-position': DEFAULT_NAMESPACE,
				'overline-thickness': DEFAULT_NAMESPACE,
				'panose-1': DEFAULT_NAMESPACE,
				'path': DEFAULT_NAMESPACE,
				'pathLength': DEFAULT_NAMESPACE,
				'patternContentUnits': DEFAULT_NAMESPACE,
				'patternTransform': DEFAULT_NAMESPACE,
				'patternUnits': DEFAULT_NAMESPACE,
				'phase': DEFAULT_NAMESPACE,
				'playbackOrder': DEFAULT_NAMESPACE,
				'pointer-events': DEFAULT_NAMESPACE,
				'points': DEFAULT_NAMESPACE,
				'pointsAtX': DEFAULT_NAMESPACE,
				'pointsAtY': DEFAULT_NAMESPACE,
				'pointsAtZ': DEFAULT_NAMESPACE,
				'preserveAlpha': DEFAULT_NAMESPACE,
				'preserveAspectRatio': DEFAULT_NAMESPACE,
				'primitiveUnits': DEFAULT_NAMESPACE,
				'propagate': DEFAULT_NAMESPACE,
				'property': DEFAULT_NAMESPACE,
				'r': DEFAULT_NAMESPACE,
				'radius': DEFAULT_NAMESPACE,
				'refX': DEFAULT_NAMESPACE,
				'refY': DEFAULT_NAMESPACE,
				'rel': DEFAULT_NAMESPACE,
				'rendering-intent': DEFAULT_NAMESPACE,
				'repeatCount': DEFAULT_NAMESPACE,
				'repeatDur': DEFAULT_NAMESPACE,
				'requiredExtensions': DEFAULT_NAMESPACE,
				'requiredFeatures': DEFAULT_NAMESPACE,
				'requiredFonts': DEFAULT_NAMESPACE,
				'requiredFormats': DEFAULT_NAMESPACE,
				'resource': DEFAULT_NAMESPACE,
				'restart': DEFAULT_NAMESPACE,
				'result': DEFAULT_NAMESPACE,
				'rev': DEFAULT_NAMESPACE,
				'role': DEFAULT_NAMESPACE,
				'rotate': DEFAULT_NAMESPACE,
				'rx': DEFAULT_NAMESPACE,
				'ry': DEFAULT_NAMESPACE,
				'scale': DEFAULT_NAMESPACE,
				'seed': DEFAULT_NAMESPACE,
				'shape-rendering': DEFAULT_NAMESPACE,
				'slope': DEFAULT_NAMESPACE,
				'snapshotTime': DEFAULT_NAMESPACE,
				'spacing': DEFAULT_NAMESPACE,
				'specularConstant': DEFAULT_NAMESPACE,
				'specularExponent': DEFAULT_NAMESPACE,
				'spreadMethod': DEFAULT_NAMESPACE,
				'startOffset': DEFAULT_NAMESPACE,
				'stdDeviation': DEFAULT_NAMESPACE,
				'stemh': DEFAULT_NAMESPACE,
				'stemv': DEFAULT_NAMESPACE,
				'stitchTiles': DEFAULT_NAMESPACE,
				'stop-color': DEFAULT_NAMESPACE,
				'stop-opacity': DEFAULT_NAMESPACE,
				'strikethrough-position': DEFAULT_NAMESPACE,
				'strikethrough-thickness': DEFAULT_NAMESPACE,
				'string': DEFAULT_NAMESPACE,
				'stroke': DEFAULT_NAMESPACE,
				'stroke-dasharray': DEFAULT_NAMESPACE,
				'stroke-dashoffset': DEFAULT_NAMESPACE,
				'stroke-linecap': DEFAULT_NAMESPACE,
				'stroke-linejoin': DEFAULT_NAMESPACE,
				'stroke-miterlimit': DEFAULT_NAMESPACE,
				'stroke-opacity': DEFAULT_NAMESPACE,
				'stroke-width': DEFAULT_NAMESPACE,
				'surfaceScale': DEFAULT_NAMESPACE,
				'syncBehavior': DEFAULT_NAMESPACE,
				'syncBehaviorDefault': DEFAULT_NAMESPACE,
				'syncMaster': DEFAULT_NAMESPACE,
				'syncTolerance': DEFAULT_NAMESPACE,
				'syncToleranceDefault': DEFAULT_NAMESPACE,
				'systemLanguage': DEFAULT_NAMESPACE,
				'tableValues': DEFAULT_NAMESPACE,
				'target': DEFAULT_NAMESPACE,
				'targetX': DEFAULT_NAMESPACE,
				'targetY': DEFAULT_NAMESPACE,
				'text-anchor': DEFAULT_NAMESPACE,
				'text-decoration': DEFAULT_NAMESPACE,
				'text-rendering': DEFAULT_NAMESPACE,
				'textLength': DEFAULT_NAMESPACE,
				'timelineBegin': DEFAULT_NAMESPACE,
				'title': DEFAULT_NAMESPACE,
				'to': DEFAULT_NAMESPACE,
				'transform': DEFAULT_NAMESPACE,
				'transformBehavior': DEFAULT_NAMESPACE,
				'type': DEFAULT_NAMESPACE,
				'typeof': DEFAULT_NAMESPACE,
				'u1': DEFAULT_NAMESPACE,
				'u2': DEFAULT_NAMESPACE,
				'underline-position': DEFAULT_NAMESPACE,
				'underline-thickness': DEFAULT_NAMESPACE,
				'unicode': DEFAULT_NAMESPACE,
				'unicode-bidi': DEFAULT_NAMESPACE,
				'unicode-range': DEFAULT_NAMESPACE,
				'units-per-em': DEFAULT_NAMESPACE,
				'v-alphabetic': DEFAULT_NAMESPACE,
				'v-hanging': DEFAULT_NAMESPACE,
				'v-ideographic': DEFAULT_NAMESPACE,
				'v-mathematical': DEFAULT_NAMESPACE,
				'values': DEFAULT_NAMESPACE,
				'version': DEFAULT_NAMESPACE,
				'vert-adv-y': DEFAULT_NAMESPACE,
				'vert-origin-x': DEFAULT_NAMESPACE,
				'vert-origin-y': DEFAULT_NAMESPACE,
				'viewBox': DEFAULT_NAMESPACE,
				'viewTarget': DEFAULT_NAMESPACE,
				'visibility': DEFAULT_NAMESPACE,
				'width': DEFAULT_NAMESPACE,
				'widths': DEFAULT_NAMESPACE,
				'word-spacing': DEFAULT_NAMESPACE,
				'writing-mode': DEFAULT_NAMESPACE,
				'x': DEFAULT_NAMESPACE,
				'x-height': DEFAULT_NAMESPACE,
				'x1': DEFAULT_NAMESPACE,
				'x2': DEFAULT_NAMESPACE,
				'xChannelSelector': DEFAULT_NAMESPACE,
				'xlink:actuate': XLINK_NAMESPACE,
				'xlink:arcrole': XLINK_NAMESPACE,
				'xlink:href': XLINK_NAMESPACE,
				'xlink:role': XLINK_NAMESPACE,
				'xlink:show': XLINK_NAMESPACE,
				'xlink:title': XLINK_NAMESPACE,
				'xlink:type': XLINK_NAMESPACE,
				'xml:base': XML_NAMESPACE,
				'xml:id': XML_NAMESPACE,
				'xml:lang': XML_NAMESPACE,
				'xml:space': XML_NAMESPACE,
				'y': DEFAULT_NAMESPACE,
				'y1': DEFAULT_NAMESPACE,
				'y2': DEFAULT_NAMESPACE,
				'yChannelSelector': DEFAULT_NAMESPACE,
				'z': DEFAULT_NAMESPACE,
				'zoomAndPan': DEFAULT_NAMESPACE
			};

			module.exports = namespaces;

		}, {}],
		3: [function (require, module, exports) {
			module.exports = isThunk

			function isThunk(t) {
				return t && t.type === "Thunk"
			}

		}, {}],
		9: [function (require, module, exports) {
			module.exports = VirtualText

			function VirtualText(text) {
				this.text = String(text)
			}

			VirtualText.prototype.version = version
			VirtualText.prototype.type = "VirtualText"

		}, {}],
		10: [function (require, module, exports) {

			/**
			 * property-map.js
			 *
			 * Necessary to map dom attributes back to vdom properties
			 */

			'use strict';

			// invert of https://www.npmjs.com/package/html-attributes
			var properties = {
				'abbr': 'abbr',
				'accept': 'accept',
				'accept-charset': 'acceptCharset',
				'accesskey': 'accessKey',
				'action': 'action',
				'allowfullscreen': 'allowFullScreen',
				'allowtransparency': 'allowTransparency',
				'alt': 'alt',
				'async': 'async',
				'autocomplete': 'autoComplete',
				'autofocus': 'autoFocus',
				'autoplay': 'autoPlay',
				'cellpadding': 'cellPadding',
				'cellspacing': 'cellSpacing',
				'challenge': 'challenge',
				'charset': 'charset',
				'checked': 'checked',
				'cite': 'cite',
				'class': 'className',
				'cols': 'cols',
				'colspan': 'colSpan',
				'command': 'command',
				'content': 'content',
				'contenteditable': 'contentEditable',
				'contextmenu': 'contextMenu',
				'controls': 'controls',
				'coords': 'coords',
				'crossorigin': 'crossOrigin',
				'data': 'data',
				'datetime': 'dateTime',
				'default': 'default',
				'defer': 'defer',
				'dir': 'dir',
				'disabled': 'disabled',
				'download': 'download',
				'draggable': 'draggable',
				'dropzone': 'dropzone',
				'enctype': 'encType',
				'for': 'htmlFor',
				'form': 'form',
				'formaction': 'formAction',
				'formenctype': 'formEncType',
				'formmethod': 'formMethod',
				'formnovalidate': 'formNoValidate',
				'formtarget': 'formTarget',
				'frameBorder': 'frameBorder',
				'headers': 'headers',
				'height': 'height',
				'hidden': 'hidden',
				'high': 'high',
				'href': 'href',
				'hreflang': 'hrefLang',
				'http-equiv': 'httpEquiv',
				'icon': 'icon',
				'id': 'id',
				'inputmode': 'inputMode',
				'ismap': 'isMap',
				'itemid': 'itemId',
				'itemprop': 'itemProp',
				'itemref': 'itemRef',
				'itemscope': 'itemScope',
				'itemtype': 'itemType',
				'kind': 'kind',
				'label': 'label',
				'lang': 'lang',
				'list': 'list',
				'loop': 'loop',
				'manifest': 'manifest',
				'max': 'max',
				'maxlength': 'maxLength',
				'media': 'media',
				'mediagroup': 'mediaGroup',
				'method': 'method',
				'min': 'min',
				'minlength': 'minLength',
				'multiple': 'multiple',
				'muted': 'muted',
				'name': 'name',
				'novalidate': 'noValidate',
				'open': 'open',
				'optimum': 'optimum',
				'pattern': 'pattern',
				'ping': 'ping',
				'placeholder': 'placeholder',
				'poster': 'poster',
				'preload': 'preload',
				'radiogroup': 'radioGroup',
				'readonly': 'readOnly',
				'rel': 'rel',
				'required': 'required',
				'role': 'role',
				'rows': 'rows',
				'rowspan': 'rowSpan',
				'sandbox': 'sandbox',
				'scope': 'scope',
				'scoped': 'scoped',
				'scrolling': 'scrolling',
				'seamless': 'seamless',
				'selected': 'selected',
				'shape': 'shape',
				'size': 'size',
				'sizes': 'sizes',
				'sortable': 'sortable',
				'span': 'span',
				'spellcheck': 'spellCheck',
				'src': 'src',
				'srcdoc': 'srcDoc',
				'srcset': 'srcSet',
				'start': 'start',
				'step': 'step',
				'style': 'style',
				'tabindex': 'tabIndex',
				'target': 'target',
				'title': 'title',
				'translate': 'translate',
				'type': 'type',
				'typemustmatch': 'typeMustMatch',
				'usemap': 'useMap',
				'value': 'value',
				'width': 'width',
				'wmode': 'wmode',
				'wrap': 'wrap'
			};

			module.exports = properties;

		}, {}]
	}, {}, [1])(1)
});;(function () {
	window.Template = {};
	window.Component = {};

	var pipe = EventPipe.pipe('compile');

	(function () {
		var TAGS = '|template|a|b|body|br|button|center|cite|code|comment|dd|div|dl|dt|em|embed|fieldset|font|form|frame|head|hr|html|i|iframe|img|input|label|legend|li|link|meta|ol|option|p|pre|script|select|span|strong|style|sub|sup|table|tbody|td|textarea|th|thead|tr|ul|';
		var regTpl = /<template\s*name\s*=\s*"([^\"]+)"\s*>(((?!<\/template>).)*)<\/template>/g;
		var regInclude = /\{\{#>\s*(.*?)\}\}/;
		var regTranscludeTag = /\{\{>transclude\}\}/;
		var regIf = /\{\{#if\s*(.*?)\}\}(((?!\{\{#if).)*)\{\{\/if\}\}/;
		var regEach = /\{\{#each\s*(\w+)\}\}(((?!\{\{#each\}\}).)*)\{\{\/each\}\}/;
		var regTransclude = /\{\{#transclude\}\}(((?!\{\{#transclude\}\}).)*)\{\{\/transclude\}\}/;
		var regComponent = /\{\{#component\s*(.*?)\}\}(((?!\{\{#component\}\}).)*)\{\{\/component\}\}/;

		var Mustang = {};
		var useVirtualDom = true;

		Mustang.load = function (path) {
			return new MTemplate(path);
		};

		Mustang.render = function (tpl, data, fn) {
			var text = tpl;
			var name = getTemplateName(text);
			if (!Template[name]) {
				Template[name] = new XTemplate(name);
			}
			var tpl = new MTemplate();
			tpl.loadedText = text;
			tpl.renderData = data;
			tpl._renderComplete = function (text) {
				fn(text);
			}
			tpl._render(text, data);
		};

		function MTemplate(path) {
			this.toRender = false;
			this.loaded = false;
			this.loadedText = '';
			this.tplName = '';

			this.queue = [];
			this.tplCache = {};

			this._node = null;
			this.vTree = null;
			this.vRoot = null;
			this.renderData = null;
			this.timer = null;

			this.binded = false;

			var me = this;
			if (path) {
				var tpl = path + '.tpl';
				var tplJs = path + '.js';
				if (resourceMap && resourceMap['/' + tplJs]) {
					tplJs = resourceMap['/' + tplJs].slice(1);
				}
				_.ajax.get(tpl, {}, function (text) {
					// tplCache[tpl] = text;
					var name = me.tplName = getTemplateName(text);
					if (!Template[name]) {
						Template[name] = new XTemplate(name);
					}
					_.loadJs(tplJs, loadDone, loadDone);

					function loadDone() {
						me.loaded = true;
						me.loadedText = text;
						me._loadDone();
					}
				});
			}
		};

		MTemplate.prototype.render = function (nodeSelector, data) {
			var me = this;
			me.toRender = true;
			if (!me._node) {
				var node = document.querySelector(nodeSelector);
				var innerDiv = document.createElement('div');
				innerDiv.style.width = '100%';
				innerDiv.style.height = '100%';
				node.appendChild(innerDiv);

				me._node = node;
				me._container = innerDiv;
			}
			me.renderData = data;
			if (me.loaded) {
				me._loadDone();
			}
		};

		MTemplate.prototype._loadDone = function () {
			var me = this;
			if (me.toRender) {
				if (!me.binded) {
					me.binded = true;
					Template[me.tplName].bindEvent(me._container);
				}
				me._render(me.loadedText, me.renderData);
			}
		};

		MTemplate.prototype._render = function (text, data) {
			var me = this;
			text = toOneLine(text);
			me.queue.length = 0;

			regTpl.lastIndex = 0;
			var mats = regTpl.exec(text);
			var id = _.md5();
			me.queue.push({
				id: id,
				tplName: mats[1],
				placeholder: mats[0],
				content: mats[2],
				data: data,
				global: me.renderData,
				parent: null
			});
			me._getComponent(mats[2]);
			me._renderTemplate();
		};

		MTemplate.prototype._getComponent = function (html) {
			var me = this;
			me.componentTag = [];
			var div = document.createElement('div');
			div.innerHTML = html;
			_.recurse(div, function (node) {
				var nt = node.tagName.toLowerCase();
				if (TAGS.indexOf('|' + nt + '|') == -1) {
					var mats = /<(\w+)(?:(\s|.)*?)>/.exec(node.outerHTML);
					me.componentTag.push(mats[1]);
				}
			});
		};

		MTemplate.prototype._renderComplete = function (text) {
			var me = this;
			if (useVirtualDom) {
				if (!me.vTree) {
					me.vTree = newVirtualDom(text);
					me._container.innerHTML = text;
					pipe.write('renderComplete');
				} else {
					if (me.timer) {
						clearTimeout(me.timer);
					}
					me.timer = setTimeout(function () {
						var newTree = newVirtualDom(text);
						var patches = virtualDom.diff(me.vTree, newTree);
						virtualDom.patch(me._container, patches);
						me.vTree = newTree;
						pipe.write('renderComplete');
					}, 60);
				}
			} else {
				me._container.innerHTML = text;
			}

			function newVirtualDom(html) {
				console.time('html2vdom');
				html = '<div style="width:100%; height:100%">' + html + '</div>';
				var vdoms = window.vdomParser(html);
				console.timeEnd('html2vdom');
				return vdoms;
			}
		};

		MTemplate.prototype._renderTemplate = function () {
			var me = this;
			if (me.queue.length > 0) {
				var item = me.queue.pop();
				me._renderCommon(item);
			}
		};

		MTemplate.prototype._renderCommon = function (item, jump) {
			var me = this;
			var id = item.id,
				tplName = item.tplName,
				placeholder = item.placeholder,
				text = item.content,
				data = item.data,
				pid = item.parent;

			regTransclude.lastIndex = 0;
			regComponent.lastIndex = 0;
			regEach.lastIndex = 0;
			regInclude.lastIndex = 0;

			console.time('match');
			if (regTransclude.test(text)) {
				me._renderTransclude(item);
			} else if (regComponent.test(text)) {
				me._renderComponent(item);
			} else if (me.componentTag.length > 0 && !jump) {
				var tag = me.componentTag.shift();
				var regComponentTag = new RegExp('<(' + tag + ')\s*([^>]*)>(((?!<' + tag + ').)*)<\/' + tag + '>', 'i');
				if (regComponentTag.test(text)) {
					me._renderComponentTag(regComponentTag, item);
				} else {
					me.componentTag.push(tag);
					me._renderCommon(item, true)
				}
			} else if (regEach.test(text)) {
				me._renderEach(item);
			} else if (regIf.test(text)) {
				me._renderIf(item);
			} else if (regInclude.test(text)) {
				me._renderInclude(item);
			} else {
				var result = me._renderNormal(item);
				if (me.queue.length > 0) {
					me._setQueueItemContent(pid, item.placeholder, result);
					me._renderTemplate();
				} else {
					me._renderComplete(result);
				}
			}
			console.timeEnd('match');
		};

		//解析模板中的Component Tag
		MTemplate.prototype._renderComponentTag = function (reg, item) {
			var me = this;
			me.queue.push(item);

			var id = item.id,
				tplName = item.tplName,
				text = item.content,
				data = item.data;

			reg.lastIndex = 0;
			var results = reg.exec(text);
			var allMatch = results[0];
			var compoName = results[1];
			var transclude = results[3];

			if (transclude) {
				var cid = _.md5();
				me.queue.push({
					id: cid,
					tplName: tplName,
					placeholder: allMatch,
					content: '{{#component ' + compoName + '}}' + allMatch + '{{/component}}',
					data: data,
					global: me.renderData,
					parent: id
				});

				var fid = _.md5();
				me.queue.push({
					id: fid,
					tplName: tplName,
					placeholder: transclude,
					content: '{{#transclude}}' + transclude + '{{/transclude}}',
					data: data,
					global: me.renderData,
					parent: cid
				});
			} else {
				var cid = _.md5();
				me.queue.push({
					id: cid,
					tplName: tplName,
					placeholder: allMatch,
					content: '{{#component ' + compoName + '}}' + allMatch + '{{/component}}',
					data: data,
					global: me.renderData,
					parent: id
				});
			}
			me._renderTemplate();
		};

		//解析模板中的Component
		MTemplate.prototype._renderComponent = function (item) {
			var me = this;
			me.queue.push(item);

			var id = item.id,
				tplName = item.tplName,
				text = item.content,
				data = item.data;

			regComponent.lastIndex = 0;
			var results = regComponent.exec(text);
			var allMatch = results[0];
			var compoName = results[1];
			var content = results[2];

			var regComponentTag = new RegExp('<(' + compoName + ')\s*([^>]*)>(((?!<' + compoName + ').)*)<\/' + compoName + '>', 'i');
			var results = regComponentTag.exec(content);
			var allMatch = results[0];
			var compoName = _.upFirstLetter(results[1]);
			var props = getProps(results[2]);
			var transclude = results[3];

			if (!Component[compoName]) {
				Mustang.loadComponent(compoName, function () {
					doneCom();
				});
			} else if (Component[compoName].opts) {
				doneCom();
			}

			function doneCom() {
				for (var p in props) {
					var val = props[p];
					var mats = /\{\{(.*?)\}\}/.exec(val);
					if (mats) {
						props[p] = data[mats[1]];
					}
				}
				if (!props.name) {
					props.name = _.md5();
				}
				if (transclude) {
					props['transclude'] = transclude;
				}
				var comId = 'com_' + _.md5();
				var com = Component[compoName].new(comId, props.name, props, me.tplName);
				com.render(function (text) {
					me._setQueueItem(id, {
						content: '<component id="' + comId + '">' + text + '</component>'
					});
					// //再替换一层
					// var qi = me.queue.pop();
					// me._setQueueItemContent(qi.parent, qi.placeholder, qi.content);
					me._renderTemplate();
				});
			}
		};

		function getProps(str) {
			var me = this;
			var prop = {};
			var arr = str.split(' ');
			arr.forEach(function (item, i) {
				var attr = item.replace(/^\s*|\s*$/g, '').split('=');
				if (attr[0]) {
					prop[attr[0]] = attr[1].slice(1, -1);
				}
			});
			return prop;
		}

		//解析模板中的Transclude
		MTemplate.prototype._renderTransclude = function (item) {
			var me = this;
			var id = item.id,
				tplName = item.tplName,
				text = item.content,
				data = item.data;

			regTransclude.lastIndex = 0;
			var results = regTransclude.exec(text);
			var allMatch = results[0];
			var clude = results[1];

			var fid = _.md5();
			me.queue.push({
				id: fid,
				tplName: tplName,
				placeholder: allMatch,
				content: clude,
				data: data,
				global: me.renderData,
				parent: id
			});
			me._renderTemplate();
		};

		//解析模板中的{{#each}}
		MTemplate.prototype._renderEach = function (item) {
			var me = this;
			me.queue.push(item);

			var id = item.id,
				tplName = item.tplName,
				text = item.content,
				data = item.data;

			var temps = [],
				stack = [];

			regEach.lastIndex = 0;
			var results = regEach.exec(text);
			var allMatch = results[0];
			var eachItem = results[2];

			var eachData;
			if (Array.isArray(data)) {
				eachData = data;
			} else {
				eachData = data[results[1]];
			}

			var fid = _.md5();
			me.queue.push({
				id: fid,
				tplName: tplName,
				placeholder: allMatch,
				content: eachItem,
				data: eachData,
				global: me.renderData,
				parent: id
			});

			eachData.forEach(function (itemData, i) {
				temps.push(eachItem);
				var eid = _.md5();
				me.queue.push({
					id: eid,
					tplName: tplName,
					placeholder: eachItem,
					content: eachItem,
					data: itemData,
					global: me.renderData,
					parent: fid
				});
			});

			me._setQueueItem(fid, {
				content: temps.join('')
			});

			me._renderTemplate();
		};

		//解析模板中的{{#if}}
		MTemplate.prototype._renderIf = function (item) {
			var me = this;
			me.queue.push(item);

			var id = item.id,
				tplName = item.tplName,
				text = item.content,
				data = item.data;

			regIf.lastIndex = 0;
			var results = regIf.exec(text);

			var condition = results[1],
				content = results[2],
				yes, no, result;

			if (content.indexOf('{{#else}}') != -1) {
				var cs = content.split('{{#else}}');
				yes = cs[0];
				no = cs[1];
			} else {
				yes = content;
			}

			result = Template[tplName].eval(condition, data, me.renderData) ? yes : (no || '');

			var fid = _.md5();
			me.queue.push({
				id: fid,
				tplName: tplName,
				placeholder: results[0],
				content: result,
				data: data,
				global: me.renderData,
				parent: id
			});

			me._renderTemplate();
		};

		//解析模板中的{{#>}}
		MTemplate.prototype._renderInclude = function (item) {
			var me = this;
			me.queue.push(item);

			var id = item.id,
				tplName = item.tplName,
				placeholder = item.placeholder,
				text = item.content,
				data = item.data;

			regInclude.lastIndex = 0;
			var results = regInclude.exec(text);

			var tpl = results[1] + '.tpl';
			var tplJs = results[1] + '.js';
			if (resourceMap && resourceMap['/' + tplJs]) {
				tplJs = resourceMap['/' + tplJs].slice(1);
			}

			if (me.tplCache[tpl]) {
				compileInclude(me.tplCache[tpl]);
			} else {
				_.ajax.get(tpl, {}, function (txt) {
					txt = toOneLine(txt);
					me.tplCache[tpl] = txt;

					var name = getTemplateName(txt);
					if (!Template[name]) {
						Template[name] = new XTemplate(name);
					}
					_.loadJs(tplJs, done, done);

					function done() {
						compileInclude(txt);
					}
				});
			}

			function compileInclude(txt) {
				regTpl.lastIndex = 0;
				var mats = regTpl.exec(txt);

				var fid = _.md5();
				me.queue.push({
					id: fid,
					tplName: mats[1],
					placeholder: results[0],
					content: mats[2],
					data: data,
					global: me.renderData,
					parent: id
				});
				me._renderTemplate();
			}
		};

		MTemplate.prototype._renderNormal = function (item) {
			var me = this;
			var tplName = item.tplName;
			return Template[tplName].compile(item);
		};

		MTemplate.prototype._getQueueItem = function (id) {
			var me = this;
			var results = me.queue.filter(function (item) {
				return item.id === id;
			});
			return results;
		};

		MTemplate.prototype._setQueueItem = function (id, map) {
			var me = this;
			var obj = me.queue.filter(function (item) {
				return item.id === id;
			});
			if (obj.length == 1) {
				obj = obj[0];
				for (var k in map) {
					obj[k] = map[k];
				}
			}
		};

		MTemplate.prototype._setQueueItemContent = function (id, placeholder, content) {
			var me = this;
			var obj = me.queue.filter(function (item) {
				return item.id === id;
			});
			if (obj.length == 1) {
				obj = obj[0];
				obj.content = obj.content.replace(placeholder, content);
			}
		};

		function toOneLine(text) {
			var result = text.replace(/\r/g, '');
			result = result.replace(/\n/g, '');
			result = result.replace(/\t/g, '');
			return result;
		}

		function getTemplateName(text) {
			text = text.replace(/^\s*|\s*$/g, '');
			var mats = text.match(/<template\s*name\s*=\s*"(\w+)">/);
			if (mats && mats.length > 1) {
				return mats[1];
			}
			return '';
		}

		hydra.load = Mustang.load;
		hydra.render = Mustang.render;

		window.Mustang = Mustang;
	})();


	var XTemplate = (function () {
		function XTemplate(name) {
			this.name = name;
			this._fields = {};
			this._filters = {};
			this._events = {};
		}
		XTemplate.prototype.helpers = function (obj) {
			for (var key in obj) {
				this._fields[key] = obj[key];
			}
		};
		XTemplate.prototype.filters = function (obj) {
			for (var key in obj) {
				this._filters[key] = obj[key];
			}
		};
		XTemplate.prototype.events = function (obj) {
			for (var key in obj) {
				this._events[key.replace('^\s*|\s*$', '')] = obj[key];
			}
		};
		XTemplate.prototype._mixin = function (data) {
			var fields = this._fields,
				filters = this._filters;

			for (var key in fields) {
				var v = fields[key];
				if (typeof (v) == 'function') {
					data[key] = v.apply(data);
				} else {
					data[key] = v;
				}
			}
		};
		XTemplate.prototype.compile = function (item) {
			this._mixin(item.data);

			var text = item.content,
				data = item.data,
				topData = item.global,
				filters = this._filters;

			var result = text.replace(/\{\{(.*?)\}\}/g, function (s0, s1) {
				var key, val, filter;
				if (s1.indexOf('|') > 0) {
					var parts = s1.split('|');
					key = _.trim(parts[0]);
					filter = _.trim(parts[1]);
				} else if (s1.indexOf('>') == 0) {
					key = s1.slice(1);
				} else {
					key = _.trim(s1);
				}
				var ks;
				if (key.indexOf('.') != -1) {
					var ks = key.split('.');
					var val;
					if (ks[0] == 'top') {
						val = topData;
					} else {
						val = data[ks[0]];
					}
					_.each(ks, function (i, k) {
						i > 0 && val && (val = val[k]);
					});
				} else {
					val = data[key];
				}
				if (filter) {
					if (filters[filter]) {
						val = filters[filter](val);
					} else {
						console.error('filter [' + filter + '] is not exist');
					}
				}
				return val;
			});
			return result;
		};
		XTemplate.prototype.eval = function (exp, data, global) {
			this._mixin(data);

			exp = exp.replace(/\s/g, '');
			var mats = /(\w+)(<|>|==|\!=)(.*)$/.exec(exp);
			return eval("'" + (data[mats[1]] || global[mats[1]] || mats[1]) + "'" + mats[2] + mats[3]);
		};
		XTemplate.prototype.bindEvent = function (node) {
			if (node) {
				this.node = node;
			} else {
				node = this.node;
			}
			for (var key in this._events) {
				var eve = this._events[key];
				var arr = key.split(' ');
				var evt = arr.pop();
				DomEvent.delegate(node, arr.join(' '), evt, eve);
			}
		};
		return XTemplate;
	})();



	(function (Mustang) {

		Mustang.component = function (name, opts) {
			console.log('[', name, '] loaded', opts);
			name = _.upFirstLetter(name);
			if (!Component[name]) {
				Component[name] = new XComponent(name);
			}
			Component[name].opts = opts;
		};

		Mustang.loadComponent = function (compoName, fn) {
			if (compoName) {
				if (!Component[compoName]) {
					Component[compoName] = new XComponent(compoName);
				}
				var lname = _.downFirstLetter(compoName);
				var comJs = 'component/' + lname + '/' + lname + '.js';
				if (resourceMap && resourceMap['/js/' + comJs]) {
					comJs = resourceMap['/js/' + comJs].slice(1);
				}
				var comCss = 'component/' + lname + '/' + lname + '.css';
				if (resourceMap && resourceMap['/js/' + comCss]) {
					comCss = resourceMap['/js/' + comCss].slice(1);
				}
				_.loadJs(comJs, function () {
					fn && fn(Component[compoName]);
				});
				_.loadCss(comCss);
			}
		};

		function XComponent(name) {
			this.name = name;
		}
		XComponent.prototype.new = function (id, instance, props, tplName) {
			var na = _.upFirstLetter(this.name);
			var opts = Component[na].opts;
			console.log('>', this.name);
			if (props) {
				_.extend(opts.props, props);
			}
			var tpl = Template[tplName];
			return new MComponet(id, instance, opts, tpl);
		};

		XComponent.prototype.newInstance = function (props) {
			var na = _.upFirstLetter(this.name);
			var opts = Component[na].opts;
			console.log('>', this.name);
			if (props) {
				_.extend(opts.props, props);
			}
			var id = 'com_' + _.md5();
			var name = _.md5();
			var ctpl = app.getCurrentTemplate();
			var tpl = Template[ctpl.tplName];
			var newCom = new MComponet(id, name, opts, tpl);

			newCom.render(function (text) {
				var comDom = document.createElement('div');
				comDom.innerHTML = '<component id="' + id + '">' + text + '</component>';
				ctpl._node.appendChild(comDom.children[0]);
			});
		};

		function MComponet(id, name, opts, template) {
			this.id = id;
			this.name = name;
			this.opts = opts;
			this.template = template;

			var me = this;
			pipe.receive({
				'renderComplete': function () {
					var el = document.querySelector('#' + me.id);
					if (!el) return;
					me.context = {
						'$el': el,
						props: me.opts.props
					};
					var render = me.opts.render;
					render.call(me.context);
					me.bindEvent();
				}
			});
		}

		MComponet.prototype.bindEvent = function () {
			var me = this;
			if (me.binded) return;
			me.binded = true;

			var opts = me.opts;
			var comEvents = opts.events.call(me.context);
			var evts = {};
			for (var e in comEvents) {
				var ne = '#' + me.id + ' ' + e;
				evts[ne] = comEvents[e];
			}
			me.template.events(evts);
			var ctpl = app.getCurrentTemplate();
			me.template.bindEvent(ctpl._node);
		};

		MComponet.prototype.render = function (fn) {
			var opts = this.opts;
			var html = Mustang.render(opts.template, opts.props, function (text) {
				fn(text);
			});
		};

		hydra.component = Mustang.component;
		hydra.loadComponent = Mustang.loadComponent;

	})(Mustang);

})();;(function (window) {

	var _moduleBus = {}, //模块缓存
		_controllerBus = {}, //控制器缓存
		_runStack = [], //运行栈,只放controller
		_parseTree = {}, //解析树
		_parseBus = {}, //记录解析过的scope
		_config = null, //全局配置
		_uid = 1, //uuid
		_currentController = null, //当前的控制器
		_cssBus = {}, //css缓存
		_currentPath; //当前路由

	var STATE = {
		INIT: 0,
		LOADED: 1,
		RUN: 2
	};

	/*--------------------------------------------------------*/
	function Mvc(name) {
		this.name = name;
		this._routParms = {};
		_.extend(this, Event);
	}

	Mvc.prototype.controller = function (name) {
		var dependenceStr, func
		var args = Array.prototype.slice.call(arguments, 1);
		if (args.length == 2) {
			dependenceStr = args[0];
			func = args[1];
		} else {
			dependenceStr = '';
			func = args[0];
		}
		if (!_.isFunction(func)) console.error('controller [', name, '], arguments error.');
		var className = name;
		if (_moduleBus[className]) {
			console.error('controller [', name, '] already exist.');
			return;
		}
		var dependences = getDependence(dependenceStr) || [];
		_moduleBus[className] = {
			name: className,
			type: 'controller',
			state: STATE.INIT,
			dependences: dependences,
			fn: func
		};
		loadModule(dependences);
		checkDependence(className);
	};

	Mvc.prototype.store = function (name) {
		var dependenceStr, func
		var args = Array.prototype.slice.call(arguments, 1);
		if (args.length == 2) {
			dependenceStr = args[0];
			func = args[1];
		} else {
			dependenceStr = '';
			func = args[0];
		}
		if (!_.isFunction(func)) console.error('store [', name, '], arguments error.');
		var className = 'stores/' + name;
		if (_moduleBus[className]) {
			console.error('store [', name, '] already exist.');
			return;
		}
		var dependences = getDependence(dependenceStr) || [];
		_moduleBus[className] = {
			name: className,
			type: 'store',
			state: STATE.INIT,
			dependences: dependences,
			fn: func
		};
		loadModule(dependences);
		checkDependence(className);
	};

	Mvc.prototype.config = function (opts) {
		var me = this;
		_config = opts;
		var routers = opts.router;

		runController('AppController');

		_.each(routers, function (path, route) {
			bindRouter(path);
		});
		Path.listen();

		if (location.hash == '') {
			me.redirect('/');
		}

		function bindRouter(path) {
			var route = routers[path];
			if (/^\//.test(path)) {
				Path.map('#' + path).to(function () {
					if (route.redirect) {
						Path.dispatch(route.redirect);
					} else {
						if (route.css) {
							if (!_cssBus[route.css]) {
								_.loadCss(route.css);
								_cssBus[route.css] = true;
							}
						}
						me._route(path);
						me.dispatchEvent('pathChange', '#' + path);
					}
				});
			}
		}
	};

	Mvc.prototype.redirect = function (path) {
		_currentPath = path;
		location.href = location.href.split('#')[0] + '#' + path;
		// Path.dispatch('#'+path);
	};
	Mvc.prototype.setRouteParam = function (param) {
		var me = this;
		_.each(param, function (key, value) {
			me._routParms[key] = value;
		});
	};
	Mvc.prototype.getRouteParam = function (key) {
		return this._routParms[key];
	};
	Mvc.prototype.removeRouteParam = function (key) {
		delete this._routParms[key];
	};
	Mvc.prototype.emptyRouteParam = function (key) {
		this._routParms = {};
	};
	Mvc.prototype._route = function (path) {
		_currentPath = path;
		var rt = _config.router[path];
		if (rt && rt.template) {
			var tpl = Mustang.load(_config.base + '/' + rt.template);

			//调用controller的析构函数
			if (_currentController) {
				var ctrl = _controllerBus[_currentController];
				if (ctrl && ctrl.scope) {
					ctrl.scope.finalize && ctrl.scope.finalize();
				}
			}
			//执行controller
			runController(rt.controller, tpl);
		}
	};
	Mvc.prototype.getCurrentRoute = function () {
		return _currentPath;
	};
	Mvc.prototype.getCurrentTemplate = function () {
		return _controllerBus[_currentController].scope._tpl;
	};

	/*--------------------------------------------------------*/
	function Scope(id, tpl, controller) {
		this._id = id;
		this._tpl = tpl;
		this._controller = controller;
	}

	Scope.prototype.on = function () {

	};
	Scope.prototype.dispatch = function () {

	};
	Scope.prototype.setState = function (data) {
		var controller = _moduleBus[this._controller];
		var states = _controllerBus[controller.name].states;
	//	for(var key in data){
			_.each(states, function (i, item) {
				item.setState(data)
			})
//		}
		this.apply();
	};
	Scope.prototype.apply = function () {
		var tpl = this._tpl;
		var controller = _moduleBus[this._controller];
		if (controller && controller.state == STATE.LOADED) {
			if (_controllerBus[controller.name]) {
				var states = _controllerBus[controller.name].states;

				if (states) {
					_.each(states, function (i, item) {
						if (tpl && tpl.render) {
							if (item.state) {
								tpl.render(_config.view, item.state);
							}
						}
					})
				}
			}
		}
	};
	/*--------------------------------------------------------*/
	function newState(func) {
		var object = {
			setState: function (data) {
				this.state = data;
				func();
			},
			getState: function (data) {
				return this.state;
			}
		};
		// function observer() {
		// 	console.log(changes);
		// 	func();
		// }
		// Object.observe(object, observer);
		//Object.deliverChangeRecords(observer);
		return object;
	}
	var StoreUtil = {
		get: function (url, param, func) {
			_.ajax.get(url, param, func);
		},
		post: function (url, param, func) {
			_.ajax.post(url, param, func);
		}
	};
	/*--------------------------------------------------------*/
	/*--------------------------------------------------------*/
	//反射
	function newInstance(strClass) {
		var args = Array.prototype.slice.call(arguments, 1);
		var clsClass = eval(strClass);

		function F() {
			return clsClass.apply(this, args);
		}
		F.prototype = clsClass.prototype;
		return new F();
	};

	function newFunction(func) {
		var args = Array.prototype.slice.call(arguments, 1);

		function F() {
			return func.apply(this, args);
		}
		F.prototype = func.prototype;
		return new F();
	}

	function loadController(name) {
		var source = '/controllers/' + name + '.js';
		var path = _config.base + source;
		if (resourceMap && resourceMap['/js' + source]) {
			path = _config.base + resourceMap['/js' + source].slice(3);
		}
		_.loadJs(path);
	}

	function loadModule(names) {
		if (names.length > 0) {
			for (var i = 0, len = names.length; i < len; i++) {
				var source = '/' + names[i] + '.js';
				var path = _config.base + source;
				if (resourceMap && resourceMap['/js' + source]) {
					path = _config.base + resourceMap['/js' + source].slice(3);
				}
				_.loadJs(path);
			}
		}
	}

	function newDataScope(data, scope) {
		var s = new Scope(_.md5(), null, null);
		_.extend(s, data);
		if (scope && scope.filter) {
			s.filter = scope.filter;
		}
		return s;
	}

	function getDependence(dependenceStr) {
		if (dependenceStr) {
			var temp = _.trim(dependenceStr).split(','),
				result = [];
			_.each(temp, function (idx, ele) {
				var item = _.trim(ele);
				item && result.push(item);
			});
			return result;
		}
		return null;
	}

	function checkDependence(className) {
		var mod = _moduleBus[className];
		if (mod) {
			var deps = mod.dependences,
				all_loaded = true;
			if (deps.length > 0) {
				_.each(deps, function (idx, item) {
					var depmod = _moduleBus[item];
					if (!depmod || depmod.state != STATE.LOADED) {
						all_loaded = false;
					}
				});
			}
			if (all_loaded) {
				mod.state = STATE.LOADED;
				globalDependenceCheck()
			}
		}
	}

	function globalDependenceCheck() {
		for (var className in _moduleBus) {
			var mod = _moduleBus[className];
			if (mod && mod.state != STATE.LOADED) {
				var deps = mod.dependences,
					all_loaded = true;
				if (deps.length > 0) {
					_.each(deps, function (idx, item) {
						var depmod = _moduleBus[deps[idx]];
						if (!depmod || depmod.state != STATE.LOADED) {
							all_loaded = false;
						}
					});
				}
				if (all_loaded) {
					mod.state = STATE.LOADED;
					checkRunStack(mod.name);
					globalDependenceCheck();
				}
			} else if (mod && mod.state == STATE.LOADED) {
				checkRunStack(mod.name);
			}
		}
	}

	function checkRunStack(name) {
		if (_runStack.length > 0 && _runStack[0].controller == name) {
			var run = _runStack.pop();
			runController(run.controller, run.tpl);
		}
	}

	function runController(controllerName, tpl) {
		var controller = _moduleBus[controllerName];
		if (controller && controller.state == STATE.LOADED) {
			//每次都先执行rootController
			// if (controllerName !== 'RootController') {
			// 	runController('RootController');
			// }
			var id = _.md5() + '_' + _.uuid();
			var scope = new Scope(id, tpl, controller.name);
			_controllerBus[controller.name] = {
				scope: scope
			};

			if (controller.dependences) {
				var args = [];
				_.each(controller.dependences, function (idx, item) {
					var depMod = injectModule(controllerName, _moduleBus[item]);
					args.push(depMod);
				});
			}

			controller.fn.apply(scope, args);
			_currentController = controller.name;
			scope.apply();
		} else {
			_runStack.push({
				controller: controllerName,
				tpl: tpl
			});
			loadController(controllerName);
		}
	}

	function injectModule(controllerName, mod) {
		if (mod) {
			if (mod.state == STATE.LOADED) {
				var args = [];
				if (mod.dependences) {
					_.each(mod.dependences, function (idx, item) {
						switch (_moduleBus[item].type) {
							case 'plugin':
								args.push(injectModule(_moduleBus[item]));
								break;
							case 'store':
								var sta = newState(function () {
									_controllerBus[controllerName].scope.apply();
								});
								_controllerBus[controllerName].state = sta;
								args.push(_moduleBus[item].fn.apply(StateUtil, [state]));
								break;
						}
					});
				}
				switch (mod.type) {
					case 'plugin':
						var clas = mod.fn.apply(newDataScope({}), args);
						return _.copy(clas, Event);
						break;
					case 'store':
						var ctrl = _controllerBus[controllerName];
						var sta = newState(function () {
							ctrl.scope.apply();
						});
						if (!ctrl.states) {
							ctrl.states = [];
						}
						ctrl.states.push(sta);
						return mod.fn.apply(StoreUtil, [sta]);
						break;
				}
			}
		}
	}

	/*--------------------------------------------------------*/
	var Path = {
		'map': function (path) {
			if (Path.routes.defined.hasOwnProperty(path)) {
				return Path.routes.defined[path];
			} else {
				return new Path.core.route(path);
			}
		},
		'root': function (path) {
			Path.routes.root = path;
		},
		'rescue': function (fn) {
			Path.routes.rescue = fn;
		},
		'match': function (path, parameterize) {
			var params = {},
				route = null,
				possible_routes, slice, i, j, compare;
			for (route in Path.routes.defined) {
				if (route !== null && route !== undefined) {
					route = Path.routes.defined[route];
					possible_routes = route.partition();
					for (j = 0; j < possible_routes.length; j++) {
						slice = possible_routes[j];
						compare = path;
						if (slice.search(/:/) > 0) {
							for (i = 0; i < slice.split("/").length; i++) {
								if ((i < compare.split("/").length) && (slice.split("/")[i].charAt(0) === ":")) {
									params[slice.split('/')[i].replace(/:/, '')] = compare.split("/")[i];
									compare = compare.replace(compare.split("/")[i], slice.split("/")[i]);
								}
							}
						}
						if (slice === compare) {
							if (parameterize) {
								route.params = params;
							}
							return route;
						}
					}
				}
			}
			return null;
		},
		'dispatch': function (passed_route) {
			var previous_route, matched_route;
			if (Path.routes.current !== passed_route) {
				Path.routes.previous = Path.routes.current;
				Path.routes.current = passed_route;
				matched_route = Path.match(passed_route, true);
				if (Path.routes.previous) {
					previous_route = Path.match(Path.routes.previous);
					if (previous_route !== null && previous_route.do_exit !== null) {
						previous_route.do_exit();
					}
				}
				if (matched_route !== null) {
					matched_route.run();
					return true;
				} else {
					if (Path.routes.rescue !== null) {
						Path.routes.rescue();
					}
				}
			}
		},
		'listen': function () {
			var fn = function () {
				Path.dispatch(location.hash);
			}
			if (location.hash === "") {
				if (Path.routes.root !== null) {
					location.hash = Path.routes.root;
				}
			}
			// The 'document.documentMode' checks below ensure that PathJS fires the right events
			// even in IE "Quirks Mode".
			if (history.pushState) {
				window.addEventListener('popstate', fn);
			} else if ("onhashchange" in window && (!document.documentMode || document.documentMode >= 8)) {
				window.onhashchange = fn;
			} else {
				setInterval(fn, 100);
			}
			if (location.hash !== "") {
				Path.dispatch(location.hash);
			}
		},
		'core': {
			'route': function (path) {
				this.path = path;
				this.action = null;
				this.do_enter = [];
				this.do_exit = null;
				this.params = {};
				Path.routes.defined[path] = this;
			}
		},
		'routes': {
			'current': null,
			'root': null,
			'rescue': null,
			'previous': null,
			'defined': {}
		}
	};
	Path.core.route.prototype = {
		'to': function (fn) {
			this.action = fn;
			return this;
		},
		'enter': function (fns) {
			if (fns instanceof Array) {
				this.do_enter = this.do_enter.concat(fns);
			} else {
				this.do_enter.push(fns);
			}
			return this;
		},
		'exit': function (fn) {
			this.do_exit = fn;
			return this;
		},
		'partition': function () {
			var parts = [],
				options = [],
				re = /\(([^}]+?)\)/g,
				text, i;
			while (text = re.exec(this.path)) {
				parts.push(text[1]);
			}
			options.push(this.path.split("(")[0]);
			for (i = 0; i < parts.length; i++) {
				options.push(options[options.length - 1] + parts[i]);
			}
			return options;
		},
		'run': function () {
			var halt_execution = false,
				i, result, previous;

			if (Path.routes.defined[this.path].hasOwnProperty("do_enter")) {
				if (Path.routes.defined[this.path].do_enter.length > 0) {
					for (i = 0; i < Path.routes.defined[this.path].do_enter.length; i++) {
						result = Path.routes.defined[this.path].do_enter[i].apply(this, null);
						if (result === false) {
							halt_execution = true;
							break;
						}
					}
				}
			}
			if (!halt_execution) {
				Path.routes.defined[this.path].action();
			}
		}
	};

	/*--------------------------------------------------------*/
	hydra.module = function (name) {
		return new Mvc(name);
	};

	hydra._ = _;

})(window);