hydra.component('list', {
	props: {},
	template: "<template name=\"list\"><ul class=\"component-list\">{{#each data}}{{#if template == \'todoItem\'}}{{#> js/component/list/listItem/todoItem}}{{/if}}{{/each}}</div></template>",
	render: function () {
		var el = this.$el;

		var ul = el.querySelector('.component-list');
		var h = window.innerHeight - 160;

		el.style.height = h + 'px';
		ul.style.height = h + 'px';
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