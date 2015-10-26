hydra.component('Topbar', {
	props: {},
	template: __inline('./topbar.tpl'),
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