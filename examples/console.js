var backdroid = require('backdroid');

// Servidor de comandos

backdroid.createCommandServer({

	port: 8888,
	password: 'secret',
	encryption_password: 'secret'
	
});

process.stdin.resume();
process.stdin.setEncoding('utf8');

// Intervenimos la entrada de datos en la consola

process.stdin.on('data', function(text) {

	// Obtenemos la línea introducida y la separamos por espacios

	var spl = text.split(/[\n\r]+/).shift().split(' '),

	// Nombre del comando

		command = spl.shift(),

	// Valor del comando

		temp = spl.join(' '),
		value;

	// Intentamos convertir el valor a formato JSON

	try {

		value = JSON.parse(temp);

	} catch(e) {

	// Si la conversión es errónea lo dejamos como valor literal

		value = temp;

	}

	// Si el comando no se encuentra vacío

	if (command.length)

		// Enviamos el comando

		backdroid.setCommand(command, value, function(command, value) {

			console.log('[sent]', command, value);

		}, function(command, value, response) {

			console.log('[response]', command, value, response);

		});

});