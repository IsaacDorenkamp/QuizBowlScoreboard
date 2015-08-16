//Core for Global Competition Management/Viewing

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