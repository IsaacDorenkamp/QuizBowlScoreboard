var app = angular.module( 'home', [] );

app.controller( 'Manager', ['$scope', HomeController] );

function HomeController($scope){
	$scope.MenuShowing = false;
}