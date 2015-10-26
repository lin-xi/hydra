app.controller('IndexController', 'stores/todoStore', function (store) {

	store.initialState();

	store.queryAll();


	Template.index.events({
		'': function () {

		}
	})

});