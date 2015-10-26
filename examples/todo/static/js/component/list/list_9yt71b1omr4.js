hydra.component('list', {
	props: {},
	template: "<template name=\"list\"><ul class=\"component-list\">{{#each data}}{{#if template == \'todoItem\'}}{{#> js/component/list/listItem/todoItem}}{{/if}}{{/each}}</div></template>",
	render: function () {
		var el = this.$el;

	},
	events: function () {
		var el = this.$el;

	}
});