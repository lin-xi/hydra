Template.todoItem.filter({
	dateTime: function (input) {
		var out = "";
		if (input && input != '0') {
			var d = new Date(input);
			var dt = [],
				ti = [];
			dt.push(d.getFullYear());
			dt.push(d.getMonth() + 1);
			dt.push(d.getDate());
			ti.push(d.getHours() < 10 ? '0' + d.getHours() : d.getHours());
			ti.push(d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes());
			ti.push(d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds());
			out = dt.join('/') + ' ' + ti.join(':');
		}
		return out;
	}
});