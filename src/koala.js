(function (window) {

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