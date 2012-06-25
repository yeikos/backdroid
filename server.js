/*!
 * @name Backdroid v1.0.0 Beta
 * @autor yeikos
 
 * Copyright 2012 - http://www.yeikos.com - https://github.com/yeikos/backdroid
 * GNU General Public License
 * http://www.gnu.org/licenses/gpl-3.0.txt
 */

 var Express = require('express'),
	SocketIO = require('socket.io'),
	Crypto = require('crypto'),
	Path = require('path'),
	Aes = require('./aes.js');

var Public = {

	aes: Aes(),

	sockets: [],

	database: [],

	setCommand: function(name, value, send, success) {

		if (typeof name != 'string' || !name.length)

			return { error: 'name' };

		// Si el comando es correcto lo añadimos

		Public.database.push({

			// Identificador único del comando

			id: Crypto.randomBytes(16).toString('hex'),

			// Fecha actual

			date: parseInt(new Date()/1000, 10),

			// Nombre del comando

			command: name,

			// Valor del comando

			value: value,

			// Marcador de enviado

			sent: false,

			// Función ejecutada cuando el cliente recibe el comando

			onSend: send,

			// Función ejecutada cuando el cliente envia una respuesta

			onSuccess: success,

			// Contenedor de posibles respuestas

			response: []

		});

		return { success: true };

	},

	createPanelServer: function(option) {

		// Las opciones son obligatorias

		if (!option || typeof option != 'object')

			throw 'Error backdroid.createPanelServer: option';

		if (typeof option.public_path != 'string')

			throw 'Error backdroid.createPanelServer: option.public_path';

		if (typeof option.password != 'string' || !option.password.length)

			throw 'Error backdroid.createPanelServer: option.password';

		if (isNaN(option.port) || (option.port%1) || option.port <= 0)

			throw 'Error backdroid.createPanelServer: option.port';

		if (isNaN(option.ws_port) || (option.ws_port%1) || option.ws_port <= 0)

			throw 'Error backdroid.createPanelServer: option.ws_port';

		if (typeof option.ws_encryption_password != 'string' || !option.ws_encryption_password.length)

			throw 'Error backdroid.createPanelServer: option.ws_encryption_password';

		// Servidor HTTP

		var httpServer = Express.createServer().listen(option.port),

		// Servidor WebSocket

			wsServer = SocketIO.listen(option.ws_port);

		// Configuración HTTP

		if (option.debug)

			httpServer.use(Express.logger({ format: '[PANEL] :method :url' }));

		httpServer.use(Express.bodyParser());
		httpServer.use(httpServer.router);

		httpServer.use(Express['static'](Path.dirname(process.mainModule.filename) + '/' + option.public_path));

		httpServer.all('/', function(request, response) {

			response.redirect('/index.html');

		});

		// Configuración WebSocket

		wsServer.set('log level', 1).sockets.on('connection', function(socket) {

			// Identificación

			socket.on('login', function(data) {

				if (!data || data.password != option.password)

					return socket.emit('auth', { error: 'password' });

				Public.sockets.push(socket);

				socket.authed = true;

				socket.emit('auth', { success: true });
				socket.emit('commands', { items: Public.database });

			});

			// Obtención de todos los comandos

			socket.on('getCommands', function() {

				// Es necesario estár identificado

				if (!socket.authed)

					return socket.emit('auth', { error: true });

				// Enviamos la base de datos

				socket.emit('commands', { items: Public.database });

			});

			// Inserción de comando

			socket.on('setCommand', function(data) {

				// Es necesario estár identificado

				if (!socket.authed)

					return socket.emit('auth', { error: true });

				// Los datos deben ser un objeto

				if (!data || typeof data != 'object')

					return socket.emit('setCommand', { error: 'data' });

				// Establecemos el comando

				var result = Public.setCommand(data.command, data.value);

				// Enviamos el resultado al cliente

				socket.emit('setCommand', result);

				// Si no hubo ningún error enviamos la base de datos actualizada al cliente

				if (!result.error)
					
					socket.emit('commands', { items: Public.database });

			});

		});

	},

	createCommandServer: function(option) {

		// Las opciones son obligatorias

		if (isNaN(option.port) || (option.port%1) || option.port <= 0)

			throw 'Error backdroid.createCommandServer: option.port';

		if (typeof option.password != 'string' || !option.password.length)

			throw 'Error backdroid.createCommandServer: option.password';

		if (typeof option.encryption_password != 'string' || !option.encryption_password.length)

			throw 'Error backdroid.createCommandServer: option.encryption_password';

		// Servidor HTTP

		var httpServer = Express.createServer().listen(option.port),
			sendEncrypt;

		if (option.debug)

			httpServer.use(Express.logger({ format: '[COMMAND] :method :url' }));

		httpServer.use(Express.bodyParser());
		httpServer.use(httpServer.router);

		httpServer.all('*', function(request, response, next) {

			sendEncrypt = function(data) {

				return response.send(Public.aes.encrypt(JSON.stringify(data), option.encryption_password, 256));

			};

			next();

		});

		// Configuración HTTP

		httpServer.post('/getCommands.json', function(request, response) {

			// La contraseña de acceso debe ser correcta
			
			if (request.body.password != option.password)

				return response.json({ error: 'auth' });

			var buffer = [];

			// Recorremos la base de datos

			Public.database.forEach(function(item) {

				// Si aún no ha sido enviado

				if (!item.sent) {

					// Activamos el marcador sent y lo añadimos al contenedor

					item.sent = true;

					if (typeof item.onSend == 'function')

						item.onSend.apply(item, [item.command, item.value]);
					
					buffer.push(item);

				}

			});

			// Enviamos todos los comandos nuevos

			var date = parseInt(new Date()/1000, 10);
			
			Public.sockets.forEach(function(socket) {

				if (buffer.length) {

					socket.emit('commands', {

						date: date,

						items: Public.database

					});

				} else {

					socket.emit('commands', {

						date: date

					});

				}

			});
			
			sendEncrypt({ items: buffer });

		});

		// Respuesta de las peticiones

		httpServer.post('/setResponse.json', function(request, response) {

			var body = request.body,
				data = body.data,
				date = parseInt(new Date()/1000, 10),
				found;

			// La contraseña de acceso debe ser correcta

			if (body.password != option.password)

				return response.json({ error: 'auth' });

			// Intentamos convertir los datos a JSON

			try {

				data = JSON.parse(Public.aes.decrypt(data, option.encryption_password, 256));

			} catch (e) {

				data = null;

			}

			// La conversión ha de ser satisfactoria

			if (!data || typeof data != 'object')

				return sendEncrypt({ error: 'data' });

			// El identificador es obligatorio

			if (typeof data.id != 'string' || !data.id.length)

				return sendEncrypt({ error: 'id' });

			// Recorremos la base de datos

			Public.database.forEach(function(item) {

				// Si el identificador coincide

				if (item.id == data.id) {

					found = true;

					// Añadimos una nueva respuesta al comando con dicho identificador

					item.response.push({

						// Fecha actual
				
						date: date,

						// Datos de la respuesta

						value: data.value

					});

					if (typeof item.onSuccess == 'function')

						item.onSuccess.apply(item, [item.command, item.value, data.value]);

				}

			});

			// Si la respuesta no tiene un comando al que permanecer

			if (!found) {

				// Si no se incluye el comando al que pertenece

				if (!data.request || typeof data.request != 'object' || typeof data.request.command != 'string')

					// Devolvemos error

					return sendEncrypt({ error: 'request' });

				// Añadimos un nuevo comando, como enviado, con dicha respuesta

				Public.database.push({

					// Identificador único del comando

					id: data.id,

					// Fecha actual

					date: date,

					// Nombre del comando

					command: data.request.command,

					// Valor del comando

					value: data.request.value,

					// Marcador de enviado activado

					sent: true,

					// Contenedor con la respuesta

					response: [{

						// Fecha actual
				
						date: date,

						// Datos de la respuesta

						value: data.value

					}]

				});

			}

			// Recorremos los usuarios identificados del panel

			Public.sockets.forEach(function(socket) {

				// Actualizamos los comandos de los usuarios

				socket.emit('commands', {

					date: date,

					items: Public.database

				});

			});

			sendEncrypt({ success: true });

		});

	}

};

module.exports = Public;