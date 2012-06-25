var backdroid = require('backdroid');

// Notificación

backdroid.setCommand('notification', { title: 'hello', message: 'world' });

// Nivel de batería

backdroid.setCommand('battery', null, null, function(command, value, response) {

	console.log(command, response);

});

// Localización

backdroid.setCommand('location', { provider: 'CELL' }, function(command, value, response) {

	console.log(command, 'request sent');

}, function(command, value, response) {

	console.log(command, 'request received', response);

});

// Servidor de comandos

backdroid.createCommandServer({

	port: 8888,
	password: 'secret',
	encryption_password: 'secret'
	
});