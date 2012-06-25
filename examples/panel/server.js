var backdroid = require('backdroid');

// Servidor del panel

backdroid.createPanelServer({

	public_path: '/public',
	password: 'secret',
	port: 80,
	ws_port: 8080,
	ws_encryption_password: 'secret',

	debug: true

});

// Servidor de comandos

backdroid.createCommandServer({

	port: 8888,
	password: 'secret',
	encryption_password: 'secret',

	debug: true
	
});