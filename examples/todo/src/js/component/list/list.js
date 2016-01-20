hydra.component('list', {
	props: {},
	template: __inline('./list.tpl'),
	render: function () {

	},
	events: function () {
		var el = this.$el;
		var state = this.state;
		var eventPipe = this.eventPipe;

		return {
			'.component-list swapLeft': function () {

			},
			'.component-list swaprRight': function () {

			}
		};
	}
});