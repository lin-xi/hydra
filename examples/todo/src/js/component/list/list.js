hydra.component('list', {
	props: {},
	template: __inline('./list.tpl'),
	render: function () {
		var el = this.$el;

		var ul = el.querySelector('.component-list');
		var h = window.innerHeight - 160;

		el.style.height = h + 'px';
		ul.style.height = h + 'px';
	},
	events: function () {
		var el = this.$el;

		return {
			'.component-list swapLeft': function () {

			},
			'.component-list swaprRight': function () {

			}
		};
	}
});