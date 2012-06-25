(function($) {

	$.backdroid = function(option) {

		// Las opciones son obligatorias
		
		if ($.type(option) != 'object')

			throw 'jQuery.backdroid: option must be a object.';

		if (typeof option.ws_server != 'string' || !option.ws_server.length)

			throw 'jQuery.backdroid: option.ws_server is needed.';

		// Obtenemos el script de Socket.IO

		$.getScript(option.ws_server + '/socket.io/socket.io.js', function() {

			init();

		});

		function init() {

			// Conectamos con el servidor WebSocket

			var socket = io.connect(option.ws_server),

				$loginForm = $('#login form'),

				$setCommandForm = $('#setCommand form');

			// Aplicamos el foco en la contraseña del formulario

			$('input[name=password]', $loginForm).focus();

			// Autentificación

			socket.on('auth', function(response) {

				// Si el cliente no se encuentra autentificado

				if (response.error) {

					// Ocultamos los elementos .auted y mostramos .no-authed

					$('.authed').hide();
					$('.no-authed').show();

					// Si el error es referente a la contraseña

					if (response.error == 'password')

						alert('La contraseña no es correcta');

				} else {

					// De lo contrario mostramos .authed y ocultamos .no-authed

					$('.authed').show();
					$('.no-authed').hide();

				}

			});

			// Establecer comando

			socket.on('setCommand', function(response) {

				// Si hubo un error en la insercción de un comando

				if (response.error)

					// Mostramos una advertencia y detenemos el código

					return alert('Error setCommand: ' + response.error);

				// Si todo fue correctamente vaciamos los campos del formulario

				$('#setCommandName, #setCommandValue, #setCommandValueExpanded').val('');

			});

			// Obtener base de datos

			socket.on('commands', function(response) {

				console.log('commands', response);

				// Si se especifica la fecha de actualización

				if (response.date)

					// Cambiamos del contenedor

					$('#online span').text(date('d/m/Y H:i:s', response.date));

				if ($.type(response.items) != 'array')

					return;

				// Vaciamos el contenedor de comandos

				var $container = $('#commands').empty(),
					$ul = $('<ul></ul>');

				// Recorremos todos los comandos

				$.each(response.items, function(index, item) {

					var $li = $('<li></li>').html('<span class="date">[' + date('d/m/Y H:i:s', item.date) + ']</span> ' + $('<span/>').html(item.command).text()),

						$subul = $('<ul></ul>').appendTo($li);

					// Si el comando aún no ha sido enviado

					if (!item.sent)

						// Cambiamos el texto a gris

						$li.css('color', 'grey');

					// Recorremos las respuestas del comando

					$.each(item.response, function(subindex, subitem) {

						var $subli = $('<li></li>').html('<span class="date">[' + date('d/m/Y H:i:s', subitem.date) + ']</span> ');

						$result = $('<span></span>').text(JSON.stringify(subitem.value)).appendTo($subli);

						if ($.type(option.command) == 'object' && typeof option.command[item.command] == 'function')

							option.command[item.command].apply(subitem, [item, subitem.value, $result]);

						$subli.appendTo($subul);

					});

					$subul.appendTo($li.appendTo($ul));

				});

				$ul.appendTo($container);

			});

			// Expandir el valor del comando (textarea)

			$('input[name=expand]', $setCommandForm).click(function() {

				if ($(this).is(':checked')) {

					$('#setCommandValue', $setCommandForm).attr('name', '').hide();
					$('#setCommandValueExpanded', $setCommandForm).attr('name', 'value').show();

				} else {

					$('#setCommandValue', $setCommandForm).attr('name', 'value').show();
					$('#setCommandValueExpanded', $setCommandForm).attr('name', '').hide();

				}
				
			});

			// Convertir a JSON el valor del comando

			$setCommandForm.on('requestSend', function(event, context, response) {

				if ($('input[name=json]').is(':checked')) {

					var value = $('input[name=value]', this).val(),
						result;

					try {

						result = JSON.parse(value);

					} catch(e) {

						result = $.request.str2argv(value, true);

					}

					context.option.data.value = result;

				}

			});

			// Intervenir los formularios y enlaces que empiecen por /emit/*

			$.request.listener(/^\/emit\/([\w\d\_\/-]+)?/, ['controller']);

			$.request.plugin.controller = function() {

				this.$element.off('requestSend.controller').on('requestSend.controller', function(event, context, response) {

					// Obtenemos el nombre del evento, sus datos y lo enviamos por WebSocket

					socket.emit(context.match[1], context.option.data);

					// Evitamos que se lleve a cabo la petición AJAX

					context.stop = true;

				});
				
			};


		};

	};

})(jQuery);

// http://phpjs.org/functions/date:380

function date(a,b){var c=this,d,e,f=/\\?([a-z])/gi,g,h=function(a,b){if((a=a+"").length<b){return(new Array(++b-a.length)).join("0")+a}return a},i=["Sun","Mon","Tues","Wednes","Thurs","Fri","Satur","January","February","March","April","May","June","July","August","September","October","November","December"];g=function(a,b){return e[a]?e[a]():b};e={d:function(){return h(e.j(),2)},D:function(){return e.l().slice(0,3)},j:function(){return d.getDate()},l:function(){return i[e.w()]+"day"},N:function(){return e.w()||7},S:function(){var a=e.j();return a<4|a>20&&["st","nd","rd"][a%10-1]||"th"},w:function(){return d.getDay()},z:function(){var a=new Date(e.Y(),e.n()-1,e.j()),b=new Date(e.Y(),0,1);return Math.round((a-b)/864e5)+1},W:function(){var a=new Date(e.Y(),e.n()-1,e.j()-e.N()+3),b=new Date(a.getFullYear(),0,4);return h(1+Math.round((a-b)/864e5/7),2)},F:function(){return i[6+e.n()]},m:function(){return h(e.n(),2)},M:function(){return e.F().slice(0,3)},n:function(){return d.getMonth()+1},t:function(){return(new Date(e.Y(),e.n(),0)).getDate()},L:function(){var a=e.Y();return a%4==0&a%100!=0|a%400==0},o:function(){var a=e.n(),b=e.W(),c=e.Y();return c+(a===12&&b<9?-1:a===1&&b>9)},Y:function(){return d.getFullYear()},y:function(){return(e.Y()+"").slice(-2)},a:function(){return d.getHours()>11?"pm":"am"},A:function(){return e.a().toUpperCase()},B:function(){var a=d.getUTCHours()*3600,b=d.getUTCMinutes()*60,c=d.getUTCSeconds();return h(Math.floor((a+b+c+3600)/86.4)%1e3,3)},g:function(){return e.G()%12||12},G:function(){return d.getHours()},h:function(){return h(e.g(),2)},H:function(){return h(e.G(),2)},i:function(){return h(d.getMinutes(),2)},s:function(){return h(d.getSeconds(),2)},u:function(){return h(d.getMilliseconds()*1e3,6)},e:function(){throw"Not supported (see source code of date() for timezone on how to add support)"},I:function(){var a=new Date(e.Y(),0),b=Date.UTC(e.Y(),0),c=new Date(e.Y(),6),d=Date.UTC(e.Y(),6);return 0+(a-b!==c-d)},O:function(){var a=d.getTimezoneOffset(),b=Math.abs(a);return(a>0?"-":"+")+h(Math.floor(b/60)*100+b%60,4)},P:function(){var a=e.O();return a.substr(0,3)+":"+a.substr(3,2)},T:function(){return"UTC"},Z:function(){return-d.getTimezoneOffset()*60},c:function(){return"Y-m-d\\TH:i:sP".replace(f,g)},r:function(){return"D, d M Y H:i:s O".replace(f,g)},U:function(){return d/1e3|0}};this.date=function(a,b){c=this;d=b==null?new Date:b instanceof Date?new Date(b):new Date(b*1e3);return a.replace(f,g)};return this.date(a,b)}