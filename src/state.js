function newState(name, func) {
	var object = {
		name: name,
		state: {},
		setState: function (data) {
			for (var key in data) {
				this.state[key] = data[key];
			}
			func();
		},
		getState: function () {
			return this.state;
		}
	};
	// function observer() {
	// 	console.log(changes);
	// 	func();
	// }
	// Object.observe(object, observer);
	//Object.deliverChangeRecords(observer);
	return object;
}
var StoreUtil = {
	get: function (url, param, func) {
		_.ajax.get(url, param, func);
	},
	post: function (url, param, func) {
		_.ajax.post(url, param, func);
	}
};