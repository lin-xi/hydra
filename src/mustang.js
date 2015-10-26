(function () {
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
					key = _.trim(parts[0]),
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

})();