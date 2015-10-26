Mustang.component('AlertDialog', {
	props: {},
	template: "<template name=\"alertDialog\"><div class=\"component-modal-dialog\"><div class=\"mask\"></div><div class=\"dialog\"><div class=\"modal-head\"><div class=\"title\">{{title}}</div><div class=\"close-button\">×</div></div><div class=\"modal-body\"><div class=\"component-alert-content\">{{>transclude}}</div></div></div></div></template>",
	initState: function () {
		return [];
	},
	render: function () {
		var el = this.$el;
		var dialog = el.querySelector('.dialog');

		var w = dialog.offsetWidth,
			h = dialog.offsetHeight;

		var l = (window.innerWidth - w) / 2;
		var t = (window.innerHeight - h) / 2;

		dialog.style.left = l + 'px';
		dialog.style.top = t + 'px';
	},
	events: function () {
		var el = this.$el;

		return {
			'.close-button click': function (e) {
				el.parentNode.removeChild(el);
			}
		};
	}
});