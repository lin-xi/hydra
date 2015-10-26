app.controller('IndexController', 'stores/todoStore', function (store) {

	store.initialState();

	store.queryAll();


	Template.index.events({
		'.add-btn': function (e) {
			var input = $('#addTaskInput');

		}
	})

});