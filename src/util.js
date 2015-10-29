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
};