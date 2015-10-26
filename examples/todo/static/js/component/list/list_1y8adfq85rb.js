hydra.component('list', {
	props: {},
	template: "<template name=\"list\"><ul class=\"component-list\">{{#each data}}{{#if template == \'todoItem\'}}{{#> js/component/list/listItem/todoItem}}{{/if}}{{/each}}</div></template>",
	render: function () {
		var el = this.$el;

		var w = dialog.offsetWidth,
			h = dialog.offsetHeight;

		var l = (window.innerWidth - w) / 2;
		var t = (window.innerHeight - h) / 2;

		el.style.height = l + 'px';
		dialog.style.top = t + 'px';

	},
	events: function () {
		var el = this.$el;

	}
});