var App5 = {
	VERSION: 'v0.1',
	INIT_EXT: false,
	Initializers: new Array(),
	PREFIXES: new Array(
		"","-webkit-","-moz-","-o-","-ms-"
	),
	CURRENT_MENU: null,
	CURRENT_CASCADE: null,
	
	Effects:{},
	
	getEffect: function(fx_name){
		return Object.create( this.Effects[fx_name] );
	}
};

var Q5 = {
	id: function(id){
		return document.getElementById( id );
	},
	tag: function( tag ){
		return document.getElementsByTagName( tag );	
	},
	classname: function( clazz ){
		return document.getElementsByClassName( clazz );
	}
};

var APP5_PATH = "/app5";

App5.loadScript = function(src,callback){
	var script = document.createElement('script');
	script.src = src;
	if( callback ) script.onload = function(){ callback(script) };
	document.head.appendChild( script );
};

App5.loadStyle = function(src,callback){
	var style = document.createElement('link');
	style.rel = "stylesheet";
	style.href = src;
	if( callback) style.onload = function(){ callback(style) };
	document.head.appendChild( style );
};

//Time to add the effects!
App5.InitEffects = function(){
	App5.Effects.CrazyBackground = {
		tickRate: 250,
		setup: function(elem){},
		tick: function(elem){
			var r_rand = Math.round(Math.random()*255);
			var g_rand = Math.round(Math.random()*255);
			var b_rand = Math.round(Math.random()*255);
			App5.css(elem, 'background-color', 'rgb('+r_rand+','+g_rand+','+b_rand+')');
		}
	};

	App5.Effects.Shake = {
		tickRate: 150,
		setup: function(elem){
			App5.css(elem, "transition", "transform 150ms linear", -1);
			App5.css(elem.parentNode, "overflow", "hidden");
		},
		tick: function(elem){
			var rot = Math.round((Math.random() * 10) ) - 5;
			var amtX = Math.round( (Math.random() * 10) - 5 );
			var amtY = Math.round( (Math.random() * 10) - 5 );
			App5.css(elem, "transform", "rotate("+rot+"deg) translate("+amtX+"px,"+amtY+"px)",-1);
		}
	}
}

App5.AJAX = function(url,method,handler,postdata){
    var xmlhttp;
    try{
        xmlhttp = new XMLHttpRequest();
    }catch(e){
        xmlhttp = new ActiveXObject("MSXML.XMLHTTP");
    }
    xmlhttp.open(method,url,true);
    xmlhttp.onreadystatechange = function(){ 
	    if(xmlhttp.readyState == 4 && this.status == 200){
		    handler(xmlhttp) ;
	    }
	};
    if( method == "POST" ){
	xmlhttp.setRequestHeader('Content-type','application/x-www-form-urlencoded');
        xmlhttp.send(postdata);
    }else{
	xmlhttp.send();
    }
};

var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

App5.AddInitializer = function(initter){
	App5.Initializers.push(initter);
};
App5.ExecuteInitializers = function(){
	if( App5.INIT_EXT ) throw new App5.Error("InitializationError","Cannot initialize extensions twice");
	while( App5.Initializers.length > 0 ){
		(App5.Initializers.pop())();
	}
	App5.INIT_EXT = true;
}

App5.Initialize = function(){
	if( !document.registerElement){
		var fallback = document.createElement('script');
		if( navigator.appName.indexOf("Microsoft") != -1 ){
			fallback.src = APP5_PATH+"/external-rc/document-register-element-ie8.js";
		}else{
			fallback.src = APP5_PATH+"/external-rc/document-register-element.js";
		}
		document.head.appendChild(fallback);
		fallback.onload = App5.Initialize;
		return;
	}

	var camel_case = function(name){
		var output = "";
		var doCapNext = false;
		for(var i = 0; i < name.length; i++){
			var curchar = name.charAt(i);
			if(doCapNext){
				output += curchar.toUpperCase();
				doCapNext = false;
				continue;
			}
			if(curchar == '-'){
				doCapNext = true;
				continue;
			}
			output += curchar;
		}
		return output;
	};

	App5.css = function(element, prop, val, prefopt){
		if( val == undefined ){
			var prop_camelcase = camel_case(prop);
			return getComputedStyle(element,null)[prop_camelcase];
		}else{
			if( prefopt == 0 || prefopt == undefined){
				element.style[prop] = val;
				return;
			}
			for( var prefnum = 0; prefnum < App5.PREFIXES.length; prefnum++ ){
				var prefix = App5.PREFIXES[prefnum];
				if( prefopt == -1 ){
					element.style[camel_case(prefix+prop)] = val;
				}else if( prefopt == 1 ){
					element.style[prop] = prefix+val;
				}else;
			}
		}
	};
	
	App5.CSSRules = {
		GetRule: function(name){
			name = name.toLowerCase();
			
			if( document.styleSheets ){
				for( var i = 0; i < document.styleSheets.length; i++ ){
					var sheet = document.styleSheets[i];
					var ruleset = sheet.cssRules || sheet.rules;
					for( var j = 0; j < ruleset.length; j++ ){
						var cur_rule = ruleset[j];
						if( cur_rule ){
							if( cur_rule.selectorText.toLowerCase() == name ){
								return cur_rule;
							}
						}
					}
				}
			}
			
			return null;
		},
		AddRule: function(name){
			if( document.styleSheets ){
				var sheet = document.styleSheets[0];
				if( sheet.addRule ) sheet.addRule( name, null, 0 );
				else sheet.insertRule( rule + '{  }', 0 );
			}
			return this.GetRule( name );
		},
		EditRule: function( rule, prop, val ){
			rule.style[prop] = val;
		}
	};
	
	App5.InitEffects();
	
	App5.consume = function(e){
		if(e.preventDefault){
			e.preventDefault();
		}else if(e.stopPropagation){
			e.stopPropagation();
		}else{
			e.cancelBubble = true;
		}
	};
	
	App5.getEventTarget = function(e){
		if(e.target){
			return e.target;
		}else if(e.srcElement){
			return e.srcElement;
		}else return null;
	};
	
	App5.Error = function(type,msg){
		this.toString = function(){
			return type+": "+msg;
		};	
	};
	
	//Dynamic Content Widget
	var DynamicProto = Object.create( HTMLElement.prototype );
	DynamicProto.refresher = function(){
		return "Dynamic Content: "+Math.random();
	};
	DynamicProto.createdCallback = function(){
		this.rate = 500;
		var that = this;
		setTimeout(function looper(){
			that.innerHTML = that.refresher();
			setTimeout(looper,that.rate);
		}, this.rate);
	};
	
	App5.Dynamic = document.registerElement("app5-dynamic", { prototype : DynamicProto } );
	
	//Panels
	var PanelProto = Object.create( HTMLElement.prototype );
	PanelProto.createdCallback = function(){
		App5.css(this,"display","block");
	};
	PanelProto.attachedCallback = function(){
		if( typeof this.parentNode == App5.TabPane ){
			App5.css(this, "visibility", "hidden");
		}
	};
	App5.Panel = document.registerElement( "app5-panel", { prototype : PanelProto } );
	
	//Notification Widget
	var NotifProto = Object.create( HTMLElement.prototype );
	NotifProto.createdCallback = function(){
		App5.css(this, "visibility", "hidden");
	
		var that = this;
		this.show = function(duration){
			if(that.parentNode.style.visibility = "visible"){
				App5.css(that,"visibility","visible");
				App5.css(that,"opacity",".9");
				if(duration == undefined){
					duration = 3;
				}
				setTimeout(that.hide,duration*1000);
			}
		};
		this.hide = function(){
			App5.css(that,"opacity","0");
			setTimeout( function(){
				App5.css(that,"visibility","hidden");
			}, 300);
		};
	};
	App5.Notification = document.registerElement("app5-notification", { prototype : NotifProto } );
	
	//Tab Stuff
	var TabPaneProto = Object.create( HTMLElement.prototype );
	TabPaneProto.createdCallback = function(){
		var that = this;
		this.getSelected = function(){
			var tabs = that.getElementsByTagName("app5-tab");
			for( var i = 0; i < tabs.length; i++ ){
				if( tabs[i].getAttribute("data-focused") ){
					return tabs[i];
				}
			}
		};
	};
	App5.TabPane = document.registerElement( "app5-tabpane", { prototype: TabPaneProto } );
	
	var TabStripProto = Object.create( HTMLElement.prototype );
	App5.TabStrip = document.registerElement( "app5-tab-strip", { prototype : TabStripProto } );
	
	var TabMetaProto = Object.create( PanelProto );
	TabMetaProto.createdCallback = function(){
		this.autoresize = true;
	};
	TabMetaProto.attachedCallback = function(){
		var resize_att = this.getAttribute("autoresize");
		if( resize_att == "false" ){
			this.autoresize = false;
		}
	};
	TabMetaProto.attributeChangedCallback = function(name,oldv,newv){
		if( name == "autoresize" ){
			if( newv == "false" ){
				this.autoresize = false;
			}else if( newv == "true" ){
				this.autoresize = true;
			}else;
		}
	};
	
	document.registerElement("app5-tab-meta", { prototype : TabMetaProto } );
	
	var TabProto = Object.create( HTMLElement.prototype );
	TabProto.createdCallback = function(){
		this.panel = "";
		this.setAttribute('data-focused','false');
	};
	TabProto.attachedCallback = function(){
		this.panel = this.getAttribute('panel');
		if( ! (this.parentNode.tagName == "APP5-TAB-STRIP") ){
			throw new App5.Error("HierarchyError", "Parent of app5-tab must be app5-tab-strip, not " + this.parentNode.tagName);
		}else{
			var panel = this.panel;
			var that = this;
			var tmeta = this.parentNode.parentNode.getElementsByTagName("app5-tab-meta")[0];
			this.onclick = function(){
				that.select();
			};
			this.select = function(){
				var tabs = that.parentNode.getElementsByTagName("app5-tab");
				for(var i = 0; i < tabs.length; i++){
					if( tabs[i] != that ){
						tabs[i].setAttribute('data-focused','false');
					}else{
						tabs[i].setAttribute('data-focused','true');
					}
				}
				var els = that.parentNode.parentNode.getElementsByTagName("app5-panel");
				for(var num = 0; num < els.length; num++){
					var el = els[num];
					if( el.id == panel ){
						App5.css(el, "visibility","visible");
						var setsize = function(){
							if(that.getAttribute('data-focused') == 'true' && tmeta.autoresize ){
								App5.css(elem.parentNode,'height',elem.offsetHeight);
							}
						};
						var elem = document.getElementById(panel);
						var observer = new MutationObserver(
							function(mutations,observer){
								setsize();
							}
						);
						observer.observe(elem,
							{
								childList:true,
								subtree:true
							}
						);
						setsize();
					}else{
						App5.css(el, "visibility","hidden");
					}
				}
			}
		}
	};
	App5.Tab = document.registerElement( "app5-tab", { prototype : TabProto } );
	
	//Menu Time!
	var MenuBarProto = Object.create( HTMLElement.prototype );
	App5.MenuBar = document.registerElement("app5-menubar", { prototype : MenuBarProto } );
	
	var MenuProto = Object.create( HTMLElement.prototype );
	
	MenuProto.attachedCallback = function(){
		var prev_elem = null;
		function check_cascades(e){
			if( App5.CURRENT_CASCADE != null ){
				if( prev_elem != null && prev_elem != document.elementFromPoint(e.clientX,e.clientY) ){
					App5.CURRENT_CASCADE.hide();
				}
			}
			prev_elem = document.elementFromPoint(e.clientX,e.clientY);
		}
		this.onclick = check_cascades;
	};
	
	MenuProto.show = function(x,y,ref){
		if(ref){
			App5.CURRENT_MENU = this;
			ref.setAttribute("data-focused","true");
		}
		
		App5.css( this, 'visibility', 'visible' );
		App5.css( this, 'opacity', '1' );
		App5.css( this, 'left', x+"px" );
		App5.css( this, 'top', y+"px" );
	};
	MenuProto.hide = function(ref){
		App5.css( this, 'visibility', 'hidden' );
		if( App5.CURRENT_MENU == this ){
			App5.CURRENT_MENU = null;
			if(ref == undefined){
				ref = document.querySelector('app5-menuref[data-focused="true"]');
			}
			if( ref )
				ref.setAttribute("data-focused","false");
		}
	};
	
	App5.Menu = document.registerElement( "app5-menu", { prototype : MenuProto } );
	
	var MenuRefProto = Object.create( HTMLElement.prototype );
	MenuRefProto.attachedCallback = function(){
		this.menu = document.getElementById(this.getAttribute('menu'));
		
		var that = this;
		
		this.onclick = function(e){
			if( App5.CURRENT_MENU == that.menu ){
				App5.CURRENT_MENU.hide(that);
				return;
			}
			var nums = this.getBoundingClientRect();
			var left = nums.left;
			var bottom = nums.bottom;
			
			that.menu.show(left,bottom,that);
		};
		this.onmouseover = function(e){
			if( App5.CURRENT_MENU != null ){
				var targ = document.elementFromPoint(e.clientX, e.clientY).tagName;
				if(targ == "APP5-MENUREF"){
					App5.CURRENT_MENU.hide();
				}
				App5.CURRENT_MENU = that.menu;
				
				var nums = that.getBoundingClientRect();
				var left = nums.left;
				var bottom = nums.bottom;
				
				App5.CURRENT_MENU.show(left,bottom,that);
			}
			if( App5.CURRENT_CASCADE != null ){
				App5.CURRENT_CASCADE.hide();
				App5.CURRENT_CASCADE = null;
			}
		};
	};
	App5.MenuRef = document.registerElement( "app5-menuref", { prototype : MenuRefProto } );
	
	var MenuMetaProto = Object.create( HTMLElement.prototype );
	App5.MenuMeta = document.registerElement( "app5-menu-meta", { prototype : MenuMetaProto } );
	
	var MenuItemProto = Object.create( HTMLElement.prototype );
	App5.MenuItem = document.registerElement( "app5-menu-item", { prototype : MenuItemProto } );
	
	var MenuCascadeProto = Object.create( MenuItemProto );
	MenuCascadeProto.attachedCallback = function(){
		var menu = this.getAttribute('menu');
		if( menu == null || menu == undefined || menu == "" ){
			throw new App5.Error("MenuError","Menu attribute of <app5-menu-cascade> required, but not found.");
			return;
		}
		var menu_node = document.getElementById(menu);
		if( menu_node == undefined || menu_node == null ){
			throw new App5.Error("MenuError","Menu attribute of <app5-menu-cascade> refers to nonexistent menu");
			return;
		}
		this.menu = menu_node;
		
		var that = this;
		this.onmouseover = function(e){
			App5.CURRENT_CASCADE = that.menu;
			var nums = that.getBoundingClientRect();
			that.menu.show( nums.left + nums.width, nums.top );
		};
		this.onmouseleave = function(e){
			var tag = document.elementFromPoint(e.clientX, e.clientY);
			if( tag.parentNode != that.menu && tag.tagName == "APP5-MENU-ITEM" ){
				this.menu.hide();
				App5.CURRENT_CASCADE = null;
			}
		};
	};
	
	App5.MenuCascade = document.registerElement( "app5-menu-cascade", { prototype : MenuCascadeProto } );
	
	document.onclick = function(e){
		var targ = App5.getEventTarget(e);
		if( targ.tagName != "APP5-MENUREF" ){
			var cct = targ;
			while( cct != null && cct.className != "menu-control" ) cct = cct.parentNode;
			if( cct != null && cct.className == "menu-control" ) return;
			
			if(App5.CURRENT_MENU != null){
				App5.CURRENT_MENU.hide();
			}
			if(App5.CURRENT_CASCADE != null){
				App5.CURRENT_CASCADE.hide();
				App5.CURRENT_CASCADE = null;
			}
		}
	};
	
	var DialogProto = Object.create( HTMLElement.prototype );
	DialogProto.createdCallback = function(){
		this.setAttribute('data-showing','false');
	};
	DialogProto.show = function(){
		App5.css(this.parentNode,"visibility","visible");
		this.setAttribute('data-showing','true');
	};
	DialogProto.close = function(){
		App5.css(this.parentNode,"visibility","hidden");
		this.setAttribute('data-showing','false');
	};
	DialogProto.attachedCallback = function(){
		if( this.parentNode.tagName != "APP5-MODAL" ){
			throw new App5.Error("HierarchyError","Parent of app5-dialog must be app5-modal, not "+this.parentNode.tagName);
		}
	};
	App5.Dialog = document.registerElement( "app5-dialog", { prototype : DialogProto } );
	
	var ModalProto = Object.create( HTMLElement.prototype );
	App5.Modal = document.registerElement( "app5-modal", { prototype : ModalProto } );
	
	//Effects!
	var EffectProto = Object.create( HTMLElement.prototype );
	EffectProto.createdCallback = function(){
		this.effect = App5.getEffect('CrazyBackground');
		this.tick = 50;
	};
	EffectProto.attachedCallback = function(){
		this.tick = parseInt( this.getAttribute('tick') ) || this.tick;
		this.effect = App5.getEffect( this.getAttribute('effect') || 'CrazyBackground' );
		
		this.effect.setup(this);
		
		var that = this;
		setTimeout( function ticker(){
			if( that.effect ){
				that.tick = that.effect.tickRate;
				that.effect.tick(that);
			}
			setTimeout(ticker,that.tick);
		}, this.tick);
	};
	App5.Effect = document.registerElement( "app5-effect", { prototype : EffectProto } );
	
	//Context Menu Stuff. Yeah bro.
	App5.SetContextMenu = function(target, menu){
		target.oncontextmenu = function(e){
			App5.consume( e );
			if( App5.CURRENT_MENU)
				App5.CURRENT_MENU.hide();
			if( App5.CURRENT_CASCADE ){
				App5.CURRENT_CASCADE.hide();
				App5.CURRENT_CASCADE = null;
			}
			menu.show( e.clientX, e.clientY );
			App5.CURRENT_MENU = menu;
		};
	};
	
	//Extension stuff.
	function ExtensionData(name,version){
		this.name = name;
		this.version = version;
		
		var that = this;
		this.toString = function(){
			return that.name + " " + that.version;
		};
	}
	App5.ExtensionData = ExtensionData;
	
	function Extension(name,fullname,version){
		this.NAME = name;
		this[name+"Data"] = new ExtensionData(fullname,version);
		
		this.oninitialize = function(){};
	}
	App5.Extension = Extension;
	
	App5.ExtensionManager = {
		install: function(ext){
			for(var ext_comp in ext){
				if(ext_comp == "oninitialize" || ext_comp == "NAME"){ //Skip oninitialize method that
					continue;				      //is to be called by this method
				}
				App5[ext_comp] = ext[ext_comp];
			}
			ext.oninitialize();
			var data = ext[ext.NAME+"Data"];
			console.log("Installed and Initialized "+data.toString());
		}
	};
	
	//Load App5 stylesheet (IMPORTANT!)
	var style = document.createElement('link');
	style.rel = "stylesheet";
	style.href = APP5_PATH+'/App5.css';
	style.onload = function(){
		//Auto-select first tab
		var tab_panes = document.getElementsByTagName("app5-tabpane");
		for(var i = 0; i < tab_panes.length; i++){
			var pane = tab_panes[i];
			var strip = pane.getElementsByTagName("app5-tab-strip")[0];
			var tab = strip.querySelector('app5-tab:first-of-type');
			if( tab == null ) break;
			else{
				tab.select();
				break;
			}
		}
		
		//Initialize Extensions
		App5.ExecuteInitializers(); //wait to load and apply styles before initting extensions
	};
	document.head.appendChild(style);
	
	var viewport = document.createElement('meta');
	viewport.name = "viewport";
	viewport.content = "width=device-width";
	document.head.appendChild(viewport);
	
	console.log("Initialized App5 "+App5.VERSION);
};

addEventListener('load',App5.Initialize);