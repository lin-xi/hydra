app.controller('IndexController', 'stores/todoStore', function (store) {

	store.initialState();

	store.queryAll();


	Template.index.events({
		'.add-btn click': function (e) {
			var input = $('#addTaskInput');
			if (input.val()) {
				store.addItem(input.val(), function () {
					hydra.loadComponent('alertDialog', function (com) {
						fn
					})
				});
				input.val();
			}
		}
	})

});