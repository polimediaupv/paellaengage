/*
	Copyright 2013 Universitat Politècnica de València Licensed under the
	Educational Community License, Version 2.0 (the "License"); you may
	not use this file except in compliance with the License. You may
	obtain a copy of the License at

http://www.osedu.org/licenses/ECL-2.0

	Unless required by applicable law or agreed to in writing,
	software distributed under the License is distributed on an "AS IS"
	BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
	or implied. See the License for the specific language governing
	permissions and limitations under the License.
*/
var GlobalParams = {
	playbackControls:{zIndex:100},
	video:{zIndex:1},
	background:{zIndex:0}
};

var paella = {};
paella.player = null;

paella.debug = {
	init:false,
	debug:false,

	log:function(msg) {
		if (!this.init) {
			this.debug = paella.utils.parameters.get('debug')=='true';
			this.init = true;
		}
		if (this.debug) {
			console.log(msg);
		}
	}
}

paella.pluginList = [
	'annotations.js',
	'framecontrol.js',
	'fullscreenbutton.js',
	'playbutton.js',
	'repeatbutton.js',
	'social.js',
	'viewmode.js',
//	'check_publish.js',
	'description.js',
	'serie_episodes.js',
	'extended_profiles.js',
	'search.js',
	'usertracking.js',
	'comments.js',
	'recess.js',
	'trimming.js',
	'downloads.js'
];

paella.events = {
	play:"mh:play",
	pause:"mh:pause",
	next:"mh:next",
	previous:"mh:previous",
	seeking:"mh:seeking",
	seeked:"mh:seeked",
	timeupdate:"mh:timeupdate",
	timeUpdate:"mh:timeupdate",
	seekTo:"mh:setseek",
	endVideo:"mh:endvideo",
	seekToFrame:"mh:seektotime",	// deprecated, use seekToTime instead
	seekToTime:"mh:seektotime",
	setTrim:"mh:settrim",
	showEditor:"mh:showeditor",
	hideEditor:"mh:hideeditor",
	setPlaybackRate:"mh:setplaybackrate",
	setVolume:'mh:setVolume',
	setComposition:'mh:setComposition',
	loadStarted:'mh:loadStarted',
	loadComplete:'mh:loadComplete',
	loadPlugins:'mh:loadPlugins',
	error:'mh:error',
	setProfile:'mh:setprofile',
	didSaveChanges:'mh:didsavechanges',
	controlBarWillHide:'mh:controlbarwillhide',
	controlBarDidShow:'mh:controlbardidshow',
	beforeUnload:'mh:beforeUnload'
};

paella.AsyncLoaderCallback = Class.create({
	name:"",

	initialize:function(name) {
		this.name = name;	
	},
	
	load:function(onSuccess,onError) {
		paella.debug.log("loading " + this.name);
		onSuccess();
		// If error: onError()
	}
});

paella.AsyncLoader = Class.create({
	callbackArray:null,
	currentCallback:-1,

	initialize:function() {
		this.callbackArray = [];
	},
	
	addCallback:function(cb) {
		this.currentCallback = -1;
		this.callbackArray.push(cb);
		return cb;
	},
	
	load:function(onSuccess,onError) {
		this.currentCallback++;
		var thisClass = this;
		var cb = this.callbackArray[this.currentCallback];
		if (cb) {
			cb.load(function() {
				thisClass.load(onSuccess);
			},
			function() {
				if(onError) onError();
			});
		}
		else if (onSuccess) {
			onSuccess();
		}
	}
});

paella.DictionaryLoader = Class.create(paella.AsyncLoaderCallback,{
	dictionaryUrl:'',

	initialize:function(dictionaryUrl) {
		this.parent("dictionaryLoader");
		this.dictionaryUrl = dictionaryUrl;
	},
	
	load:function(onSuccess,onError) {
		var lang = paella.utils.language();
		var url = this.dictionaryUrl + '_' + lang + '.json';
		var params = {}
		new paella.Ajax(url,params,function(data) {
			if (typeof(data)=="string") {
				try {
					data = JSON.parse(data);
				}
				catch (e) {
					onSuccess();
					return;
				}
			}

			paella.dictionary.addDictionary(data);
			onSuccess();
		});
	}
});

paella.Dictionary = Class.create({
	dictionary:{},

	initialize:function() {
		
	},

	addDictionary:function(dict) {
		for (var key in dict) {
			this.dictionary[key] = dict[key];
		}
	},
	
	translate:function(key) {
		var value = this.dictionary[key];
		if (value) return value;
		else return key;
	}
});

paella.dictionary = new paella.Dictionary();

paella.Ajax = Class.create({
	callback:null,

	// Params:
	//	url:http://...
	//	data:{param1:'param1',param2:'param2'...}
	// 	onSuccess:function(response)
	initialize:function(url,params,onSuccess,proxyUrl,useJsonp,method) {
		var thisClass = this;
		this.callback = onSuccess;
		var thisClass = this;
		if (!method) method = 'get';
		if (useJsonp) {
            jQuery.ajax({url:url,type:method,dataType:'jsonp', jsonp:'jsonp', jsonpCallback:'callback', data:params,cache:false}).always(function(data) {
				//paella.debug.log('using jsonp');
				thisClass.callCallback(data);
			});
		}
		else if (proxyUrl && proxyUrl!="") {
			params.url = url;
			jQuery.ajax({url:proxyUrl,type:method,data:params,cache:false}).always(function(data) {
				//paella.debug.log('using AJAX');
				thisClass.callCallback(data);
			});
		}
		else {
			jQuery.ajax({url:url,type:method,data:params,cache:false}).always(function(data) {
				//paella.debug.log('using AJAX whithout proxy');
				thisClass.callCallback(data);
			});
		}
	},

	callCallback:function(data) {
		if (this.callback && data!=null) {
			if (typeof(data)=="object" && data.responseText) {
				this.callback(data.responseText);
			}
			else {
				this.callback(data);
			}
		}
		else if (this.callback) {
			this.callback('{"result":"ok"}');
		}
	}
});

paella.Cookies = Class.create({
	set:function(name,value) {
		document.cookie = name + "=" + value;
	},
	
	get:function(name) {
		var i,x,y,ARRcookies=document.cookie.split(";");
		for (i=0;i<ARRcookies.length;i++) {
			x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
			y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
			x=x.replace(/^\s+|\s+$/g,"");
			if (x==name) {
				return unescape(y);
			}
		}
	}
});

var Utils = Class.create({
	cookies:new paella.Cookies(),

	parameters:{
		get:function(parameter) {
			var url = location.href;
			var index = url.indexOf("?");
			index = url.indexOf(parameter,index) + parameter.length;
			if (url.charAt(index)=="=") {
				var result = url.indexOf("&",index);
				if (result==-1) {
					result = url.length;
				}
				return url.substring(index + 1, result);
			}
			return "";
		}
	},

    require: function(libraryName) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = libraryName;
        document.getElementsByTagName('head')[0].appendChild(script);
    },
    
    importStylesheet:function(stylesheetFile) {
    	var link = document.createElement('link');
    	link.setAttribute("rel","stylesheet");
    	link.setAttribute("href",stylesheetFile);
    	link.setAttribute("type","text/css");
    	link.setAttribute("media","screen");
    	document.getElementsByTagName('head')[0].appendChild(link);
    },

	Timer: Class.create({
		timerId:0,
		callback:null,
		params:null,
		jsTimerId:0,
		repeat:false,
		timeout:0,

		initialize:function(callback,time,params) {
			this.callback = callback;
			this.params = params;
			timerManager.setupTimer(this,time);
		},

		cancel:function() {
			clearTimeout(this.jsTimerId);
		}
	}),
	
	timeParse:{
		secondsToTime:function(seconds) {
			var hrs = ~~ (seconds / 3600);
			if (hrs<10) hrs = '0' + hrs;
			var mins = ~~ ((seconds % 3600) / 60);
			if (mins<10) mins = '0' + mins;
			var secs = Math.floor(seconds % 60);
			if (secs<10) secs = '0' + secs;
			return hrs + ':' + mins + ':' + secs;
		},
		secondsToText:function(secAgo) {
			// Seconds
			if (secAgo <= 1) {
				return paella.dictionary.translate("1 second ago")
			}
			if (secAgo < 60) {
				return paella.dictionary.translate("{0} seconds ago").replace(/\{0\}/g, secAgo);
			}
			// Minutes
			var minAgo = Math.round(secAgo/60);
			if (minAgo <= 1) {
				return paella.dictionary.translate("1 minute ago");
			}
			if (minAgo < 60) {
				return paella.dictionary.translate("{0} minutes ago").replace(/\{0\}/g, minAgo);
			}
			//Hours
			var hourAgo = Math.round(secAgo/(60*60));
			if (hourAgo <= 1) {
				return paella.dictionary.translate("1 hour ago");
			}
			if (hourAgo < 24) {
				return paella.dictionary.translate("{0} hours ago").replace(/\{0\}/g, hourAgo);
			}
			//Days
			var daysAgo = Math.round(secAgo/(60*60*24));
			if (daysAgo <= 1) {
				return paella.dictionary.translate("1 day ago");
			}
			if (daysAgo < 24) {
				return paella.dictionary.translate("{0} days ago").replace(/\{0\}/g, daysAgo);
			}
			//Months
			var monthsAgo = Math.round(secAgo/(60*60*24*30));
			if (monthsAgo <= 1) {
				return paella.dictionary.translate("1 month ago");
			}
			if (monthsAgo < 12) {
				return hourAgo + paella.dictionary.translate("{0} months ago").replace(/\{0\}/g, monthsAgo);
			}
			//Years
			var yearsAgo = Math.round(secAgo/(60*60*24*365));
			if (yearsAgo <= 1) {
				return paella.dictionary.translate("1 year ago");
			}
			return paella.dictionary.translate("{0} years ago").replace(/\{0\}/g, yearsAgo);			
		},
		matterhornTextDateToDate: function(mhdate) {
			var d = new Date();
			d.setFullYear(parseInt(mhdate.substring(0, 4), 10));
			d.setMonth(parseInt(mhdate.substring(5, 7), 10) - 1);
			d.setDate(parseInt(mhdate.substring(8, 10), 10));
			d.setHours(parseInt(mhdate.substring(11, 13), 10));
			d.setMinutes(parseInt(mhdate.substring(14, 16), 10));
			d.setSeconds(parseInt(mhdate.substring(17, 19), 10));
			
			return d;
		}	
	},
	
	language:function() {
		var lang = navigator.language || window.navigator.userLanguage;
		return lang.substr(0, 2).toLowerCase();
	}
});

paella.utils = new Utils();

var MouseManager = Class.create({
	targetObject:null,

	initialize:function() {
		var thisClass = this;
		$(document).bind('mouseup',function(event) { thisClass.up(event); });
		$(document).bind('mousemove',function(event) { thisClass.move(event); });
		$(document).bind('mouseover',function(event) { thisClass.over(event); });
	},

	down:function(targetObject,event) {
		this.targetObject = targetObject;
		if (this.targetObject && this.targetObject.down) {
			this.targetObject.down(event,event.pageX,event.pageY);
			event.cancelBubble = true;
		}
		return false;
	},

	up:function(event) {
		if (this.targetObject && this.targetObject.up) {
			this.targetObject.up(event,event.pageX,event.pageY);
			event.cancelBubble = true;
		}
		this.targetObject = null;
		return false;
	},
	
	out:function(event) {
		if (this.targetObject && this.targetObject.out) {
			this.targetObject.out(event,event.pageX,event.pageY);
			event.cancelBubble = true;
		}
		return false;
	},

	move:function(event) {
		if (this.targetObject && this.targetObject.move) {
			this.targetObject.move(event,event.pageX,event.pageY);
			event.cancelBubble = true;
		}
		return false;
	},
	
	over:function(event) {
		if (this.targetObject && this.targetObject.over) {
			this.targetObject.over(event,event.pageX,event.pageY);
			event.cancelBubble = true;
		}
		return false;
	}
});

paella.utils.mouseManager = new MouseManager();

paella.Profiles = {
	loadProfile:function(profileName,onSuccessFunction) {
		var url = "config/profiles/profiles.json";
		var params = {};

		new paella.Ajax(url,params,function(data) {
			if (typeof(data)=="string") {
				data = JSON.parse(data);
			}
			onSuccessFunction(data[profileName]);
		});
	},
	
	loadProfileList:function(onSuccessFunction) {
		var url = "config/profiles/profiles.json";
		var params = {};

		new paella.Ajax(url,params,function(data) {
			if (typeof(data)=="string") {
				data = JSON.parse(data);
			}
			onSuccessFunction(data);
		});
	}
};

var RelativeVideoSize = Class.create({
	w:1280,h:720,
	
	proportionalHeight:function(newWidth) {
		return Math.floor(this.h * newWidth / this.w);
	},
	
	proportionalWidth:function(newHeight) {
		return Math.floor(this.w * newHeight / this.h);
	},
	
	percentVSize:function(pxSize) {
		return pxSize * 100 / this.h;
	},
	
	percentWSize:function(pxSize) {
		return pxSize * 100 / this.w;
	},
	
	aspectRatio:function() {
		return this.w/this.h;
	}
});

var Node = Class.create({
	identifier:'',
	nodeList:null,
	
	initialize:function(id) {
		this.nodeList = new Array();
		this.identifier = id;
	},
	
	addTo:function(parentNode) {
		parentNode.addNode(this);
	},
	
	addNode:function(childNode) {
		this.nodeList[childNode.identifier] = childNode;
		return childNode;
	},
	
	getNode:function(id) {
		return this.nodeList[id];
	}
});

var DomNode = Class.create(Node,{
	domElement:null,
	
	initialize:function(elementType,id,style) {
		this.parent(id);
		this.domElement = document.createElement(elementType);
		this.domElement.id = id;
		if (style) $(this.domElement).css(style);
	},
	
	addNode:function(childNode) {
		var returnValue = this.parent(childNode);
		this.domElement.appendChild(childNode.domElement);
		return returnValue;
	},

	onresize:function() {
	}
});


var FlashVideo = Class.create(DomNode,{
	classNameBackup:'',
	flashVideo:null,
	paused:true,
	streamingMode:true,
	flashId:'',

	initialize:function(id,left,top,width,height) {
		this.flashId = id + 'Movie';
		var relativeSize = new RelativeVideoSize();
		var percentTop = relativeSize.percentVSize(top) + '%';
		var percentLeft = relativeSize.percentWSize(left) + '%';
		var percentWidth = relativeSize.percentWSize(width) + '%';
		var percentHeight = relativeSize.percentVSize(height) + '%';
		var style = {top:percentTop,left:percentLeft,width:percentWidth,height:percentHeight,position:'absolute',zIndex:GlobalParams.video.zIndex};
		this.parent('div',id,style);
	},
	
	isReady:function() {
		return true;
	},

	// Adobe Flash utils
	addParameter:function(swf,name,value) {
		var param = document.createElement('param');
		param.setAttribute("name",name);
		param.setAttribute("value",value);
		swf.appendChild(param);
	},

	createSwf:function(url,params) {
		var ieobject = document.createElement('object');
		ieobject.setAttribute('id',this.flashId + 'IE');
		ieobject.setAttribute('classid', 'clsid:d27cdb6e-ae6d-11cf-96b8-444553540000');
		ieobject.setAttribute('codebase', '"http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=5,0,0,0"');
		ieobject.setAttribute("width","100%");
		ieobject.setAttribute("height","100%");
		this.addParameter(ieobject,"movie",url);
		this.addParameter(ieobject,"quality","high");
		this.addParameter(ieobject,"bgcolor","#efefef");
		this.addParameter(ieobject,"play","true");
		this.addParameter(ieobject,"loop","true");
		this.addParameter(ieobject,"wmode","window");
		this.addParameter(ieobject,"scale","default");
		this.addParameter(ieobject,"menu","true");
		this.addParameter(ieobject,"devicefont","false");
		this.addParameter(ieobject,"salign","");
		this.addParameter(ieobject,"allowScriptAccess","sameDomain");
	
		var object = document.createElement('object');
		object.setAttribute('id',this.flashId);
		object.setAttribute("type","application/x-shockwave-flash");
		object.setAttribute("data",url);
		object.setAttribute("width","100%");
		object.setAttribute("height","100%");
		this.addParameter(object,"movie",url);
		this.addParameter(object,"quality","high");
		this.addParameter(object,"bgcolor","#efefef");
		this.addParameter(object,"play","true");
		this.addParameter(object,"loop","true");
		this.addParameter(object,"wmode","window");
		this.addParameter(object,"scale","default");
		this.addParameter(object,"menu","true");
		this.addParameter(object,"devicefont","false");
		this.addParameter(object,"salign","");
		this.addParameter(object,"allowScriptAccess","sameDomain");
		ieobject.appendChild(object);
		
		var flashVars = "";
		var separator = "";
		for (var key in params) {
			flashVars += separator + key + "=" + encodeURIComponent(params[key]);
			separator = "&";
		}
		this.addParameter(ieobject,"flashvars",flashVars);
		this.addParameter(object,"flashvars",flashVars);
		
		var link = document.createElement('a');
		link.setAttribute("href", "http://www.adobe.com/go/getflash");
		link.innerHTML = '<img src="http://www.adobe.com/images/shared/download_buttons/get_flash_player.gif" alt="Obtener Adobe Flash Player" />';
		object.appendChild(link);

		return ieobject;
	},
	
	setClassName:function(className) {
		this.domElement.className = className;
	},
	
	play:function() {
		if (this.flashVideo) {
			try {
				this.flashVideo.play();
				this.paused = false;
				return true;
			}
			catch(e) {
			}
		}
		return false;
	},
	
	pause:function() {
		if (this.flashVideo) {
			try {
				this.flashVideo.pause();
				this.paused = true;
				return true;
			}
			catch(e) {
			}
		}
		return false;
	},
	
	isPaused:function() {
		return this.paused;
	},
	
	duration:function() {
		if (this.flashVideo) {
			try {
				return this.flashVideo.duration();
			}
			catch (e) {
				return -1;
			}
		}
	},

	setCurrentTime:function(time) {
		if (this.flashVideo) {
			try {
				this.flashVideo.seekToTime(time);
			}
			catch(e) {
			}
		}
	},

	currentTime:function() {
		if (this.flashVideo) {
			try {
				return this.flashVideo.getCurrentTime();
			}
			catch (e) {
				return 0;
			}
		}
		return -1;
	},
	
	setVolume:function(volume) {
		if (this.flashVideo) {
			var thisClass = this;
			try {
				this.flashVideo.setVolume(volume);
				return true;
			}
			catch(e) {
				new Timer(function(timer) {
					try {
						thisClass.flashVideo.setVolume(volume);
						timer.repeat = false;
					}
					catch(e2) {
						paella.debug.log('Fail to set volume on ' + thisClass.identifier);
						timer.repeat = true;
					}
				},100);
			}
		}
		return false;
	},
	
	volume:function() {
		return this.flashVideo.getVolume();
	},
	
	setPlaybackRate:function(rate) {
	},
	
	createSwfObject:function(swfFile,flashVars) {
		var id = this.identifier;
		var parameters = { wmode:'transparent' };
		
		var domElement = document.createElement('div');
		this.domElement.appendChild(domElement);
		domElement.id = id + "Movie";
		swfobject.embedSWF(swfFile,domElement.id,"100%","100%","9.0.0","",flashVars,parameters);
		
		var flashObj = $('#' + domElement.id)[0];
		return flashObj;
	},

	addSourceProgresiveDownload:function(sourceData){
		if (sourceData.type=='video/mp4') {
			var parameters = {};
			
			if (!/rtmp:\/\//.test(sourceData.src)) {
				parameters.url = sourceData.src;
				
				this.flashVideo = this.createSwfObject("player.swf",parameters);
			}
		}
		else if (sourceData.type=='video/x-flv') {
			var parameters = {};
			parameters.url = sourceData.src;
			this.flashVideo = this.createSwfObject("player.swf",parameters);
		}
	},
	
	addSourceStreaming:function(sourceData) {
		if (sourceData.type=='video/mp4') {
			var parameters = {};
			if (/(rtmp:\/\/[\w\d\.\-_]+[:+\d]*\/[\w\d\-_]+\/)(mp4:)([\w\d\.\/\-_]+)/i.test(sourceData.src)) {
				sourceData.src = RegExp.$1 + RegExp.$3;
			}
			
			if (/(rtmp:\/\/)([\w\d\.\-_]+[:+\d]*)\/([\w\d\-_]+\/)([\w\d\.\/\-_]+)/.test(sourceData.src)) {
				parameters.connect = RegExp.$1 + RegExp.$2 + '/' + RegExp.$3;
				parameters.url = "mp4:" + RegExp.$4;
			}
			
			this.flashVideo = this.createSwfObject("player.swf",parameters);
		}
		else if (sourceData.type=='video/x-flv') {
			var parameters = {};
			
			if (/(rtmp:\/\/)([\w\d\.\-_]+[:+\d]*)\/([\w\d\-_]+\/)([\w\d\.\/\-_]+)(\.flv)+/.test(sourceData.src)) {
				parameters.connect = RegExp.$1 + RegExp.$2 + '/' + RegExp.$3;
				parameters.url = RegExp.$4;
			}
			
			this.flashVideo = this.createSwfObject("player.swf",parameters);
		}
	},

	addSource:function(sourceData) {
		if (this.streamingMode) {
			this.addSourceStreaming(sourceData);
		}
		else{
			this.addSourceProgresiveDownload(sourceData);
		}
	},
	
	getDimensions:function() {
		var dim = {width:640, height:480};
		try {
			dim.width = this.flashVideo.getWidth();
			dim.height = this.flashVideo.getHeight();
		}
		catch (e) {
			paella.debug.log("Warning: flash video is not loaded");
		}
		return dim;
	},

	setRect:function(rect,animate) {
		var relativeSize = new RelativeVideoSize();
		var percentTop = relativeSize.percentVSize(rect.top) + '%';
		var percentLeft = relativeSize.percentWSize(rect.left) + '%';
		var percentWidth = relativeSize.percentWSize(rect.width) + '%';
		var percentHeight = relativeSize.percentVSize(rect.height) + '%';
		var style = {top:percentTop,left:percentLeft,width:percentWidth,height:percentHeight,position:'absolute'};
		if (animate) {
			this.disableClassName();
			var thisClass = this;
			$(this.domElement).animate(style,400,function(){ thisClass.enableClassName(); })
			this.enableClassNameAfter(400);
		}
		else {
			$(this.domElement).css(style);
		}
	},
	
	disableClassName:function() {
		this.classNameBackup = this.domElement.className;
		this.domElement.className = "";
	},
	
	enableClassName:function() {
		this.domElement.className = this.classNameBackup;
	},
	
	enableClassNameAfter:function(millis) {
		setTimeout("$('#" + this.domElement.id + "')[0].className = '" + this.classNameBackup + "'",millis);
	},
	
	setVisible:function(visible,animate) {
		if (visible=="true" && animate) {
			$(this.domElement).animate({opacity:1.0},300);
		}
		else if (visible=="true" && !animate) {
			$(this.domElement).show();
		}
		else if (visible=="false" && animate) {
			$(this.domElement).animate({opacity:0.0},300);
		}
		else if (visible=="false" && !animate) {
			$(this.domElement).hide();
		}
	},
	
	setLayer:function(layer) {
		this.domElement.style.zIndex = layer;
	}
});

var Html5Video = Class.create(DomNode,{
	classNameBackup:'',
	ready:false,

	initialize:function(id,left,top,width,height) {
		var thisClass = this;
		var relativeSize = new RelativeVideoSize();
		var percentTop = relativeSize.percentVSize(top) + '%';
		var percentLeft = relativeSize.percentWSize(left) + '%';
		var percentWidth = relativeSize.percentWSize(width) + '%';
		var percentHeight = relativeSize.percentVSize(height) + '%';
		var style = {top:percentTop,left:percentLeft,width:percentWidth,height:percentHeight,position:'absolute',zIndex:GlobalParams.video.zIndex};
		this.parent('video',id,style);
		$(this.domElement).bind('canplay',function(event) {
			thisClass.ready = true;
		});
	},
	
	isReady:function() {
		return this.ready;
	},
	
	setClassName:function(className) {
		this.domElement.className = className;
	},
	
	play:function() {
		if (this.domElement && this.domElement.play) {
			this.domElement.play();
		}
	},
	
	pause:function() {
		if (this.domElement && this.domElement.pause) {
			this.domElement.pause();
		}
	},
	
	isPaused:function() {
		return this.domElement.paused;
	},
	
	duration:function() {
		if (this.domElement && this.domElement.duration) {
			return this.domElement.duration;
		}
	},

	setCurrentTime:function(time) {
		if (this.domElement && this.domElement.currentTime) {
			this.domElement.currentTime = time;
		}
	},

	currentTime:function() {
		if (this.domElement && this.domElement.currentTime) {
			return this.domElement.currentTime;
		}
		return 0;
	},
	
	setVolume:function(volume) {
		this.domElement.volume = volume;
		return true;
	},
	
	volume:function() {
		return this.domElement.volume;
	},
	
	setPlaybackRate:function(rate) {
		this.domElement.playbackRate = rate;
	},
	
	addSource:function(sourceData) {
		var source = document.createElement('source');
		source.src = sourceData.src;
		source.type = sourceData.type;
		this.domElement.appendChild(source);
	},
	
	getDimensions:function() {
		return { width: this.domElement.videoWidth, height: this.domElement.videoHeight };
	},

	setRect:function(rect,animate) {
		var relativeSize = new RelativeVideoSize();
		var percentTop = relativeSize.percentVSize(rect.top) + '%';
		var percentLeft = relativeSize.percentWSize(rect.left) + '%';
		var percentWidth = relativeSize.percentWSize(rect.width) + '%';
		var percentHeight = relativeSize.percentVSize(rect.height) + '%';
		var style = {top:percentTop,left:percentLeft,width:percentWidth,height:percentHeight,position:'absolute'};
		if (animate) {
			this.disableClassName();
			var thisClass = this;
			$(this.domElement).animate(style,400,function(){ thisClass.enableClassName(); })
			this.enableClassNameAfter(400);
		}
		else {
			$(this.domElement).css(style);
		}
	},
	
	disableClassName:function() {
		this.classNameBackup = this.domElement.className;
		this.domElement.className = "";
	},
	
	enableClassName:function() {
		this.domElement.className = this.classNameBackup;
	},
	
	enableClassNameAfter:function(millis) {
		setTimeout("$('#" + this.domElement.id + "')[0].className = '" + this.classNameBackup + "'",millis);
	},
	
	setVisible:function(visible,animate) {
		if (visible=="true" && animate) {
			$(this.domElement).animate({opacity:1.0},300);
		}
		else if (visible=="true" && !animate) {
			$(this.domElement).show();
		}
		else if (visible=="false" && animate) {
			$(this.domElement).animate({opacity:0.0},300);
		}
		else if (visible=="false" && !animate) {
			$(this.domElement).hide();
		}
	},
	
	setLayer:function(layer) {
		this.domElement.style.zIndex = layer;
	}
});

var BackgroundContainer = Class.create(DomNode,{
	initialize:function(id,image) {
		this.parent('img',id,{position:'relative',top:'0px',left:'0px',right:'0px',bottom:'0px',zIndex:GlobalParams.background.zIndex});
		this.domElement.setAttribute('src',image);
		this.domElement.setAttribute('alt','');
		this.domElement.setAttribute('width','100%');
		this.domElement.setAttribute('height','100%');
	},
	
	setImage:function(image) {
		this.domElement.setAttribute('src',image);
	}
});

paella.VideoOverlay = Class.create(DomNode,{
	size:{w:1280,h:720},
	
	initialize:function() {
		var style = {position:'absolute',left:'0px',right:'0px',top:'0px',bottom:'0px',overflow:'hidden',zIndex:10};
		this.parent('div','overlayContainer',style);
	},
	
	enableBackgroundMode:function() {
		this.domElement.className = 'overlayContainer background';
	},
	
	disableBackgroundMode:function() {
		this.domElement.className = 'overlayContainer';
	},
	
	clear:function() {
		this.domElement.innerHTML = "";
	},
	
	getMasterRect:function() {
		return paella.player.videoContainer.getMasterVideoRect();
	},
	
	getSlaveRect:function() {
		return paella.player.videoContainer.getSlaveVideoRect()
	},
	
	addText:function(text,rect,isDebug) {
		var textElem = document.createElement('div0');
		textElem.innerHTML = text;
		textElem.className = "videoOverlayText";
		if (isDebug) textElem.style.backgroundColor = "red";
		return this.addElement(textElem,rect);
	},
	
	addElement:function(element,rect) {
		this.domElement.appendChild(element);
		element.style.position = 'absolute';
		element.style.left = this.getHSize(rect.left) + '%';
		element.style.top = this.getVSize(rect.top) + '%';
		element.style.width = this.getHSize(rect.width) + '%';
		element.style.height = this.getVSize(rect.height) + '%';
		return element;
	},
	
	removeElement:function(element) {
		this.domElement.removeChild(element);
	},
	
	getVSize:function(px) {
		return px*100/this.size.h;
	},
	
	getHSize:function(px) {
		return px*100/this.size.w;
	}
});

paella.VideoContainerBase = Class.create(DomNode,{
	trimming:{enabled:false,start:0,end:0},
	timeupdateEventTimer:null,

	initialize:function(id) {
		var style = {position:'absolute',left:'0px',right:'0px',top:'0px',bottom:'0px',overflow:'hidden'}
		this.parent('div',id,style);
	},
	
	initEvents:function() {
		var thisClass = this;
		$(document).bind(paella.events.play,function(event) { thisClass.play(); thisClass.startTimeupdate(); });
		$(document).bind(paella.events.pause,function(event) { thisClass.pause(); thisClass.stopTimeupdate(); });
		$(document).bind(paella.events.next,function(event) { thisClass.next(); thisClass.triggerTimeupdate(); });
		$(document).bind(paella.events.previous,function(event) { thisClass.previous(); thisClass.triggerTimeupdate(); });
		$(document).bind(paella.events.seekTo,function(event,params) { thisClass.setCurrentPercent(params.newPositionPercent); thisClass.triggerTimeupdate(); });
		$(document).bind(paella.events.seekToTime,function(event,params) { thisClass.setCurrentTime(params.time); thisClass.triggerTimeupdate(); });
		$(document).bind(paella.events.setPlaybackRate,function(event,params) { thisClass.setPlaybackRate(params); });
		$(document).bind(paella.events.setVolume,function(event,params) { thisClass.setVolume(params); });
		$(document).bind(paella.events.setTrim,function(event,params) { thisClass.setTrim});
	},
	
	triggerTimeupdate:function() {
		var thisClass = this;
		$(document).trigger(paella.events.timeupdate,{videoContainer:thisClass, currentTime:thisClass.currentTime() });
	},
	
	startTimeupdate:function() {
		var thisClass = this;
		this.timeupdateEventTimer = new Timer(function(timer) {
			thisClass.triggerTimeupdate();
		},250);
		this.timeupdateEventTimer.repeat = true;
	},
	
	stopTimeupdate:function() {
		this.timeupdateEventTimer.repeat = false;
		this.timeupdateEventTimer = null;
	},

	play:function() {
		paella.debug.log('VideoContainerBase.play()');
	},
	
	pause:function() {
		paella.debug.log('VideoContainerBase.pause()');
	},
	
	trimStart:function() {
		return 0;
	},
	
	trimEnd:function() {
		return this.duration();
	},

	trimEnabled:function() {
		return false;
	},
	
	enableTrimming:function() {
		this.trimming.enabled = true;
		$(document).trigger(paella.events.setTrim,{trimEnabled:this.trimming.enabled,trimStart:this.trimming.start,trimEnd:this.trimming.end});
	},
	
	disableTrimming:function() {
		this.trimming.enabled = false;
		$(document).trigger(paella.events.setTrim,{trimEnabled:this.trimming.enabled,trimStart:this.trimming.start,trimEnd:this.trimming.end});
	},
	
	setTrimming:function(start,end) {
		this.trimming.start = start;
		this.trimming.end = end;
		if (this.currentTime<this.trimming.start) {
			this.setCurrentTime(this.trimming.start);
		}
		if (this.currentTime>this.trimming.end) {
			this.setCurrentTime(this.trimming.end);
		}
		$(document).trigger(paella.events.setTrim,{trimEnabled:this.trimming.enabled,trimStart:this.trimming.start,trimEnd:this.trimming.end});
	},
	
	setTrimmingStart:function(start) {
		this.setTrimming(start,this.trimming.end);
	},
	
	setTrimmingEnd:function(end) {
		this.setTrimming(this.trimming.start,end);
	},
	
	setCurrentPercent:function(percent) {
		var start = this.trimStart();
		var end = this.trimEnd();
		var duration = end - start;
		var trimedPosition = percent * duration / 100;
		var realPosition = parseFloat(trimedPosition) + parseFloat(start);
		this.setCurrentTime(realPosition);
	},

	setCurrentTime:function(time) {
		paella.debug.log("VideoContainerBase.setCurrentTime(" +  time + ")");
	},
	
	currentTime:function() {
		paella.debug.log("VideoContainerBase.currentTime()");
		return 0;
	},
	
	duration:function() {
		paella.debug.log("VideoContainerBase.duration()");
		return 0
	},
	
	paused:function() {
		paella.debug.log("VideoContainerBase.paused()");
		return true;
	},
	
	setupVideo:function(onSuccess) {
		paella.debug.log("VideoContainerBase.setupVide()");
	},
	
	setPlaybackRate:function(params) {
		paella.debug.log("VideoContainerBase.setPlaybackBase(" + params.rate + ")");
	},
	
	setVolume:function(params) {
		paella.debug.log("VideoContainerBase.setVolume(" + params.master + ")");
	},
	
	volume:function() {
		paella.debug.log("VideoContainerBase.volume()");
		return 1;
	},
	
	isReady:function() {
		paella.debug.log("VideoContainerBase.isReady()");
		return true;
	},

	onresize:function() { this.parent(onresize);
	}
});

var VideoContainer = Class.create(paella.VideoContainerBase,{
	containerId:'',
	video1Id:'',
	video2Id:'',
	backgroundId:'',
	container:null,
	video1ClassName:'video masterVideo',
	video2ClassName:'video slaveVideo',
	//fitHorizontal:false,
	isHidden:false,
	maxSyncDelay:0.5,
	logos:null,
	isMasterReady:false,
	isSlaveReady:false,
	isMonostream:false,
	sourceData:[],
	overlayContainer:null,
	videoSyncTimeMillis:5000,
	currentMasterVideoRect:{},
	currentSlaveVideoRect:{},

	initialize:function(id) {
		this.parent(id);
		this.containerId = id + '_container';
		this.video1Id = id + '_1';
		this.video2Id = id + '_2';
		this.backgroundId = id + '_bkg';
		this.logos = [];
				
		this.container = new DomNode('div',this.containerId,{position:'relative',display:'block',marginLeft:'auto',marginRight:'auto',width:'1024px',height:'567px'});
		this.addNode(this.container);
		
		this.overlayContainer = new paella.VideoOverlay(this.domElement);
		this.container.addNode(this.overlayContainer);
		
		this.container.addNode(new BackgroundContainer(this.backgroundId,'config/profiles/resources/default_background_paella.jpg'));
		var thisClass = this;

		this.initEvents();
		$(document).bind(paella.events.timeupdate,function(event) { thisClass.checkVideoTrimming(); } );
		
		var thisClass = this;
		var timer = new paella.utils.Timer(function(timer) {
			thisClass.syncVideos();
		},thisClass.videoSyncTimeMillis);
		timer.repeat = true;
	},
	
	getMasterVideoRect:function() {
		return this.currentMasterVideoRect;
	},
	
	getSlaveVideoRect:function() {
		return this.currentSlaveVideoRect;
	},
	
	createVideoPlayers:function() {
		var masterVideo = new FlashVideo(this.video1Id,850,140,360,550);
		masterVideo.setClassName(this.video1ClassName);
		this.container.addNode(masterVideo);
		
		var slaveVideo = new FlashVideo(this.video2Id,10,40,800,600);
		slaveVideo.setClassName(this.video2ClassName);
		slaveVideo.setVolume(0);
		this.container.addNode(slaveVideo);
	},

	setHidden:function(hidden) {
		this.isHidden = hidden;
	},

	hideVideo:function() {
		this.setHidden(true);
	},
	
	publishVideo:function() {
		this.setHidden(false);
	},

	syncVideos:function() {
		var masterVideo = this.masterVideo();
		var slaveVideo = this.slaveVideo();
		if (!this.isMonostream && masterVideo && slaveVideo && masterVideo.currentTime && slaveVideo.currentTime) {
			var diff = Math.abs(masterVideo.currentTime() - slaveVideo.currentTime());

			if (diff>this.maxSyncDelay) {
				paella.debug.log("Sync videos performed, diff=" + diff);
				slaveVideo.setCurrentTime(masterVideo.currentTime());
			}
		}
	},

	checkVideoTrimming:function() {
		var current = this.currentTime();
		var end = this.duration();
		var start = 0;
		if (this.trimming.enabled) {
			end = this.trimming.end;
			start = parseFloat(this.trimming.start);
		}
		if (current>=Math.floor(end)) {
			var thisClass = this;
			$(document).trigger(paella.events.endVideo,{videoContainer:thisClass});
			this.pause();
		}
		else if (current<start) {
			this.setCurrentTime(start + 1);
		}
	},
	
	play:function() {
		var masterVideo = this.masterVideo();
		var slaveVideo = this.slaveVideo();
		if (masterVideo) masterVideo.play();
		if (slaveVideo) slaveVideo.play();
	},
	
	pause:function() {
		var masterVideo = this.masterVideo();
		var slaveVideo = this.slaveVideo();
		if (masterVideo) masterVideo.pause();
		if (slaveVideo) slaveVideo.pause();
	},
	
	next:function() {
		if (this.trimming.end!=0) {
			this.setCurrentTime(this.trimming.end);			
		}
		else {
			this.setCurrentTime(this.duration(true));
		}
	},
	
	previous:function() {
		this.setCurrentTime(this.trimming.start);
	},

	setCurrentTime:function(time) {
		if (this.trimming.enabled) {
			if (time<this.trimming.start) time = this.trimming.start;
			if (time>this.trimming.end) time = this.trimming.end;
		}
		var masterVideo = this.masterVideo();
		var slaveVideo = this.slaveVideo();
		if (masterVideo) masterVideo.setCurrentTime(time);
		if (slaveVideo) slaveVideo.setCurrentTime(time);
	},
	
	currentTime:function() {
		var masterVideo = this.masterVideo();
		var slaveVideo = this.slaveVideo();
		if (masterVideo) return masterVideo.currentTime();
		else if (slaveVideo) return slaveVideo.currentTime();
		else return 0;
	},
	
	setPlaybackRate:function(params) {
		var masterVideo = this.masterVideo();
		var slaveVideo = this.slaveVideo();
		if (masterVideo) {
			masterVideo.setPlaybackRate(params.rate);
		}
		if (slaveVideo) {
			slaveVideo.setPlaybackRate(params.rate);
		}
	},
	
	setVolume:function(params) {
		var masterVideo = this.masterVideo();
		var slaveVideo = this.slaveVideo();
		if (masterVideo && params.master) {
			masterVideo.setVolume(params.master);
		}
		else if (masterVideo) {
			masterVideo.setVolume(0);
		}
		if (slaveVideo && params.slave) {
			slaveVideo.setVolume(params.slave);
		}
		else if (slaveVideo) {
			slaveVideo.setVolume(0);
		}
	},
	
	volume:function(video) {
		if (!video && this.masterVideo()) {
			return this.masterVideo().volume();
		}
		else if (video=="master" && this.masterVideo()) {
			return this.masterVideo().volume();
		}
		else if (video=="slave" && this.slaveVideo()) {
			return this.slaveVideo().volume();
		}
		else {
			return 0;
		}
	},

	masterVideo:function() {
		return this.container.getNode(this.video1Id);
	},
	
	slaveVideo:function() {
		return this.container.getNode(this.video2Id);
	},
	
	duration:function(ignoreTrimming) {
		if (this.trimming.enabled && !ignoreTrimming) {
			return this.trimming.end - this.trimming.start;
		}
		else {
			if (!this.videoDuration) {
				this.videoDuration = this.masterVideo().duration();
			}
			return this.videoDuration;
		}
	},
	
	paused:function() {
		return this.masterVideo().isPaused();
	},

	trimEnabled:function() {
		return this.trimming.enabled;
	},

	trimStart:function() {
		if (this.trimming.enabled) {
			return this.trimming.start;
		}
		else {
			return 0;
		}
	},
	
	trimEnd:function() {
		if (this.trimming.enabled) {
			return this.trimming.end;
		}
		else {
			return this.duration();
		}
	},
	
	setMasterSource:function(masterVideoData,type) {
		if (type=='html') {
			var masterVideo = new Html5Video(this.video1Id,850,140,360,550);
		}
		else if (type=='flash') {
			var masterVideo = new FlashVideo(this.video1Id,850,140,360,550);
			masterVideo.streamingMode = false;
		}
		else if (type=='streaming') {
			var masterVideo = new FlashVideo(this.video1Id,850,140,360,550);
			masterVideo.streamingMode = true;
		}
		masterVideo.setClassName(this.video1ClassName);
		this.container.addNode(masterVideo);
		
		var thisClass = this;
		this.sourceData.push(masterVideoData);
		this.setupVideo(masterVideo,masterVideoData,type);
		new Timer(function(timer) {
			if (masterVideo.isReady()) {
				thisClass.isMasterReady = true;
				timer.repeat = false;
			}
			else {
				timer.repeat = true;
			}
		},100);
		
		// TODO: Return false on video player error
		return true;
	},
	
	setSlaveSource:function(slaveVideoData,type) {
		if (type=='html' || !slaveVideoData) {
			var slaveVideo = new Html5Video(this.video2Id,10,40,800,600);
		}
		else if (type=='flash') {
			var slaveVideo = new FlashVideo(this.video2Id,10,40,800,600);
			slaveVideo.streamingMode = false;
		}
		else if (type=='streaming') {
			var slaveVideo = new FlashVideo(this.video2Id,10,40,800,600);
			slaveVideo.streamingMode = true;
		}
		slaveVideo.setClassName(this.video2ClassName);
		this.container.addNode(slaveVideo);
		
		if (!slaveVideoData) {
			setMonoStreamMode();
			return false;
		}
		
		var thisClass = this;
		this.sourceData.push(slaveVideoData);
		this.setupVideo(slaveVideo,slaveVideoData,type);
		new Timer(function(timer) {
			if (slaveVideo.isReady()) {
				thisClass.isSlaveReady = true;
				slaveVideo.setVolume(0);
				timer.repeat = false;
			}
			else {
				timer.repeat = true;
			}
		},100);
		
		// TODO: Return false on video player error
		return true;
	},

	setMonoStreamMode:function() {
		this.isMonoStream = true;
		this.isSlaveReady = true;
	},
	
	setupVideo:function(videoNode,videoData,type) {
		if (videoNode && videoData) {
			var mp4Source = videoData.sources.mp4;
			var oggSource = videoData.sources.ogg;
			var webmSource = videoData.sources.webm;
			var flvSource = videoData.sources.flv;
			var rtmpSource = videoData.sources.rtmp;
			
			if (type=="html") {
				if (mp4Source) {
					videoNode.addSource(mp4Source);
				}
				if (oggSource) {
					videoNode.addSource(oggSource);
				}
				if (webmSource) {
					videoNode.addSource(webmSource);
				}
			}
			else if (flvSource && type=="flash") {
				videoNode.addSource(flvSource);
			}
			else if (mp4Source && type=="flash") {
				videoNode.addSource(mp4Source);
			}
			else if (rtmpSource && type=="streaming"){
				videoNode.addSource(rtmpSource);
			}
		}
	},
	
	numberOfStreams:function() {
		return this.sourceData.length;
	},

	getMonostreamMasterProfile:function() {
		return {
			content:"presenter",
			visible:true,
			layer:1,
			rect:[
				{aspectRatio:"16/9",left:0,top:0,width:1280,height:720},
				{aspectRatio:"4/3",left:160,top:0,width:960,height:720},
			]
		}
	},
	
	getMonostreamSlaveProfile:function() {
		return {
			content:"slides",
			visible:false,
			layer:0,
			rect:[
				{aspectRatio:"16/9",left:0,top:0,width:0,height:0},
				{aspectRatio:"4/3",left:0,top:0,width:0,height:0},
			]
		}
	},

	setProfile:function(profileName,onSuccess) {
		var thisClass = this;
		paella.Profiles.loadProfile(profileName,function(profileData) {
			if (thisClass.numberOfStreams()==1) {
				profileData.masterVideo = thisClass.getMonostreamMasterProfile();
				profileData.slaveVideo = thisClass.getMonostreamSlaveProfile();
			}
			thisClass.applyProfileWithJson(profileData);
			onSuccess(profileName);
			paella.utils.cookies.set("lastProfile",profileName);
		});
	},
	
	isReady:function() {
		return this.isMasterReady && this.isSlaveReady;
	},

	hideAllLogos:function() {
		for (var i=0;i<this.logos.length;++i) {
			var logoId = this.logos[i];
			var logo = this.container.getNode(logoId);
			$(logo.domElement).hide();
		}
	},

	showLogos:function(logos) {
		var relativeSize = new RelativeVideoSize();
		for (var i=0; i<logos.length;++i) {
			var logo = logos[i];
			var logoId = logo.content;
			var logoNode = this.container.getNode(logoId);
			var rect = logo.rect;
			if (!logoNode) {
				style = {};
				logoNode = this.container.addNode(new DomNode('img',logoId,style));
				logoNode.domElement.setAttribute('src','config/profiles/resources/' + logoId);
				logoNode.domElement.setAttribute('src','config/profiles/resources/' + logoId);
			}
			else {
				$(logoNode.domElement).show();
			}
			var percentTop = relativeSize.percentVSize(rect.top) + '%';
			var percentLeft = relativeSize.percentWSize(rect.left) + '%';
			var percentWidth = relativeSize.percentWSize(rect.width) + '%';
			var percentHeight = relativeSize.percentVSize(rect.height) + '%';
			var style = {top:percentTop,left:percentLeft,width:percentWidth,height:percentHeight,position:'absolute',zIndex:logo.zIndex};
			$(logoNode.domElement).css(style);
		}
	},

	applyProfileWithJson:function(profileData) {
		var video1 = this.container.getNode(this.video1Id);
		var video2 = this.container.getNode(this.video2Id);

		var background = this.container.getNode(this.backgroundId);

		var rectMaster = profileData.masterVideo.rect[0];
		var rectSlave = profileData.slaveVideo.rect[0];
		var masterDimensions = video1.getDimensions();
		var slaveDimensions = {width:360,height:240};
		if (video2) slaveDimensions = video2.getDimensions();
		var masterAspectRatio = (masterDimensions.height==0) ? 1.3333:masterDimensions.width / masterDimensions.height;
		var slaveAspectRatio = (slaveDimensions.height==0) ? 1.3333:slaveDimensions.width / slaveDimensions.height;
		var profileMasterAspectRatio = 1.333;
		var profileSlaveAspectRatio = 1.333;
		
		var minMasterDiff = 10;
		for (var i = 0; i<profileData.masterVideo.rect.length;++i) {
			var profileMaster = profileData.masterVideo.rect[i];
			if (/([0-9]+)\/([0-9]+)/.test(profileMaster.aspectRatio)) {
				profileMasterAspectRatio = Number(RegExp.$1) / Number(RegExp.$2);
			}
			var masterDiff = Math.abs(profileMasterAspectRatio - masterAspectRatio);
			if (minMasterDiff>masterDiff) {
				minMasterDiff = masterDiff;
				rectMaster = profileMaster;
			}
			//paella.debug.log(profileMasterAspectRatio + ' - ' + masterAspectRatio + ' = ' + masterDiff);
		}
		
		var minSlaveDiff = 10;
		for (var i = 0; i<profileData.slaveVideo.rect.length;++i) {
			var profileSlave = profileData.slaveVideo.rect[i];
			if (/([0-9]+)\/([0-9]+)/.test(profileSlave.aspectRatio)) {
				profileSlaveAspectRatio = Number(RegExp.$1) / Number(RegExp.$2);
			}
			var slaveDiff = Math.abs(profileSlaveAspectRatio - slaveAspectRatio);
			if (minSlaveDiff>slaveDiff) {
				minSlaveDiff = slaveDiff;
				rectSlave = profileSlave;
			}
		}
		
		// Logos
		// Hide previous logos
		this.hideAllLogos();

		// Create or show new logos
		this.showLogos(profileData.logos);

		video1.setRect(rectMaster,true);
		this.currentMasterVideoRect = rectMaster;
		video1.setVisible(profileData.masterVideo.visible,true);
		if (video2) {
			video2.setRect(rectSlave,true);
			this.currentSlaveVideoRect = rectSlave;
			video2.setVisible(profileData.slaveVideo.visible,true);
			video2.setLayer(profileData.slaveVideo.layer);
		}
		video1.setLayer(profileData.masterVideo.layer);
		background.setImage('config/profiles/resources/' + profileData.background.content);
	},

	resizePortrail:function() {
		var width = $(this.domElement).width();
		var relativeSize = new RelativeVideoSize();
		var height = relativeSize.proportionalHeight(width);
		this.container.domElement.style.width = width + 'px';
		this.container.domElement.style.height = height + 'px';
		
		var containerHeight = $(this.domElement).height();
		var newTop = containerHeight / 2 - height / 2;
		this.container.domElement.style.top = newTop + "px";
	},
	
	resizeLandscape:function() {
		var height = $(this.domElement).height();
		var relativeSize = new RelativeVideoSize();
		var width = relativeSize.proportionalWidth(height);
		this.container.domElement.style.width = width + 'px';
		this.container.domElement.style.height = height + 'px';
		this.container.domElement.style.top = '0px';
	},

	onresize:function() { this.parent();
		var relativeSize = new RelativeVideoSize();
		var aspectRatio = relativeSize.aspectRatio();
		var width = $(this.domElement).width();
		var height = $(this.domElement).height();
		var containerAspectRatio = width/height;
		
		if (containerAspectRatio>aspectRatio) {
			this.resizeLandscape();
		}
		else {
			this.resizePortrail();
		}
	}
});

paella.PluginManager = Class.create({
	targets:null,
	pluginList:new Array(),
	eventDrivenPlugins:new Array(),
	
	initialize:function() {
		this.targets = {};
		var thisClass = this;
		$(document).bind(paella.events.loadPlugins,function(event) {
			thisClass.loadPlugins();
		});
	},

	setTarget:function(pluginType,target) {
		if (target.addPlugin) {
			this.targets[pluginType] = target;
		}
	},

	getTarget:function(pluginType) {
		// PluginManager can handle event-driven events:
		if (pluginType=="eventDriven") {
			return this;
		}
		else {
			var target = this.targets[pluginType];
			return target;
		}
	},
	
	registerPlugin:function(plugin) {
		// Registra los plugins en una lista y los ordena
		this.pluginList.push(plugin);
		this.pluginList.sort(function(a,b) {
			return a.getIndex() - b.getIndex();
		});
	},

	loadPlugins:function() {
		for (var i=0; i<this.pluginList.length; ++i) {
			var plugin = this.pluginList[i];
			paella.debug.log("loading plugin " + plugin.getName());
			plugin.load(this);
		}
	},
	
	addPlugin:function(plugin) {
		var thisClass = this;
		plugin.checkEnabled(function(isEnabled) {
			if (plugin.type=="eventDriven" && isEnabled) {
				thisClass.eventDrivenPlugins.push(plugin);
				var events = plugin.getEvents();
				for (var i=0; i<events.length;++i) {
					var eventName = events[i];
					$(document).bind(eventName,function(event,params) {
						plugin.onEvent(event.type,params);
					});
				}	
			}
		});
	}
});

paella.pluginManager = new paella.PluginManager();

paella.Plugin = Class.create({
	type:'',
	
	initialize:function() {
		var thisClass = this;
		paella.pluginManager.registerPlugin(this);
	},

	load:function(pluginManager) {
		var target = pluginManager.getTarget(this.type);
		if (target && target.addPlugin) {
			target.addPlugin(this);
		}
	},

	getRootNode:function(id) {
		return null;
	},
	
	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},
	
	getIndex:function() {
		return 0;
	},
	
	getName:function() {
		return "";
	}
});

paella.PlaybackControlPlugin = Class.create(paella.Plugin,{
	type:'playbackControl',

	setLeftPosition:function() {
		paella.debug.log("Warning: obsolete plugin style. The " + this.getName() + " plugin does not implement dynamic positioning. Please, consider to implement setLeftPosition() function.");
	},

	getRootNode:function(id) {
		return null;
	},
	
	getName:function() {
		return "PlaybackControlPlugin";
	},
	
	getMinWindowSize:function() {
		return 0;
	}
});

paella.PlaybackPopUpPlugin = Class.create(paella.Plugin,{
	type:'playbackPopUp',

	getRootNode:function(id) {
		return null;
	},
	
	setRightPosition:function() {
		paella.debug.log("Warning: obsolete plugin style. The " + this.getName() + " plugin does not implement dynamic positioning. Please, consider to implement setRightPosition() function.");
	},

	getPopUpContent:function(id) {
		return null;
	},
	
	getName:function() {
		return "PlaybackPopUpPlugin";
	},
	
	getMinWindowSize:function() {
		return 0;
	}
});

paella.EventDrivenPlugin = Class.create(paella.Plugin,{
	type:'eventDriven',
	
	initialize:function() {
		this.parent();
		var events = this.getEvents();
		for (var i = 0; i<events.length;++i) {
			var event = events[i];
			if (event==paella.events.loadStarted) {
				this.onEvent(paella.events.loadStarted);
			}
		}
	},

	getEvents:function() {
		return new Array();
	},

	onEvent:function(eventType,params) {
	},
	
	getName:function() {
		return "EventDrivenPlugin";
	}
});

// Paella Extended plugins:
paella.RightBarPlugin = Class.create(paella.Plugin,{
	type:'rightBarPlugin',

	getRootNode:function(id) {
		return null;
	},
	
	getName:function() {
		return "RightBarPlugin";
	},
	
	getIndex:function() {
		return 10000;
	}
});

paella.TabBarPlugin = Class.create(paella.Plugin,{
	type:'tabBarPlugin',

	getTabName:function() {
		return "New Tab";
	},

	getRootNode:function(id) {
		return null;
	},
	
	getName:function() {
		return "TabBarPlugin";
	},
	
	getIndex:function() {
		return 100000;
	}
});

var Button = Class.create(DomNode,{
	isToggle:false,

	initialize:function(id,className,action,isToggle) {
		this.isToggle = isToggle;
		var style = {};
		this.parent('div',id,style);
		this.domElement.className = className;
		if (isToggle) {
			var thisClass = this;
			$(this.domElement).click(function(event) {
				thisClass.toggleIcon();
			});
		}
		$(this.domElement).click('click',action);
	},
	
	isToggled:function() {
		if (this.isToggle) {
			var element = $('#' + this.identifier)[0];
			return /([a-zA-Z0-9_]+)_active/.test(element.className);
		}
		else {
			return false;
		}
	},

	toggle:function() {
		this.toggleIcon();
	},

	toggleIcon:function() {
		var element = $('#' + this.identifier)[0];
		if (/([a-zA-Z0-9_]+)_active/.test(element.className)) {
			element.className = RegExp.$1;
		}
		else {
			element.className = element.className + '_active';
		}
		
	},
	
	show:function() {
		$(this.domElement).show();
	},
	
	hide:function() {
		$(this.domElement).hide();
	},
	
	visible:function() {
		return this.domElement.visible();
	}
});

var TimeControl = Class.create(DomNode,{
	initialize:function(id) {
		this.parent('div',id,{left:"0%"});
		this.domElement.className = 'timeControlOld';
		this.domElement.className = 'timeControl';
		//this.domElement.innerHTML = "0:00:00";
		var thisClass = this;
		$(document).bind(paella.events.timeupdate,function(event,params) { thisClass.onTimeUpdate(params); });
	},
	
	onTimeUpdate:function(memo) {
		var videoContainer = memo.videoContainer;
		var real = { start:0, end:videoContainer.duration };
		var trimmed = { start:videoContainer.trimStart(), end:videoContainer.trimEnd() };
		var currentTime = memo.currentTime - trimmed.start;
		var duration = trimmed.end - trimmed.start;
		var percent = currentTime * 100 / duration;
		if (this.domElement.className=="timeControlOld") {	// Support for old style time control
			this.domElement.style.left = percent + '%';
		}
		this.domElement.innerHTML = this.secondsToHours(parseInt(currentTime));
	},
	
	secondsToHours:function(sec_numb) {
		var hours   = Math.floor(sec_numb / 3600);
		var minutes = Math.floor((sec_numb - (hours * 3600)) / 60);
		var seconds = sec_numb - (hours * 3600) - (minutes * 60);
		
		if (minutes < 10) {minutes = "0"+minutes;}
		if (seconds < 10) {seconds = "0"+seconds;}
		return hours + ':' + minutes + ':' + seconds;
	}
});

var PlaybackBar = Class.create(DomNode,{
	playbackFullId:'',
	updatePlayBar:true,
	timeControlId:'',

	initialize:function(id) {
		var style = {};
		this.parent('div',id,style);
		this.domElement.className = "playbackBar";
		this.playbackFullId = id + "_full";
		this.timeControlId = id + "_timeControl";
		var playbackFull = new DomNode('div',this.playbackFullId,{width:'0%'});
		playbackFull.domElement.className = "playbackBarFull";
		this.addNode(playbackFull);
		this.addNode(new TimeControl(this.timeControlId));
		var thisClass = this;
		$(document).bind(paella.events.timeupdate,function(event,params) { thisClass.onTimeUpdate(params); });
		$(this.domElement).bind('mousedown',function(event) { paella.utils.mouseManager.down(thisClass,event); event.stopPropagation(); });
		$(playbackFull.domElement).bind('mousedown',function(event) { paella.utils.mouseManager.down(thisClass,event); event.stopPropagation();  });
		$(this.domElement).bind('mousemove',function(event) { paella.utils.mouseManager.move(event); });
		$(playbackFull.domElement).bind('mousemove',function(event) { paella.utils.mouseManager.move(event); });
		$(this.domElement).bind('mouseup',function(event) { paella.utils.mouseManager.up(event); });
		$(playbackFull.domElement).bind('mouseup',function(event) { paella.utils.mouseManager.up(event); });
	},
	
	playbackFull:function() {
		return this.getNode(this.playbackFullId);
	},

	timeControl:function() {
		return this.getNode(this.timeControlId);
	},
	
	setPlaybackPosition:function(percent) {
		this.playbackFull().domElement.style.width = percent + '%';
	},
	
	isSeeking:function() {
		return !this.updatePlayBar;
	},
	
	onTimeUpdate:function(memo) {
		if (this.updatePlayBar) {
			var videoContainer = memo.videoContainer;
			var real = { start:0, end:videoContainer.duration };
			var trimmed = { start:videoContainer.trimStart(), end:videoContainer.trimEnd() };
			var currentTime = memo.currentTime - trimmed.start;
			var duration = trimmed.end - trimmed.start;
			this.setPlaybackPosition(currentTime * 100 / duration);
		}
	},

	down:function(event,x,y) {
		this.updatePlayBar = false;
		this.move(event,x,y);
	},

	move:function(event,x,y) {		
		var width = $(this.domElement).width();
		var selectedPosition = x - $(this.domElement).offset().left; // pixels
		if (selectedPosition<0) {
			selectedPosition = 0;
		}
		else if (selectedPosition>width) {
			selectedPosition = 100;
		}
		else {
			selectedPosition = selectedPosition * 100 / width; // percent
		}
		this.setPlaybackPosition(selectedPosition);
	},
	
	up:function(event,x,y) {
		var width = $(this.domElement).width();
		var selectedPosition = x - $(this.domElement).offset().left; // pixels
		if (selectedPosition<0) {
			selectedPosition = 0;
		}
		else if (selectedPosition>width) {
			selectedPosition = 100;
		}
		else {
			selectedPosition = selectedPosition * 100 / width; // percent
		}
		$(document).trigger(paella.events.seekTo,{ newPositionPercent:selectedPosition });
		this.updatePlayBar = true;
	}
});

var PlaybackControl = Class.create(DomNode,{
	playbackControlsId:'',
	playbackBarId:'',
	playbackPopUpsId:'',
	
	playbackPluginsWidth:0,
	popupPluginsWidth:0,
	
	minPlaybackBarSize:120,

	playbackBarInstance:null,
	
	playbackControlPlugins:[],
	playbackPopupPlugins:[],

	addPlugin:function(plugin) {
		var thisClass = this;
		plugin.checkEnabled(function(isEnabled) {
			if (isEnabled) {
				if (plugin.type=='playbackControl') {
					thisClass.playbackControlPlugins.push(plugin);
					var pbContols = thisClass.playbackControls();
					var playbackBar = thisClass.playbackBar();
					plugin.rootNodeDomElement = pbContols.addNode(plugin.getRootNode(thisClass.identifier)).domElement;
					var width = plugin.getWidth();
					plugin.setLeftPosition(thisClass.playbackPluginsWidth);
					thisClass.playbackPluginsWidth += width;
					var contolsWidth = $(pbContols.domElement).width();
					width += contolsWidth;
					pbContols.domElement.style.width = width + 'px';
					playbackBar.domElement.style.left = width + 'px';
				}
				if (plugin.type=='playbackPopUp') {
					thisClass.playbackPopupPlugins.push(plugin);
					var pbPopUps = thisClass.playbackPopUps();
					var playbackBar = thisClass.playbackBar();
					plugin.rootNodeDomElement = pbPopUps.addNode(plugin.getRootNode(thisClass.identifier)).domElement;
					var width = plugin.getWidth();
					plugin.setRightPosition(thisClass.popupPluginsWidth);
					thisClass.popupPluginsWidth += width;
					var controlsWidth = $(pbPopUps.domElement).width();
					width += controlsWidth;
					pbPopUps.domElement.style.width = width + 'px';
					playbackBar.domElement.style.right = width + 'px';
					var content = plugin.getPopUpContent(thisClass.identifier);
					if (content!=null) {
						thisClass.addNode(content);
						plugin.pluginContainerDomElement = content.domElement;
					}
				}	
			}
		});
	},

	initialize:function(id) {
		var style = {position:'absolute',bottom:'0px',left:'0px',right:'0px',height:'37px',zIndex:GlobalParams.playbackControls.zIndex};
		this.parent('div',id,style);
		this.domElement.className = 'playbackControls';
		this.playbackBarId = id + '_playbackBar';
		this.showFramesButtonId = id +'_showFramesButton';
		this.playbackControlsId = id + '_framesControl';
		var thisClass = this;
		this.addNode(new DomNode('div',this.playbackControlsId,{position:'absolute',top:'0px',left:'0px',height:'37px'}));
		this.addNode(new DomNode('div',this.playbackPopUpsId,{position:'absolute',top:'0px',right:'0px',height:'37px'}));
		this.addNode(new PlaybackBar(this.playbackBarId));

		paella.pluginManager.setTarget('playbackControl',this);
		paella.pluginManager.setTarget('playbackPopUp',this);
	},

	playbackControls:function() {
		return this.getNode(this.playbackControlsId);
	},
	
	playbackPopUps:function() {
		return this.getNode(this.playbackPopUpsId);
	},

	playbackBar:function() {
		if (this.playbackBarInstance==null) {
			this.playbackBarInstance = this.getNode(this.playbackBarId);
		}
		return this.playbackBarInstance;
	},
	
	onresize:function() {
		paella.debug.log("resize playback bar");
		var windowSize = $(this.domElement).width();
		this.playbackPluginsWidth = 0;
		this.popupPluginsWidth = 0;
		
		for (var i=0;i<this.playbackControlPlugins.length;++i) {
			var plugin = this.playbackControlPlugins[i];
			var minSize = plugin.getMinWindowSize();
			if (minSize>0 && windowSize<minSize) {
				$(plugin.rootNodeDomElement).hide();
			}
			else {
				$(plugin.rootNodeDomElement).show();
				plugin.setLeftPosition(this.playbackPluginsWidth);
				this.playbackPluginsWidth += plugin.getWidth();
			}
		}
		
		for (var i=0;i<this.playbackPopupPlugins.length;++i) {
			var plugin = this.playbackPopupPlugins[i];
			var minSize = plugin.getMinWindowSize();
			if (minSize>0 && windowSize<minSize) {
				$(plugin.rootNodeDomElement).hide();
				if (plugin.pluginContainerDomElement) {
					$(plugin.pluginContainerDomElement).hide();
				}
			}
			else {
				$(plugin.rootNodeDomElement).show();
				plugin.setRightPosition(this.popupPluginsWidth);
				this.popupPluginsWidth += plugin.getWidth();
			}
		}
	
		var playbackBarSize = $(this.domElement).width() - (this.playbackPluginsWidth + this.popupPluginsWidth);
		if (playbackBarSize<this.minPlaybackBarSize) {
			$(this.playbackBar().domElement).hide();
		}
		else {
			this.playbackBar().domElement.style.left = (this.playbackPluginsWidth + 10) + 'px';
			this.playbackBar().domElement.style.right = (this.popupPluginsWidth + 10) + 'px';
			$(this.playbackBar().domElement).show();
		}
	}
});

var ControlsContainer = Class.create(DomNode,{
	playbackControlId:'',
	editControlId:'',
	isEnabled:true,
	
	autohideTimer:null,
	hideControlsTimeMillis:3000,

	playbackControlInstance:null,

	initialize:function(id) {
		this.parent('div',id,{position:'absolute',top:'0px',left:'0px',bottom:'0px',right:'0px',zIndex:GlobalParams.playbackControls.zIndex,overflow:'hidden'});
		this.viewControlId = id + '_view';
		this.playbackControlId = id + '_playback';
		this.editControlId = id + '_editor';
		this.addNode(new PlaybackControl(this.playbackControlId));
		var thisClass = this;
		$(document).bind(paella.events.showEditor,function(event) { thisClass.onShowEditor(); });
		$(document).bind(paella.events.hideEditor,function(event) { thisClass.onHideEditor(); });
		
		$(document).bind(paella.events.play,function(event) { thisClass.onPlayEvent(); });
		$(document).bind(paella.events.pause,function(event) { thisClass.onPauseEvent(); });
		$(document).bind('mousemove',function(event) { thisClass.onMouseMoveEvent(); });
		$(document).bind(paella.events.endVideo,function(event) { thisClass.onEndVideoEvent(); });
	},
	
	onShowEditor:function() {
		var editControl = this.editControl();
		$(editControl.domElement).hide();
	},
	
	onHideEditor:function() {
		var editControl = this.editControl();
		$(editControl.domElement).show();
	},

	showEditorButton:function() {
		this.addNode(new EditControl(this.editControlId));
	},
	
	enterEditMode:function() {
		var playbackControl = this.playbackControl();
		var editControl = this.editControl();
		if (playbackControl && editControl) {
			$(playbackControl.domElement).hide();
		}
	},
	
	exitEditMode:function() {
		var playbackControl = this.playbackControl();
		var editControl = this.editControl();
		if (playbackControl && editControl) {
			$(playbackControl.domElement).show();
		}
	},

	playbackControl:function() {
		if (this.playbackControlInstance==null) {
			this.playbackControlInstance = this.getNode(this.playbackControlId);
		}
		return this.playbackControlInstance;
	},
	
	editControl:function() {
		return this.getNode(this.editControlId);
	},

	disable:function() {
		this.isEnabled = false;
		this.hide();
	},
	
	enable:function() {
		this.isEnabled = true;
		this.show();
	},

	hide:function() {
		var userAgent = new UserAgent();
		if (!userAgent.browser.IsMobileVersion) {
			$(this.domElement).animate({opacity:0.0},300);
			$(document).trigger(paella.events.controlBarWillHide);
		}
		else {
			paella.debug.log("Mobile version: controls will not hide");
		}
	},

	show:function() {
		if (this.isEnabled) {
			if (this.domElement.style.opacity!=1.0) {
				this.domElement.style.opacity = 1.0;
				$(document).trigger(paella.events.controlBarDidShow);
			}	
		}
	},
	
	autohideTimeout:function() {
		var playbackBar = this.playbackControl().playbackBar();
		if (playbackBar.isSeeking()) {
			this.restartAutohideTimer();
		}
		else {
			this.hideControls();			
		}
	},

	hideControls:function() {
		this.hide();
	},

	showControls:function() {
		this.show();
	},

	onPlayEvent:function() {
		this.restartAutohideTimer();
	},

	onPauseEvent:function() {
		this.clearAutohideTimer();
	},
	
	onEndVideoEvent:function() {
		this.show();
		this.clearAutohideTimer();
	},

	onMouseMoveEvent:function() {
		this.showControls();
		if (paella.player.videoContainer.isReady() && !paella.player.videoContainer.paused()) {
			this.restartAutohideTimer();			
		}
	},
	
	clearAutohideTimer:function() {
		if (this.autohideTimer!=null) {
			this.autohideTimer.cancel();
			this.autohideTimer = null;
		}
	},

	restartAutohideTimer:function() {
		this.clearAutohideTimer();
		var thisClass = this;
		this.autohideTimer = new paella.utils.Timer(function(timer) {
			thisClass.autohideTimeout();
		},this.hideControlsTimeMillis);
	},
	
	onresize:function() {
		this.playbackControl().onresize();
	}
});

paella.LoaderContainer = Class.create(DomNode,{
	timer:null,
	loader:null,
	loaderPosition:0,

	initialize:function(id) {
		this.parent('div',id,{position:'fixed',backgroundColor:'white',opacity:'0.7',top:'0px',left:'0px',right:'0px',bottom:'0px',zIndex:10000});
		this.loader = this.addNode(new DomNode('div','',{position:'fixed',width:'128px',height:'128px',top:'50%',left:'50%',marginLeft:'-64px',marginTop:'-64px',backgroundImage:'url(resources/images/loader.png)'}));
		var thisClass = this;
		$(document).bind(paella.events.loadComplete,function(event,params) { thisClass.loadComplete(params); });
		this.timer = new paella.utils.Timer(function(timer) {
			thisClass.loaderPosition -= 128;
			thisClass.loader.domElement.style.backgroundPosition = thisClass.loaderPosition + 'px';
			timer.timeout = timer.timeout * 2;
		},1000);
		this.timer.repeat = true;
	},
	
	loadComplete:function(params) {
		$(this.domElement).hide();
		this.timer.repeat = false;
	}
});

var KeyManager = Class.create({
	isPlaying:false,
	Keys:{Space:32,Left:37,Up:38,Right:39,Down:40,A:65,B:66,C:67,D:68,E:69,F:70,G:71,H:72,I:73,J:74,K:75,L:76,M:77,N:78,O:79,P:80,Q:81,R:82,S:83,T:84,U:85,V:86,W:87,X:88,Y:89,Z:90},
	
	enabled:true,

	initialize:function() {
		var thisClass = this;
		$(document).bind(paella.events.loadComplete,function(event,params) { thisClass.loadComplete(event,params); });
		$(document).bind(paella.events.play,function(event) { thisClass.onPlay(); });
		$(document).bind(paella.events.pause,function(event) { thisClass.onPause(); });
	},
	
	loadComplete:function(event,params) {
		var thisClass = this;
		$(document).bind("keyup",function(event) { thisClass.keyUp(event); });
	},

	onPlay:function() {
		this.isPlaying = true;
	},

	onPause:function() {
		this.isPlaying = false;
	},

	keyUp:function(event) {
		if (!this.enabled) return;
		
		// Matterhorn standard keys
		if (event.altKey && event.ctrlKey) {
			if (event.which==this.Keys.P) {
				this.togglePlayPause();
			}
			else if (event.which==this.Keys.S) {
				this.pause();
			}
			else if (event.which==this.Keys.M) {
				this.mute();
			}
			else if (event.which==this.Keys.U) {
				this.volumeUp();
			}
			else if (event.which==this.Keys.D) {
				this.volumeDown();
			}
		}
		else { // Paella player keys
			if (event.which==this.Keys.Space) {
				this.togglePlayPause();
			}
			else if (event.which==this.Keys.Up) {
				this.volumeUp();
			}
			else if (event.which==this.Keys.Down) {
				this.volumeDown();
			}
			else if (event.which==this.Keys.M) {
				this.mute();
			}
		}
	},
	
	togglePlayPause:function() {
		if (this.isPlaying) {
			$(document).trigger(paella.events.pause);
		}
		else {
			$(document).trigger(paella.events.play);
		}
	},
	
	pause:function() {
		$(document).trigger(paella.events.pause);
	},
	
	mute:function() {
		var videoContainer = paella.player.videoContainer;
		var newVolume = 0;
		if (videoContainer.volume()==0) newVolume = 1.0;
		$(document).trigger(paella.events.setVolume,{master:newVolume,slave:0});
	},
	
	volumeUp:function() {
		var videoContainer = paella.player.videoContainer;
		var volume = videoContainer.volume();
		volume += 0.1;
		volume = (volume>1) ? 1.0:volume;
		$(document).trigger(paella.events.setVolume,{master:volume,slave:0});
	},
	
	volumeDown:function() {
		var videoContainer = paella.player.videoContainer;
		var volume = videoContainer.volume();
		volume -= 0.1;
		volume = (volume<0) ? 0.0:volume;
		$(document).trigger(paella.events.setVolume,{master:volume,slave:0});
	}
});

var keyManager = new KeyManager();
paella.keyManager = keyManager;

paella.MessageBox = Class.create({
	modalContainerClassName:'modalMessageContainer',
	frameClassName:'frameContainer',
	messageClassName:'messageContainer',
	errorClassName:'errorContainer',
	currentMessageBox:null,
	messageContainer:null,
	onClose:null,
	
	initialize:function() {
		var thisClass = this;
		$(window).resize(function(event) { thisClass.adjustTop(); });
	},

	showFrame:function(src,params) {
		var closeButton = true;
		var width = "80%";
		var height = "80%";
		var onClose = null;
		if (params) {
			closeButton = params.closeButton;
			width = params.width;
			height = params.height;
			onClose = params.onClose;	
		}

		this.doShowFrame(src,closeButton,width,height,onClose);
	},

	doShowFrame:function(src,closeButton,width,height,onClose) {
		this.onClose = onClose;

		if (this.currentMessageBox) {
			this.close();
		}

		if (!width) { width = '80%'; }
		
		if (!height) { height = '80%'; }
		
		var modalContainer = document.createElement('div');
		modalContainer.className = this.modalContainerClassName;
		modalContainer.style.position = 'fixed';
		modalContainer.style.top = '0px';
		modalContainer.style.left = '0px';
		modalContainer.style.right = '0px';
		modalContainer.style.bottom = '0px';
		modalContainer.style.zIndex = 999999;
		
		var messageContainer = document.createElement('div');
		messageContainer.className = this.frameClassName;
		messageContainer.style.width = width;
		messageContainer.style.height = height;
		messageContainer.style.position = 'relative';
		modalContainer.appendChild(messageContainer);
		
		var iframeContainer = document.createElement('iframe');
		iframeContainer.src = src;
		iframeContainer.setAttribute("frameborder", "0");
		iframeContainer.style.width = "100%";
		iframeContainer.style.height = "100%";
		messageContainer.appendChild(iframeContainer);
		
		$('body')[0].appendChild(modalContainer);
		
		this.currentMessageBox = modalContainer;
		this.messageContainer = messageContainer;
		var thisClass = this;
		this.adjustTop();
		
		if (closeButton) {
			this.createCloseButton();
		}

	},

	showMessage:function(message,params) {
		var closeButton = true;
		var width = "60%";
		var height = "40%";
		var onClose = null;
		var className = this.messageClassName;
		if (params) {
			className = params.className;
			closeButton = params.closeButton;
			width = params.width;
			height = params.height;
			onClose = params.onClose;	
		}
		
		this.doShowMessage(message,closeButton,width,height,className,onClose);
	},

	doShowMessage:function(message,closeButton,width,height,className,onClose) {
		this.onClose = onClose;

		if (this.currentMessageBox) {
			this.close();
		}
		if (!className) className = this.messageClassName;
		
		if (!width) { width = '80%'; }
		
		if (!height) { height = '30%'; }
		
		var modalContainer = document.createElement('div');
		modalContainer.className = this.modalContainerClassName;
		modalContainer.style.position = 'fixed';
		modalContainer.style.top = '0px';
		modalContainer.style.left = '0px';
		modalContainer.style.right = '0px';
		modalContainer.style.bottom = '0px';
		modalContainer.style.zIndex = 999999;
		
		var messageContainer = document.createElement('div');
		messageContainer.className = className;
		messageContainer.style.width = width;
		messageContainer.style.height = height;
		messageContainer.style.position = 'relative';
		messageContainer.innerHTML = message;
		modalContainer.appendChild(messageContainer);
		
		$('body')[0].appendChild(modalContainer);
		
		this.currentMessageBox = modalContainer;
		this.messageContainer = messageContainer;
		var thisClass = this;
		this.adjustTop();
		
		if (closeButton) {
			this.createCloseButton();
		}
	},
	
	showError:function(message,params) {
		var closeButton = false;
		var width = "60%";
		var height = "20%";
		var onClose = null;
		if (params) {
			closeButton = params.closeButton;
			width = params.width;
			height = params.height;
			onClose = params.onClose;	
		}
		
		this.doShowError(message,closeButton,width,height,onClose);
	},

	doShowError:function(message,closeButton,width,height,onClose) {
		this.doShowMessage(message,closeButton,width,height,this.errorClassName,onClose);
	},
	
	createCloseButton:function() {
		if (this.messageContainer) {
			var thisClass = this;
			var closeButton = document.createElement('div');
			this.messageContainer.appendChild(closeButton);
			closeButton.className = 'paella_messageContainer_closeButton';
			$(closeButton).click(function(event) { thisClass.onCloseButtonClick(); });
		}
	},
	
	adjustTop:function() {
		if (this.currentMessageBox) {
		
			var msgHeight = $(this.messageContainer).outerHeight();
			var containerHeight = $(this.currentMessageBox).height();

			var top = containerHeight/2 - msgHeight/2;
			this.messageContainer.style.marginTop = top + 'px';
		}
	},
	
	close:function() {
		if (this.currentMessageBox && this.currentMessageBox.parentNode) {
			var msgBox = this.currentMessageBox;
			var parent = msgBox.parentNode;
			$(msgBox).animate({opacity:0.0},300,function() {
				parent.removeChild(msgBox);
			});
			if (this.onClose) {
				this.onClose();
			}
		}
	},
	
	onCloseButtonClick:function() {
		this.close();
	}
});

paella.messageBox = new paella.MessageBox();

paella.AccessControl = Class.create({
	permissions:{
		canRead:false,
		canContribute:false,
		canWrite:false,
		loadError:true,
		isAnonymous:false
	},

	checkAccess:function(onSuccess) {
		onSuccess(this.permissions);
	}
});

paella.DefaultAccessControl = Class.create(paella.AccessControl,{
	checkAccess:function(onSuccess) {
		this.permissions.canRead = false;
		this.permissions.canContribute = false;
		this.permissions.canWrite = false;
		this.permissions.loadError = false;
		this.permissions.isAnonymous = true;
		onSuccess(this.permissions);
	}
});

paella.VideoLoader = Class.create({
	streams:[],		// {sources:{mp4:{src:"videourl.mp4",type:"video/mp4"},ogg:{src:"videourl.ogv",type:"video/ogg"},webm:{src:"videourl.webm",type:"video/webm"}},preview:'video_preview.jpg'}
	frameList:[],	// frameList[timeInstant] = { id:"frame_id", mimetype:"image/jpg", time:timeInstant, url:"image_url"}

	loadStatus:false,
	codecStatus:false,

	isH264Capable:function() {
		var videoElement = document.createElement('video');
		var h264 = videoElement.canPlayType('video/mp4; codecs="avc1.42E01E"');
		if (h264=="") h264 = videoElement.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
		h264 = (h264=='probably') || (h264=='maybe');
		return h264;
	},

	isOggCapable:function() {
		var videoElement = document.createElement('video');
		var ogg = videoElement.canPlayType('video/ogg; codecs="theora"');
		ogg = (ogg=='probably') || (ogg=='maybe');
		return ogg;
	},

	isWebmCapable:function() {
		var videoElement = document.createElement('video');
		var webm = videoElement.canPlayType('video/webm; codecs="vp8, vorbis"');
		webm = (webm=='probably') || (webm=='maybe');
		return webm;
	},
	
	isHtmlVideoCompatible:function(streamIndex) {
		var status = false;
		if (this.streams.length>streamIndex) {
			var stream = this.streams[streamIndex];
			var h264 = this.isH264Capable();
			var ogg = this.isOggCapable();
			var webm = this.isWebmCapable();
			
			paella.debug.log("Browser video capabilities: mp4=" + ((h264) ? 'yes':'no') + ', ogg=' + ((ogg) ? 'yes':'no') + ', webm=' + ((webm) ? 'yes':'no'));
			
			if (stream.sources.mp4 && h264 && !/rtmp:\/\//.test(stream.sources.mp4.src)) {
				status = true;
			}
			else if (stream.sources.ogg && ogg) {
				status = true;
			}
			else if (stream.sources.webm && webm) {
				status = true;
			}
		}
		return status;
	},
	
	isFlashCompatible:function(streamIndex) {
		var ua = new UserAgent();
		var status = false;
		
		if (this.streams.length>streamIndex) {
			var stream = this.streams[streamIndex];
				
			if (stream.sources.mp4) status = true;
			else if (stream.sources.flv) status = true;
		}

		return status && !ua.browser.IsMobileVersion;
	},

	isStreamingCompatible:function(streamIndex) {
		var ua = new UserAgent();
		var status = false;

		if (this.streams.length>streamIndex) {
			var stream = this.streams[streamIndex];
				
			if (stream.sources.rtmp) status = true;
			else status = false;
		}

		return status && !ua.browser.IsMobileVersion;
	},
	
	isStreamCompatible:function(streamIndex,method) {
		var status = false;
		if (method.name=='html' && this.isHtmlVideoCompatible(streamIndex)) {
			status = true;
		}
		else if (method.name=='flash' && this.isFlashCompatible(streamIndex)) {
			status = true;
		}
		else if (method.name=='streaming' && this.isStreamingCompatible(streamIndex)) {
			status = true;
		}
		return status;
	},

	getPreferredMethod:function(streamIndex) {
		var preferredMethod = null;
		var methods = paella.player.config.player.methods;
		for (var i=0;i<methods.length;++i) {
			if (this.isStreamCompatible(streamIndex,methods[i])) {
				preferredMethod = methods[i];
				break;
			}
		}
		return preferredMethod;
	},

	loadVideo:function(videoId,onSuccess) {
		// This function must to:
		//	- load this.streams and this.frameList
		// 	- Check streams compatibility using this.isStreamCompatible(streamIndex)
		//	- Set this.loadStatus = true if load is Ok, or false if something gone wrong
		//	- Set this.codecStatus = true if the browser can reproduce all streams
		//	- Call onSuccess()
		onSuccess();
	}
});

paella.PlayerBase = Class.create({
	config:null,
	playerId:'',
	mainContainer:null,
	videoContainer:null,
	controls:null,
	accessControl:null,
	
	checkCompatibility:function() {
		if (paella.utils.parameters.get('ignoreBrowserCheck')) {
			return true;
		}
		var userAgent = new UserAgent();
		if (userAgent.browser.IsMobileVersion) return true;
		if (userAgent.browser.Chrome || userAgent.browser.Safari || userAgent.browser.Firefox || userAgent.browser.Opera ||
				(userAgent.browser.Explorer && userAgent.browser.Version.major>=9)) {
			return true;
		}
		else {
			var errorMessage = paella.dictionary.translate("It seems that your browser is not HTML 5 compatible");
			$(document).trigger(paella.events.error,{error:errorMessage});
			var message = errorMessage + '<div style="display:block;width:470px;height:140px;margin-left:auto;margin-right:auto;font-family:Verdana,sans-sherif;font-size:12px;"><a href="http://www.google.es/chrome" style="color:#004488;float:left;margin-right:20px;"><img src="resources/images/chrome.png" style="width:80px;height:80px" alt="Google Chrome"></img><p>Google Chrome</p></a><a href="http://windows.microsoft.com/en-US/internet-explorer/products/ie/home" style="color:#004488;float:left;margin-right:20px;"><img src="resources/images/explorer.png" style="width:80px;height:80px" alt="Internet Explorer 9"></img><p>Internet Explorer 9</p></a><a href="http://www.apple.com/safari/" style="float:left;margin-right:20px;color:#004488"><img src="resources/images/safari.png" style="width:80px;height:80px" alt="Safari"></img><p>Safari 5</p></a><a href="http://www.mozilla.org/firefox/" style="float:left;color:#004488"><img src="resources/images/firefox.png" style="width:80px;height:80px" alt="Firefox"></img><p>Firefox 12</p></a></div>';
			message += '<div style="margin-top:30px;"><a id="ignoreBrowserCheckLink" href="#" onclick="window.location = window.location + \'&ignoreBrowserCheck=true\'">' + paella.dictionary.translate("Continue anyway") + '</a></div>';
			paella.messageBox.showError(message,{height:'40%'});
		}
		return false;
	},

	initialize:function(playerId) {
		if (!this.checkCompatibility()) {
			paella.debug.log('It seems that your browser is not HTML 5 compatible');
		}
		else {
			paella.player = this;
			this.playerId = playerId;
			this.mainContainer = $('#' + this.playerId)[0];
			this.accessControl = paella.initDelegate.initParams.accessControl;
			var thisClass = this;
			$(document).bind(paella.events.loadComplete,function(event,params) { thisClass.loadComplete(event,params); });
		}
	},
	
	includePlugins:function(productionPluginFile,devPluginsDir,devPluginsArray,productionPluginCss) {
		if (!productionPluginCss) productionPluginCss = 'plugins/plugins.css';

		if (paella.utils.parameters.get('debug')!="") {
			for (var i=0; i<devPluginsArray.length; i++) {
				var jsFile = devPluginsArray[i];
				var cssFile = jsFile.substr(0, jsFile.lastIndexOf(".")) + ".css";
				paella.debug.log(devPluginsDir + jsFile + ", " + devPluginsDir + cssFile);
				paella.utils.require(devPluginsDir + jsFile);
				paella.utils.importStylesheet(devPluginsDir + cssFile);
			}
		}
		else {
			paella.utils.require(productionPluginFile);
			paella.utils.importStylesheet(productionPluginCss);
		}
	},

	loadComplete:function(event,params) {
		
	}
});

var PaellaPlayer = Class.create(paella.PlayerBase,{
	player:null,
	
	selectedProfile:'',
	videoIdentifier:'',
	editor:null,
	loader:null,

	// Video data:
	videoData:null,

	setProfile:function(profileName) {
		var thisClass = this;
		this.videoContainer.setProfile(profileName,function(newProfileName) {
			thisClass.selectedProfile = newProfileName;
		});
	},

	initialize:function(playerId) {
		this.parent(playerId);
		
		// if initialization ok
		if (this.playerId==playerId) {
			this.loadPaellaPlayer();
			this.includePlugins('javascript/paella_plugins.js','plugins/',paella.pluginList);

			var thisClass = this; 
			$(document).bind(paella.events.setProfile,function(event,params) {
				thisClass.setProfile(params.profileName);
			});	
		}
	},

	loadPaellaPlayer:function() {
		var thisClass = this;
		this.loader = new paella.LoaderContainer('paellaPlayer_loader');
		$('body')[0].appendChild(this.loader.domElement);
		$(document).trigger(paella.events.loadStarted);

		paella.initDelegate.loadDictionary(function() {
			paella.initDelegate.loadConfig(function(config) {
				thisClass.onLoadConfig(config);
			});
		});		
	},

	onLoadConfig:function(configData) {
		this.config = configData;
		this.videoIdentifier = paella.initDelegate.getId();

		if (this.videoIdentifier) {
			if (this.mainContainer) {
				this.videoContainer = new VideoContainer(this.playerId + "_videoContainer");
				this.controls = new ControlsContainer(this.playerId + '_controls');
				this.mainContainer.appendChild(this.videoContainer.domElement);
				this.mainContainer.appendChild(this.controls.domElement);
			}
			$(window).resize(function(event) { paella.player.onresize(); });
			this.onload();	
		}
	},
	
	onload:function() {
		var thisClass = this;
		this.accessControl.checkAccess(function(permissions) {
			if (!permissions.loadError) {
				paella.debug.log("read:" + permissions.canRead + ", contribute:" + permissions.canContribute + ", write:" + permissions.canWrite);
				if (permissions.canWrite) {
					thisClass.setupEditor();
					$(document).bind(paella.events.showEditor,function(event) { thisClass.showEditor(); });
					$(document).bind(paella.events.hideEditor,function(event) { thisClass.hideEditor(); });
				}
				if (permissions.canRead) {
					thisClass.loadVideo();
					thisClass.videoContainer.publishVideo();
				}
				else {
					thisClass.unloadAll(paella.dictionary.translate("You are not authorized to view this resource"));
				}	
			}
			else if (permissions.isAnonimous) {
				var errorMessage = paella.dictionary.translate("You are not logged in");
				thisClass.unloadAll(errorMessage);
				$(document).trigger(paella.events.error,{error:errorMessage});
			}
			else {
				var errorMessage = paella.dictionary.translate("You are not authorized to view this resource");
				thisClass.unloadAll(errorMessage);
				$(document).trigger(paella.events.error,{error:errorMessage});
			}
		});
	},

	onresize:function() {
		this.videoContainer.onresize();
		this.controls.onresize();
		if (this.editor) {
			this.editor.resize();
		}
	},

	unloadAll:function(message) {
		$('#playerContainer')[0].innerHTML = "";
		var loaderContainer = $('#paellaPlayer_loader')[0];
		paella.messageBox.showError(message);
	},

	setupEditor:function() {
		//if (paella.extended) return;
		if (paella.editor && paella.player.config.editor && paella.player.config.editor.enabled) {
			this.controls.showEditorButton();
		}
		else {
			setTimeout('paella.player.setupEditor()',500);
		}
	},
	
	showEditor:function() {
		new paella.editor.Editor();
	},

	hideEditor:function() {
	},

	loadVideo:function() {
		if (this.videoIdentifier) {
			var thisClass = this;
			var loader = paella.initDelegate.initParams.videoLoader;
			loader.loadVideo(this.videoIdentifier,function() {
				var master = loader.streams[0];
				var slave = loader.streams[1];
				var frames = loader.frameList;
			
				if (loader.loadStatus) {
					var preferredMethodMaster = loader.getPreferredMethod(0);
					var preferredMethodSlave  = loader.getPreferredMethod(1);
					var status = true;
					
					if (preferredMethodMaster) {
						status = paella.player.videoContainer.setMasterSource(master,preferredMethodMaster.name);
					}
					
					if (preferredMethodSlave) {
						status = paella.player.videoContainer.setSlaveSource(slave,preferredMethodSlave.name);
					}
					else {
						paella.player.videoContainer.setMonoStreamMode();
					}

					
					if (status) {
						$(document).trigger(paella.events.loadPlugins,{pluginManager:paella.pluginManager});
					
						// The loadComplete event depends on the readyState of presenter and slide video
						new paella.utils.Timer(function(timer) {
							if (thisClass.videoContainer.isReady()) {
								$(document).trigger(paella.events.loadComplete,{masterVideo:master,slaveVideo:slave,frames:frames});
								thisClass.onresize();
								timer.repeat = false;
							}
							else {
								timer.repeat = true;
							}
						},500);
					}
					else {
						var errorMessage = paella.dictionary.translate("Your browser is not compatible with the required video codec");
						paella.messageBox.showError(errorMessage);
						$(document).trigger(paella.events.error,{error:errorMessage});
					}
				}
				else {
					var errorMessage = paella.dictionary.translate("Error loading video data");
					paella.messageBox.showError(errorMessage);
					$(document).trigger(paella.events.error,{error:errorMessage});
				}
			});
		}
	},
	
	loadPreviews:function() {
		var streams = paella.initDelegate.initParams.videoLoader.streams;
		var slavePreviewImg = null;
		
		var masterPreviewImg = streams[0].preview;
		if (streams.length >=2) {
			slavePreviewImg = streams[1].preview;
		}
		if (masterPreviewImg) {
			var masterRect = paella.player.videoContainer.overlayContainer.getMasterRect();
			this.masterPreviewElem = document.createElement('img');
			this.masterPreviewElem.src = masterPreviewImg;
			paella.player.videoContainer.overlayContainer.addElement(this.masterPreviewElem,masterRect);
		}
		if (slavePreviewImg) {
			var slaveRect = paella.player.videoContainer.overlayContainer.getSlaveRect();
			this.slavePreviewElem = document.createElement('img');
			this.slavePreviewElem.src = slavePreviewImg;
			paella.player.videoContainer.overlayContainer.addElement(this.slavePreviewElem,slaveRect);
		}
		$(document).bind(paella.events.play,function(event) {
			paella.player.unloadPreviews();
		});
	},
	
	unloadPreviews:function() {
		if (this.masterPreviewElem) {
			paella.player.videoContainer.overlayContainer.removeElement(this.masterPreviewElem);
			this.masterPreviewElem = null;
		}
		if (this.slavePreviewElem) {
			paella.player.videoContainer.overlayContainer.removeElement(this.slavePreviewElem);
			this.slavePreviewElem = null;
		}
	},
	
	loadComplete:function(event,params) {
		var thisClass = this;
		var time = paella.utils.parameters.get('t');
		var master = params.masterVideo;
		var getProfile = paella.utils.parameters.get('profile');
		var cookieProfile = paella.utils.cookies.get('lastProfile');
		if (getProfile) {
			this.setProfile(getProfile);
		}
		else if (cookieProfile) {
			this.setProfile(cookieProfile);
		}
		else {
			this.setProfile(this.config.defaultProfile);
		}

		// TODO: No sé muy bien por qué pero si no se reproduce el vídeo al menos un segundo no funciona el setSeek
		$(document).trigger(paella.events.play);
		new paella.utils.Timer(function(timer) {
			var autoplay = paella.utils.parameters.get('autoplay');
			autoplay = autoplay.toLowerCase();
			if (autoplay!='true' && autoplay!='yes') $(document).trigger(paella.events.pause);
			if (time) {
				var duration = master.duration();
				var trimStart = thisClass.videoContainer.trimStart();
				var trimEnd = thisClass.videoContainer.trimEnd();
				if (thisClass.videoContainer.trimEnabled()) {
					duration = trimEnd - trimStart;
				}
				var hour = 0;
				var minute = 0;
				var second = 0;
				if (/([0-9]+)h/.test(time)) {
					hour = Number(RegExp.$1);
				}
				if (/([0-9]+)m/.test(time)) {
					minute = Number(RegExp.$1);
				}
				if (/([0-9]+)s/.test(time)) {
					second = Number(RegExp.$1);
				}
				var currentTime = hour * 60 * 60 + minute * 60 + second;
				var currentPercent = currentTime * 100 / duration;
				$(document).trigger(paella.events.seekTo,{newPositionPercent:currentPercent});
				
				
			}
			thisClass.loadPreviews();
			if (paella.player.config.editor &&
				paella.player.config.editor.enabled &&
				paella.player.config.editor.loadOnStartup) {
				$(document).trigger(paella.events.showEditor);
			}
		},1000);
	}
});

var paellaPlayer = null;

paella.plugins = {};

paella.plugins.events = {};

paella.InitDelegate = Class.create({
	initParams:{
		configUrl:'config/config.json',
		dictionaryUrl:'config/dictionary',
		editorDictionaryUrl:'config/editor_dictionary',
		accessControl:new paella.DefaultAccessControl(),
		videoLoader:new paella.VideoLoader()
	},

	initialize:function(params) {
		if (params) {
			for (var key in params) {
				this.initParams[key] = params[key];
			}
		}
	},

	getId:function() {
		return paella.utils.parameters.get('id');
	},
	
	loadDictionary:function(onSuccess) {
		var asyncLoader = new paella.AsyncLoader();
		asyncLoader.addCallback(new paella.DictionaryLoader(this.initParams.dictionaryUrl));
		asyncLoader.addCallback(new paella.DictionaryLoader(this.initParams.editorDictionaryUrl));
		asyncLoader.load(function() {
				onSuccess();
			},
			function() {
				onSuccess();
			}
		);
	},

	loadConfig:function(onSuccess) {
		var configUrl = this.initParams.configUrl;
		var params = {};
		new paella.Ajax(configUrl,params,function(data) {
			if (typeof(data)=="string") {
				data = JSON.parse(data);
			}
			onSuccess(data);
		});
	},

	loadEditorConfig:function(onSuccess) {
		var data = {
			cssPath:'resources/ui/jquery-ui.css'
		};
		onSuccess(data);
	}
});

paella.initDelegate = null;

/* Initializer function */
function initPaellaEngage(playerId,initDelegate) {
	if (!initDelegate) {
		initDelegate = new paella.InitDelegate();
	}
	paella.initDelegate = initDelegate;
	var lang = navigator.language || window.navigator.userLanguage;
	paellaPlayer = new PaellaPlayer(playerId,paella.initDelegate);
}
