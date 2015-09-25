//Core for Global Competition Management/Viewing//
//==============================================//
//==========SECTION 1: ANGULAR APP==============//
//==============================================//

var App = angular.module( 'cmgr', [] ); //cmgr = Competition ManaGeR

App.controller( 'Manager', ['$scope', ManagerCtrl] );

function ManagerCtrl($scope){
	$scope.Competition = {
		Name: "",
		Password: "",
		Private: false,
		ViewKey: ""
	};
}

//==============================================//
//============SECTION 2: DOM Core===============//
//==============================================//
var Application = {
	CreateDialog: null
};

function q( qu ){
	return document.querySelector( qu );
}

function InitializeCore(){
	Application.CreateDialog = q('#CreateCompetition');
}

addEventListener( "load", InitializeCore );