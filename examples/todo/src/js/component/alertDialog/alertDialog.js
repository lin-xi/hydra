Mustang.component('AlertDialog', {
	props: {
		title: '提示'
	},
	template: __inline('./alertDialog.tpl'),
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