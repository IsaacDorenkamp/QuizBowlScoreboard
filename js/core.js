'use strict'

//Core Structures, Constants, DOM Functions Stuff

function q(qu){
	return document.querySelector( qu );
}

function Cookie( name, val ){
	this.name = name;
	this.val = val;
}

Cookie.prototype.getName = function(){
	return this.name;
}
Cookie.prototype.getValue = function(){
	return this.val;
}

Cookie.prototype.toString = function(){
	return this.name + '=' + this.val; //Compatibility for Date objects or strings :D
}

var CookieUtilities = { //Utilities for CookieService
	Epoch: function(){
		return new Date( '1 Jan 1980 12:00:00 UTC' ).toUTCString();
	},
	GetNextWeek: function(){
		var date = new Date();

		date.setDate( date.getDate() + 7 );

		return date.toUTCString();
	}
}

var CookieService = { //Basic Cookie Functions to manipulate cookies
	Get: function( cookie ){
		var all_cookies = document.cookie.split( ';' );
		for( var i = 0; i < all_cookies.length; i++ ){
			var ccookie = all_cookies[i];
			var parts = ccookie.split('=');

			var name = parts[0];
			var val  = parts[1];

			if( name == cookie ){
				return new Cookie( name, val );
			}
		}
		return new Cookie( '', '' );
	},

	Set: function( cookie, val, expires ){
		expires = expires || CookieUtilities.GetNextWeek();

		console.log( cookie + '=' + val + ';expires=' + expires.toString() );
		document.cookie = cookie + '=' + val + ';expires=' + expires.toString();
	},

	Delete: function( cookie ){
		this.Set( cookie, '', CookieUtilities.Epoch() );
	}
}

var Audio = {
	FiveMinutes: null,
	FiveSeconds: null,
	OneMinute: null,
	MatchOver: null,
	Time: null
}

var Application = {
	Main: null,

	SetRoundTime: null,
	SetTossupTime: null,
	SetBonusTime: null,
	Results: null,
	WarningBox: null,
	Warning: null,
	ShowingWarning: false,
	PropertySetter: null,
	LoginDialog: null,
	TeamSetter: null,
	Intro: null,
	DoResults: null,
	LoginForm: null,
	ProgressDialog: null,
	SuccessDialog: null,
	FailureDialog: null,

	StartGame_MI: null,
	FinalizeScores_MI: null,

	AlertDialog: null,
	PromptDialog: null,

	PromptForm: null,

	PromptCallback: function(){},

	//Functions
	Warn: function( audio ){
		//You can choose to change the code to show the notification box instead
		
		//Do audio stuff here
		audio.play();
	},
	CloseIntro: function(){
		if( q('#dsa').checked ){
			CookieService.Set( 'intro', 'false' );
		}

		this.Intro.close();
	},
	FinishPrompt: function(){
		this.PromptCallback( PromptForm.elements["prompt"].value );
		this.PromptDialog.close();
	}
}

var Constants = {
	TOSSUP: 10,
	BONUS: 5,
	TIE: 1
}

function RoundTime( mins, secs, decis ){
	this.minutes = mins   || 0;
	this.seconds = secs   || 0;
	this.decis   = decis  || 0;
}

RoundTime.prototype.getMinutes = function(){
	return this.minutes;
};
RoundTime.prototype.setMinutes = function( mins ){
	this.minutes = mins || 0; //Reset if no value specified
};
RoundTime.prototype.AddMinute = function(){
	this.minutes++;
};
RoundTime.prototype.SubtractMinute = function(){
	if( this.minutes == 0 ) return;
	this.minutes--;
};

RoundTime.prototype.getSeconds = function(){
	return this.seconds;
};
RoundTime.prototype.setSeconds = function( secs ){
	this.seconds = secs || 0; //Reset if no value specified
};
RoundTime.prototype.AddSecond = function(){
	if( this.seconds == 59 ){
		this.AddMinute();
		this.seconds = 0;
		return;
	}
	this.seconds++;
};
RoundTime.prototype.SubtractSecond = function(){
	if( this.seconds == 0 ) return;
	this.seconds--;
};

RoundTime.prototype.getDecis   = function(){
	return this.decis;
};
RoundTime.prototype.setDecis   = function(decis){
	this.decis = decis || 0; //Reset if no value specified
};

RoundTime.prototype.toString = function(){
	return this.minutes + ':' + fill_zeros(this.seconds) + '.' + this.decis;
};

RoundTime.prototype.format = function( format ){
	format = format.replace( /S/, this.seconds );
	format = format.replace( /s/, fill_zeros( this.seconds ) );
	format = format.replace( /D/, this.decis );
	format = format.replace( /M/, this.minutes );
	format = format.replace( /m/, this.minutes % 60 );
	format = format.replace( /h/, Math.round( this.minutes / 60 ) );

	return format;
}

function fill_zeros( seconds ){
	var str = seconds.toString();

	if( str.length == 1 ){
		str = '0' + str;
	}

	return str;
}

function Team( name ){
	this.name = name || "Team";
	this.score = 0;
}

Team.prototype.getName = function(){
	return this.name;
};
Team.prototype.setName = function(name){
	this.name = name;
};

Team.prototype.getScore = function(){
	return this.score;
}
Team.prototype.setScore = function(score, adjust){
	if( this.score == 0 && score < 0 ){
		return;
	}
	if( this.score % 5 && adjust ){
		var mod = this.score % 5;
		this.score = this.score - mod;
		return;
	}

	this.score = score || 0; //Reset if no value specified
}
Team.prototype.AddScore = function(type){
	this.setScore( this.getScore() + type );
}
Team.prototype.AddTie = function(p1, p2){
	if( p1.getScore() == p2.getScore() ){
		this.AddScore(1);
	}
}
Team.prototype.SubtractScore = function(type){
	this.setScore( this.getScore() - type, true );
}

var TextAdjustor = {
	ResizePlayers: function(){
		var all_elmts = document.getElementsByClassName("player-name");
		
		var p1 = all_elmts[0];
		var p2 = all_elmts[1];

		var p1_cs = getComputedStyle( p1 );
		var p2_cs = getComputedStyle( p2 );

		var s1 = parseInt( p1_cs.fontSize );
		var s2 = parseInt( p2_cs.fontSize );

		var ref = s1;
		var use = p1;

		if( p1.scrollWidth < p2.scrollWidth ){
			ref = s2;
			use = p2;
		}

		while( use.scrollWidth > use.clientWidth ){
			ref--;

			p1.style.fontSize = ref + 'px';
			p2.style.fontSize = ref + 'px';
			if( ref == 0 ){
				break;
			}
		}
	}
}

function DialogEnterCheck( evt, dlg ){
	if( evt.keyCode == 13 ){
		dlg.close();
	}
}

function InitializeCore(){
	Application.Main           = q('#app');

	Application.SetRoundTime   = q('#SetRoundTime');
	Application.SetTossupTime  = q('#SetTossupTime');
	Application.SetBonusTime   = q('#SetBonusTime');
	Application.Results        = q('#Results');
	Application.WarningBox     = q('#WarningBox');
	Application.Warning        = q('#WarningNotif');
	Application.PropertySetter = q('#PropertySetter-Dialog');
	Application.PropertySetter.Box = q('#PropertySetter-Box');
	Application.LoginDialog    = q('#LoginDialog');
	Application.TeamSetter     = q('#TeamSetter-Dialog');
	Application.TeamSetter.Box = q('#TeamSetter-Box');

	Application.Intro          = q('#Intro');
	Application.DoResults      = q('#DoResults');

	Application.LoginForm = q('#LoginForm');

	Application.ProgressDialog = q('#ProgressDialog');
	Application.SuccessDialog = q('#SuccessDialog');
	Application.FailureDialog = q('#FailureDialog');

	Application.StartGame_MI = q('#StartGame');
	Application.FinalizeScores_MI = q('#FinalizeScores');

	Application.AlertDialog = q('#AlertDialog');
	Application.PromptDialog = q('#PromptDialog');

	Application.PromptForm = q('#PromptForm');

	Audio.FiveMinutes = q('#audio_five_minutes'),
	Audio.FiveSeconds = q('#audio_five_seconds'),
	Audio.OneMinute = q('#audio_one_minute'),
	Audio.MatchOver = q('#audio_match_over'),
	Audio.Time = q('#audio_time');

	if( CookieService.Get( 'intro' ).getValue() != "false" ){
		if( Application.Intro.show ){
			Application.Intro.show();
		}else{
			setTimeout( function wait_show(){
				if( Application.Intro.show ){
					Application.Intro.show();
				}else{
					setTimeout( wait_show, 100 );
				}
			}, 100)
		}
	}


	document.body.className='loaded';
}

addEventListener( 'load', InitializeCore );