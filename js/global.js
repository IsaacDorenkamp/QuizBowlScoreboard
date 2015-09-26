const GLOBALS = {
	SOCKET: {
		'protocol': 'ws',
		'host': 'quizbowl.us',
		'test_host': 'localhost',
		'port': '8080'
	}
};

//Prototype Modifying!!!! DO NOT MODIFY!!!
//Unless you know everything about what
//could possibly go wrong when modifying
//the prototypes of Javascript Natives,
//then do not attempt to modify!

Object.defineProperty( String.prototype, 'split_slice', {
	value: function( delim, index, endex ){ //End + Index = endex XD
		var cur = this.toString(); //Calling toString on a String object. Imagine that.

		var arr = cur.split( delim );
		arr = arr.slice( index, endex || arr.length );

		return arr.join( delim );
	},
	enumerable: false
} );

//You may modify the code after this point.

function WebsocketCommander( socket ){
	var socket_available = false;
	var current_open_callback = socket.onopen;
	var current_close_callback = socket.onclose;
	socket.onopen = function(){
		socket_available = true;

		if( current_open_callback ) current_open_callback();
	};
	socket.onclose = function(){
		if( current_close_callback ) current_close_callback();

		socket_available = false;
	};

	var self = this;
	this.Send = function( instruction, data ){
		if( !socket_available ){
			console.log( "Socket not available." );
			return;
		}

		var instruction = self.CreateInstruction( instruction, data );
		socket.send( instruction );
	}

	this.CreateInstruction = function( instruction, data ){
		var output = instruction;
		for( var key in data ){
			output += '\n' + key + ':' + data[key];
		}
		return output;
	}

	this.Parse = function( raw ){
		var lines = raw.split("\n");

		var instruction = lines[0].trim();

		var data = {};
		for( var lineno = 1; lineno < lines.length; lineno++ ){
			var line = lines[lineno];
			var key = line.split( ':' )[0];
			var value = (line.split(':').slice(1).join(':')).trim();

			data[key] = value;
		}

		data.getInstruction = function(){ return instruction };

		return data;
	}

	this.getError = function( str, preface ){
		return str.split_slice('_', 1);
	}
}