var app = window.app = hydra.module('todo');

app.config({
	"base": 'js',
	"router": {
		'/': {
			controller: 'IndexController',
			template: 'views/index'
		}
	},
	"view": '#view'
});