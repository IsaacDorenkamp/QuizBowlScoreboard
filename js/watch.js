'use strict'

var Commander;
var socket;
var socket_available = false;

var App = angular.module('watch', []);
App.controller( 'GameWatch', GameWatch );

function PQ(){
	var qs = location.search;
	qs = qs.substring(1);

	var output = {};

	var vals = qs.split('&');

	for( var i = 0; i < vals.length; i++ ){
		var val = vals[i].split('=');

		output[val[0]] = decodeURIComponent(val[1]);
	}

	return output;
}

function GameWatch( $scope, $sce, $timeout, $window ){
	var qu     = PQ();
	const COMP = qu['competition'];

	$scope.Games = {};
	$scope.Competition = "";
	$scope.CID = "";

	$scope.chat_messages = [];

	socket = new WebSocket( GLOBALS.SOCKET.protocol + '://' + GLOBALS.SOCKET.test_host + ':' + GLOBALS.SOCKET.port );


	socket.onopen = function(){
		socket_available = true;

		Commander.Send( 'WATCH', {
			competition: COMP
		} );
	};
	socket.onmessage = function(evt){
		var data = Commander.Parse( evt.data );

		switch( data.getInstruction() ){
		case 'INITIALIZE':
			$timeout( function(){
				$scope.Competition = $sce.trustAsHtml(data['name']);
				$scope.$digest();
			} );
			//No break!!!
		case 'SCORE_UPDATE':
			var fn = function(){
				for( var key in data ){
					if( key.split('_')[0].toLowerCase() == "game" ){
						var gnm = key.split_slice( "_", 1 );
						if( !$scope.Games[gnm] ){
							$scope.Games[gnm] = {
								T1S: data[key.split_slice( "_", 1 ) + '_T1S'],
								T2S: data[key.split_slice( "_", 1 ) + '_T2S'],
								T1N: data[key.split_slice( "_", 1 ) + '_T1N'],
								T2N: data[key.split_slice( "_", 1 ) + '_T2N'],
								updated: false
							};

							$scope.$watch( "Games["+gnm+"].T1S", function( oldval, newval ){
								if( oldval != newval ){
									console.log("flashing");
									$scope.Games[gnm].updated = true;
									$timeout( function(){
										$scope.Games[gnm].updated = false;
									}, 750 );
								}
							} );
							$scope.$watch( "Games["+gnm+"].T2S", function( oldval, newval ){
								if( oldval != newval ){
									$scope.Games[gnm].updated = true;
									$timeout( function(){
										$scope.Games[gnm].updated = false;
									}, 750 );
								}
							} );
						}else{
							$scope.Games[gnm]["T1S"] = data[key.split_slice( "_", 1 ) + '_T1S'];
							$scope.Games[gnm]["T2S"] = data[key.split_slice( "_", 1 ) + '_T2S'];
							$scope.Games[gnm]["T1N"]  = data[key.split_slice( "_", 1 ) + '_T1N'];
							$scope.Games[gnm]["T2N"]  = data[key.split_slice( "_", 1 ) + '_T2N'];
						}
						if( data.getInstruction() == "INITIALIZE" ){  //Server-side protocol adds in game names
							$scope.Games[gnm].Name = data[key.split_slice( "_", 1 ) + '_Name'];
						}
					}
				}
			};

			if( $scope.$$phase ){
				fn();
			}else{
				$scope.$apply( fn );
			}
			break;
		case 'CHAT_MESSAGE':
			$scope.chat_messages.push(data.message);
			break;
		case 'ERROR':
			alert( data['message'] )
			break;
		default:
			break;
		}
	};
	socket.onclose = function(){
		socket_available = false;
	};

	Commander = {
		Send: function( instruction, data ){
			if( !socket_available ){
				alert("Socket not available! Could not connect to websocket service.\nWarning: you will not be able to save progress"
					 + "or perform any\nnetwork functions unless you reload the page.");
				return;
			}

			var instruction = this.CreateInstruction( instruction, data );
			socket.send( instruction );
		},

		CreateInstruction: function( instruction, data ){
			var output = instruction || 'ECHO';
			data['WATCH_CLIENT'] = true;
			for( var key in data ){
				output += '\n' + key + ':' + data[key];
			}

			return output;
		},

		Parse: function( raw ){
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
		},

		getError: function( str, preface ){
			if( !preface ) preface = "Error";
			var err = str.split('_');

			var words = [preface + ':'];
			for( var i = 1; i < err.length; i++ ){
				var period = (i == err.length - 1)?'.':'';

				words.push( err[i][0].toUpperCase() + err[i].slice(1).toLowerCase() + period );
			}

			return words.join(' ');
		}
	};

	$scope.Loading = $sce.trustAsHtml('Loading<app5-effect effect="Ellipses"></app5-effect>');

	window.onbeforeunload = function(){
		Commander.Send( 'UNWATCH', {} );
	}
}