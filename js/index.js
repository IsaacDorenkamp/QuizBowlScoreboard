var app = angular.module( 'home', [] );

app.controller( 'Manager', ['$scope', HomeController] );

function HomeController($scope){
	$scope.MenuShowing = false;

	$scope.Competitions = [ ["","No competitions available."] ];
	$scope.SelectedCompetition = "";

	$scope.Search = {
		Query: "",
		Results: []
	}

	$scope.ToggleMenu = function(evt){
		$scope.MenuShowing = !$scope.MenuShowing;
	};

	$scope.WatchGame = function( comp ){
		comp = comp || $scope.SelectedCompetition;
		location.assign('watch.html?competition=' + encodeURIComponent(comp));
	};

	$scope.NewCompetition = {
		Name: "",
		ID: "",
		Password: "",
		ispublic: true,
		viewkey: ""
	};
	$scope.CreationData = {  //Data about a created competition.
		Name: "",
		ID: "",
		Password: "",
		Public: false,
		ViewKey: ""
	};
	$scope.CreateCompetition = function(){
		Commander.Send( 'CREATE_COMPETITION', $scope.NewCompetition );
	};

	var host = GLOBALS.SOCKET.test_host;
	var sock = new WebSocket( GLOBALS.SOCKET.protocol + '://' + host + ':' + GLOBALS.SOCKET.port );

	sock.onopen = function(){
		Commander.Send( 'LIST_COMPETITIONS', {} );
	};

	sock.onmessage = function( evt ){
		var data = Commander.Parse( evt.data );

		var instruction = data.getInstruction();

		switch( instruction ){
		case 'POPULATE_CLIST':
			$scope.Competitions = [];

			for( key in data ){
				if( key == 'getInstruction' || !data.hasOwnProperty( key ) ) continue;
				$scope.Competitions.push( [key, data[key]] );
			}
			if( $scope.Competitions.length ) $scope.SelectedCompetition = $scope.Competitions[0][0];
			if( !$scope.$$phase ){
				$scope.$digest();
			}
			break;
		case 'CREATED':
			for( var key in data ){
				if( key == 'getInstruction' || !data.hasOwnProperty( key ) ) continue;
				$scope.CreationData[key] = data[key];
			}
			if( !$scope.$$phase ){
				$scope.$digest();
			}
			Application.Created.show();
			break;
		case 'ERROR':
			alert(data.message || 'An error occurred on the server, and we could not find any information about it.');
			break;
		default:
			break;
		}
	}

	var Commander = new WebsocketCommander( sock );
	var Sender = Commander.Send;
	Commander.Send = function( instruction, data ){
		data.WATCH_CLIENT = true;
		Sender( instruction, data );
	};

	function hasParent( target, elem ){
		if( typeof elem == 'string' ){
			elem = document.getElementById( elem );
		}


		if( target.id == elem.id ){
			return true;
		}else if( !target.parentNode || target.parentNode.nodeName == 'html' ){
			return false;
		}else{
			return hasParent( target.parentNode, elem );
		}
	}

	window.onclick = function(evt){
		if( evt.target == document.getElementById('menu-button') || hasParent( evt.target, 'sidebar-menu' ) ){
			return;
		}

		if( $scope.MenuShowing ) $scope.MenuShowing = false;

		if( !$scope.$$phase ){
			$scope.$digest();
		}
	};
}

var Application = {
	PublicWatch: null,
	Create: null,
	Created: null
};

var q = function(qu){ return document.querySelector(qu) };

function Initialize(){
	Application.PublicWatch = q('#PublicWatch');
	Application.Create      = q('#Create');
	Application.Created     = q('#Created');
}

App5.AddInitializer( Initialize )