hydra.component('Topbar', {
	props: {},
	template: "<template name=\"topbar\"><div class=\"component-topbar\"><div class=\"bar-left\"><i class=\"icon-chevron-thin-left\"></i></div><div class=\"bar-title\">{{title}}</div><div class=\"bar-right\"></div></div></template>",
	render: function () {
		var el = this.$el;

	},
	events: function () {
		var el = this.$el;

		return {
			'.bar-left click': function (e) {}
		};
	}
});