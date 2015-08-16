function oninitialize(){
	var AlertOnLoad = new App5.Extension("AlertOnLoad","Alert On Load","v0.1");

	AlertOnLoad.oninitialize = function(){
		alert("Welcome to "+document.head.getElementsByTagName('title')[0].innerHTML+"!");
	};

	App5.ExtensionManager.install(AlertOnLoad);
}

App5.AddInitializer(oninitialize);