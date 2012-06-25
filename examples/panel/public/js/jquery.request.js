/*!
 * @name jQuery.request v2.5.0 Alpha
 * @autor yeikos
 
 * Copyright 2012
 * GNU General Public License
 * http://www.gnu.org/licenses/gpl-3.0.txt
 */

;(function($, undefined) {

	$.request = function(option) {

		return $({}).request(option);

	};

	$.request.session = parseInt(Number(new Date()), 10);

	$.request.listener = function(pattern, plugin) {
		
		var handler = function(event, context) {

			var $self = $(this),
				data = $self.data(),
				url = $self.is('a') ? $self.attr('href') : $self.attr('action'),
				match;

			if ((data.request !== undefined || (match = pattern.exec(url))) && data.ignore === undefined && !$self.attr('target')) {

				$self.off('requestContext.match').on('requestContext.match', function(event, context) {

					context.match = match;

				});

				$self.request({

					plugin: plugin

				});

				event.preventDefault();

			}

		};

		$(function() {

			$('body').on('click.request', 'a', handler).on('submit.request', 'form', handler);

		});

	};

	$.request.defaults = {

		plugin: []

	};

	$.request.plugin = {};

	$.request.ajax = function(context) {

		// Accesos directos

		var $self = context.$element,

			option = context.option;

		// Si es la primera vez que se ejecuta la petición

		if (!$self.data('__init__'))

			// Definimos un marcador y ejecutamos el evento init (sólo una vez)
		
			$self.data('__init__', true).trigger('init', [context]);
	
		// Recorremos los eventos ajax originales

		$.each(['error', 'success'], function(index, eventName) {

			// Formamos el nuevo nombre del elemento (request*)
			
			var name = eventName.charAt(0).toUpperCase() + eventName.substr(1);

			// Si el nombre del evento se encuentra definido en las opciones como una función

			if (typeof option[eventName] == 'function')

				// Enlazamos el evento con el contexto

				$self.on('request' + name + '.option', option[eventName]);

			// Definimos los eventos ajax originales, reemplazando cualquier otro
		
			option[eventName] = function() {

				// Llamamos al evento pasándole el contexto y los parámetros originales de la función ajax

				$self.trigger('request' + name, [context].concat([].slice.call(arguments)));

				if (eventName == 'success' && context.busy)

					context.busy = false;

			};
			
		});

		// Llamamos al evento requestSend y le pasamos el contexto

		$self.trigger('requestSend', [context]);

		// Si context.stop se encuentra definido

		if (context.stop)

			// Desactivamos el marcador de ocupado y detenemos la petición ajax

			return (context.busy = false);

		// Ejecutamos la petición ajax
		
		return context.ajax();
	
	};

	$.fn.request = function(option) {

		// Creamos el contexto

		var context = {

			// Elemento actual

			$element: $(this),

			// Opciones

			option: $.extend({}, $.request.defaults, (typeof option == 'object') ? option : {}),

			xhr: null,

			stop: false,

			ajax: function() {

				// Indicamos que la petición no se encuentra parada

				context.stop = false;

				// Activamos el marcador de ocupado

				context.busy = true;

				option.url += ((option.url.indexOf('?') == -1) ? '?' : '&') + $.param({

					_sid_: $.request.session,
					_nocache_: Number(new Date())

				});

				// Llamamos a la función ajax original

				return (option.xhr = $.ajax(option));

			}

		};

		context.$element.trigger('requestContext', [context]);

		// Accesos directos

		option = context.option;

		var $self = context.$element,

		// Datos del elemento

			data = $self.data(),

		// Por defecto la lista de plugin se obtiene de las opciones

			plugin = option.plugin,

		// Otros

			temp;

		// Si la petición del elemento ya se está ejecutando detenemos el código

		if (context.busy)

			return this;

		// Indicamos que a partir de ahora el elemento se encuentra ocupado

		context.busy = true;

		// Si se trata de un elemento

		if ($self.context) {

			// Obtenemos la lista de plugins del elemento (data-request)

			if ((typeof data.request == 'string'))

				plugin = $.request.str2argv(data.request);

			if ($self.is('a')) { // Si es un enlace

				// Establecemos su dirección (href), método GET y datos vacíos

				option.url = $self.attr('href');
				option.type = 'GET';
				option.data = {};

			} else if ($self.is('form')) { // Si es un formulario
				
				// Establecemos la dirección (action), método del formulario y los datos de éste en forma de objeto

				option.url = $self.attr('action');
				option.type = $self.attr('method');
				option.data = $.request.unparam($self.serialize());

			} else { // Si no es ni un enlace ni un formulario
			
				// Retornamos el elemento

				context.busy = false;

				return this;
				
			}

			// Añadimos data-fields a los datos

			$.extend(option.data, $.request.str2argv(data.fields, true));

		}

		// Ejecutamos los plugins en formato array [one, two, three]

		if ((temp = $.type(plugin)) == 'array') {

			$.each(plugin, function(index, plugin) {

				if (typeof (temp = $.request.plugin[plugin]) == 'function')
				
					temp.call(context);
				
			});

		} else if (temp == 'object') { // O en formato objeto { one: [values], two: [values]}

			$.each(plugin, function(pluginName, pluginValue) {

				if (typeof (temp = $.request.plugin[pluginName]) == 'function')
				
					temp.apply(context, pluginValue);
				
			});

		}

		// Llamamos a la función $.request.ajax pasándole el contexto

		$.request.ajax(context);
		
		// Retornamos el elemento

		return this;

	};

	$.request.str2argv = function str2argv(i, s) {

		if (typeof i != 'string' || !i.length)

			return {};

		var o = {}, e = /([_\-\w]+)\s*(?:\((.*?)\))?/gi, m, x, y, z, w;
		
		while ((m = e.exec(i)))

			o[m[1]] = (x = m[2]) ? (function() {

				for(y in (x = x.split(/\s*,\s*/)))

					x[y] = /^\s*$/.test(z = x[y].replace(/^\s+/, '').replace(/\s+$/, '')) ? null : // null
					(z == 'true') ? true : (z == 'false') ? false : // boolean
					((w = /^(?:'(.*?)')|(?:"(.*?)")$/.exec(z))) ? (w[1] || w[2]) : // literal string
					(!isNaN(z)) ? parseFloat(z) : // number
					z; // string;

				return s ? x[0] : x;

			})() : [];

		return o;

	};

	$.request.unparam = function(str) {

		// Variables de itineraciones

		var index, subindex,
			items, subitems,
			item, subitem,

		// Otras variables

			key, value, temp, stemp, link, size,

		// Expresiones regulares

			expBrackets = /\[(.*?)\]/g,
			expVarname = /(.+?)\[/,

		// Contenedor para almacenar el resultado

			result = {};

		// Descartamos entradas que no sean cadenas de texto o se encuentren vacías

		if ((temp = typeof str) != 'string' || (temp == 'string' && !temp.length))

			return {};

		// Decodificamos la entrada y la dividimos por bloques

		items = decodeURIComponent(str).split('&');

		// Es necesario que los datos anteriores no se encuentren vacíos

		if (!(temp = items.length) || (temp == 1 && temp === ''))

			return result;

		// Recorremos los datos

		for(index in items) {
			
			item = items[index];

			// Es necesario que no se encuentre vacío

			if (!item.length)

				continue;

			// Iniciamos la divisón por el caracter igual

			temp = item.split('=');

			// Obtenemos el nombre de la variable

			key = temp.shift();

			// Y su valor

			value = temp.join('=').replace(/\+/g, ' ');

			// Es necesario que el nombre de la clave no se encuentre vacío

			if (!key.length)

				continue;

			// Comprobamos si el nombre de la clave tiene anidaciones

			subitems = [];

			while((temp = expBrackets.exec(key)))

				subitems.push(temp[1]);

			// Si no tiene anidaciones

			if (!(size = subitems.length)) {

				// Guardamos el resultado directamente

				result[key] = value;

				// Continuamos con el siguiente dato

				continue;

			}

			// Decrementamos el tamaño de las anidaciones para evitar repetidas restas

			size--;

			// Obtenemos el nombre real de la clave con anidaciones

			temp = expVarname.exec(key);

			// Es necesario que se encuentre y que no esté vacío

			if (!temp || !(key = temp[1]) || !key.length)

				continue;

			// Al estar todo correcto, comprobamos si el contenedor resultante es un objecto

			if (typeof result[key] != 'object')

				// Si no lo es forzamos a que lo sea

				result[key] = {};

			// Creamos un enlace hacia el contenedor para poder reccorrerlo a lo largo de la anidación

			link = result[key];

			// Recorremos los valores de la anidación
			
			for (subindex in subitems) {

				subitem = subitems[subindex];

				// Si el nombre de la clave se encuentra vacío (varname[])

				if (!(temp = subitem).length) {

					temp = 0;

					// Recorremos el enlace actual

					for (stemp in link)

						// Si el índice es un número entero, positivo y mayor o igual que el anterior

						if (!isNaN(stemp) && stemp >= 0 && (stemp%1 === 0) && stemp >= temp)

							// Guardamos dicho número y lo incrementamos en uno

							temp = Number(stemp)+1;

					
				}

				// Si se llegó al final de la anidación

				if (subindex == size) {

					// Establecemos el valor en el enlace

					link[temp] = value;

				} else if (typeof link[temp] != 'object') { // Si la anidación no existe

					// Se crea un objeto con su respectivo enlace

					link = link[temp] = {};

				} else { // Si la anidación existe

					// Cambiamos el enlace sin sobreescribir datos

					link = link[temp];

				}

			}

		}

		// Retornamos el resultado en forma de objeto

		return result;

	};

	$(function() {

		// Enlazamos todos los botones

		$('body').on('click.fixEOTarget', 'input[type=submit], button', function() {

			var $self = $(this),
				$form = $self.closest('form'),
				remove = function() {

					// Eliminamos el elemento .fixEOTarget

					$('.fixEOTarget', $form).remove();

				}, name;

			// Si el elemento pertenece a un formulario

			if ($form) {

				// De primeras nos deshacemos del elemento .fixEOTarget

				remove();

				$('.fixEOTarget', $form).remove();

				// Si el elemento sobre el que se pulsó tiene nombre

				if ((name = $self.attr('name')) && name.length)

					// Añadimos al formulario el elemento .fixEOTarget con dicho nombre y valor

					$('<input type="hidden" class="fixEOTarget" />').attr({

						name: name, value: $self.val()

					}).appendTo($form);

				// Damos un margen de 200 ms y eliminamos el elemento .fixEOTarget

				setTimeout(remove, 200);

				/*
				
					El setTimeout se debe a que no tenemos el control cuando se envía el formulario desde otros eventos,
					como un submit desde un input[type=text], en ese caso, .fixEOTarget no debe estar definido, ya que
					no se pulsó sobre ningún botón. Es por ello que damos un margen pequeño para que el evento submit capte
					el valor de .fixEOTarget y lo eliminamos a continuación, para evitar el problema descrito.

				*/
		
			}

		});

	});

})(jQuery);