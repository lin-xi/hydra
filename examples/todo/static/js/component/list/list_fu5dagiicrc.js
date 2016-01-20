hydra.component('list', {
	props: {},
	template: "<template name=\"list\"><ul class=\"component-list\">{{#each data}}{{#if template == \'todoItem\'}}{{#> js/component/list/listItem/todoItem}}{{/if}}{{/each}}</div></template>",
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