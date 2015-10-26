app.store('todoStore', function (state) {
	var root = this;
	var database = new Firebase('https://hydra-todo.firebaseio.com/');

	return {
		initialState: function () {
			var data = {
				title: '任务',
				todoList: []
			};
			state.setState(data);
		},

		queryAll: function () {
			var data = state.getState();
			data.todoList = [];

			database.endAt().limitToFirst(100).on('value', function (dataSnapshot) {
				var dataCopy = dataSnapshot.val();

				for (var k in dataCopy) {
					var o = dataCopy[k];
					data.todoList.push({
						k: k,
						text: o.text,
						state: o.state,
						time: o.time
					})
				}

				data.todoList.sort(function (i0, i1) {

				});

				state.setState(data);
			});
		},

		addItem: function (text, func) {
			var data = state.getState();

			var todo = {
				k: hydra._.md5(),
				type: 'codding',
				text: text,
				state: 0,
				time: new Date().getTime()
			};

			var newTodo = database.push();
			newTodo.set(todo, function (error) {
				if (!error) {
					func && func();
					state.setState(data);
				} else {
					alert(error);
				}
			});
		},

		deleteItem: function (did) {
			var data = state.getState();
			data.list = data.list.filter(function (item) {
				if (item.id == did) {
					return false;
				} else {
					return true;
				}
			});
			state.setState(data);
		}

	};
});