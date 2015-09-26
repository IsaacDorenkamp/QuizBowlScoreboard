'use strict'

var Commander;
var socket;
var socket_available = false;

var App = angular.module('watch', []);
App.controller( 'GameWatch', GameWatch );

App.directive( 'ngResizeText', ['$timeout', function($timeout){
	return function( scope, elem ){
		var element = elem[0];
		scope.$watch( function(){
			return element.scrollWidth
		}, function( newvalue, oldvalue ){
			if( !(newvalue > oldvalue) ){
				//return;
			}
			var nfs = parseInt( App5.css( element, "fontSize" ) );
			if( element.scrollWidth > (element.clientWidth + 1) ){
				while( element.scrollWidth > (element.clientWidth + 1) && nfs > 10 ){
					nfs -= 1;
					App5.css( element, "fontSize", nfs + "px" );
				}
			}
		} )
		//Do not "re-call" this function! We only want to initially fit the text.
	}
}] );

App.filter( 'objectSort', function(){
	return function( items, field, reverse ){
		var filtered = [];
		angular.forEach( items, function(item){
			filtered.push( item );
		} );
		filtered.sort( function( a, b ){
			return (parseInt(a[field]) > parseInt(b[field]) ? 1 : -1);
		} );
		if(reverse) filtered.reverse();
		return filtered;
	}
} );

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

var Games;

function GameWatch( $scope, $sce, $timeout, $window ){
	var qu     = PQ();
	const COMP = qu['competition'];

	var showing_auth = false;

	$scope.MenuShowing = false;

	$scope.OPTIONS = [ ["GID", "Game ID"], ["T1S","Team One's Score"], ["T2S","Team Two's Score"] ];
	$scope.SortBy = $scope.OPTIONS[0][0];

	$scope.Games = {};
	$scope.Competition = "";
	$scope.CID = "";

	$scope.ShowAll = true;

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

		console.log( data );

		switch( data.getInstruction() ){
		case 'INITIALIZE':
			$timeout( function(){
				$scope.Competition = $sce.trustAsHtml(data['name']);
				$scope.$digest();
			} );
			//No break!!!
		case 'NEW_GAME':
		case 'SCORE_UPDATE':
			if( showing_auth ){
				Application.Authentication.close();
				showing_auth = false;
			}
			var fn = function(){
				for( var key in data ){
					if( key.split('_')[0].toLowerCase() == "game" ){
						var gnm = key.split_slice( "_", 1 );
						if( !$scope.Games[gnm] ){
							$scope.Games[gnm] = {
								T1S: data[ gnm+ '_T1S'],
								T2S: data[ gnm + '_T2S'],
								T1N: data[ gnm + '_T1N'],
								T2N: data[ gnm + '_T2N'],
								Name: data['Game_' + gnm],
								GID: gnm,
								SU: (data.getInstruction()!='INITIALIZE'), //SU stands for "Score Updated"
								Finished: (data[ gnm + '_Finished' ]=="true")?true:false
							};

							$scope.$watch( "Games["+gnm+"].T1S", function( oldval, newval ){
								if( oldval != newval ){
									if( !$scope.Games[gnm].SU ) $scope.Games[gnm].SU = true;
									$timeout( function(){
										$scope.Games[gnm].SU = false;
									}, 2500 );
								}
							} );
							$scope.$watch( "Games["+gnm+"].T2S", function( oldval, newval ){
								if( oldval != newval ){
									if( !$scope.Games[gnm].SU ) $scope.Games[gnm].SU = true;
									$timeout( function(){
										$scope.Games[gnm].SU = false;
									}, 2500 );
								}
							} );

							if( $scope.Games[gnm].SU ){
								$timeout( function(){
									$scope.Games[gnm].SU = false;
								}, 2500 )
							}
						}else{
							$scope.Games[gnm]["T1S"] = data[gnm + '_T1S'];
							$scope.Games[gnm]["T2S"] = data[gnm + '_T2S'];
							$scope.Games[gnm]["T1N"]  = data[gnm + '_T1N'];
							$scope.Games[gnm]["T2N"]  = data[gnm + '_T2N'];
						}
						if( data.getInstruction() == "INITIALIZE" ){  //Server-side protocol adds in game names
							$scope.Games[gnm].Name = data[gnm + '_Name'];
						}
					}
				}

				Games = $scope.Games;
			};

			if( $scope.$$phase ){
				fn();
			}else{
				$scope.$apply( fn );
			}
			break;
		case 'GAME_OVER':
			var gid = parseInt(data['gid']);
			if( isNaN(gid) ){
				return;
			}

			for( var key in $scope.Games ){
				var game = $scope.Games[key];
				if( game.GID == gid ){
					$scope.Games[key].Finished = true;
					if( !$scope.$$phase ){
						$scope.$digest();
					}
				}
			}
			break;
		case 'AUTHENTICATE':
			var stat = parseInt( data.status );
			switch( stat ){
				case 0:
					$scope.Error = "";
					Application.Authentication.show();
					showing_auth = true;
					break;
				case -1:
					$scope.Error = "Incorrect password.";
					break;
				default:
					$scope.Error = "An unknown status was received: " + data.status;
					break;
			}

			if( !$scope.$$phase ){
				$scope.$digest();
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

	Commander = new WebsocketCommander( socket );
	var sender = Commander.Send;
	Commander.Send = function( command, data ){
		data.WATCH_CLIENT = true;
		sender( command, data );
	};

	$scope.Watch = function(){
		Commander.Send( 'WATCH', {
			competition: COMP,
			pwd: $scope.password
		} );
	}
	$scope.CheckKey = function(evt){
		var code = evt.keyCode;

		if( code == 13 ){
			$scope.Watch();
		}
	}

	$scope.Loading = $sce.trustAsHtml('Loading<app5-effect effect="Ellipses"></app5-effect>');

	$scope.password = "";
	$scope.Error = "";

	window.onbeforeunload = function(){
		Commander.Send( 'UNWATCH', {} );
	}
}

//=============================================================//
//==================ANGULARJS UNRELATED STUFF==================//
//=============================================================//

var Application = {
	Authentication: null
}

var q = function(qu){ return document.querySelector(qu) };

function Initialize(){
	Application.Authentication = q('#auth');
}

addEventListener('load', Initialize);