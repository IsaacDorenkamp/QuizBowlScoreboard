const GLOBALS = {
	SOCKET: {
		'protocol': 'ws',
		'universal_host': 'quizbowl.us',
		'test_host': 'localhost',
		'port': '9000'
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