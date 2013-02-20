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
	'check_publish.js',
	'description.js',
	'serie_episodes.js',
	'extended_profiles.js',
	'search.js',
	'usertracking.js'
];

paella.errors = {
	videoCodecError:'Your browser is not compatible with the required video codec',
	browserCompatibilityError:'Your browser is not HTML 5 compatible',
	noSuchIdentifier:"The specified video identifier does not exist",
	videoNotPublished:"This video is not published",
	authorizationFailed:"You are not authorized to view this resource",
	loadError:"You are not authorized to view this resource",
	anonimousUserError:"You are not logged in"
};

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
            jQuery.ajax({url:url,type:method,dataType:'jsonp', jsonp:'jsonp', jsonpCallback:'callback', data:params}).always(function(data) {
				paella.debug.log('using jsonp');
				thisClass.callCallback(data);
			});
		}
		else if (proxyUrl && proxyUrl!="") {
			params.url = url;
			jQuery.ajax({url:proxyUrl,type:method,data:params}).always(function(data) {
				paella.debug.log('using AJAX');
				thisClass.callCallback(data);
			});
		}
		else {
			jQuery.ajax({url:url,type:method,data:params}).always(function(data) {
				paella.debug.log('using AJAX whithout proxy');
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
	})
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

paella.matterhorn = {
	series:{
		serie:null,
		acl:null
	},
	episode:null,
	me:null,
	access:{write:false,read:false,contribute:false,isAnonymous:false}
};

paella.utils.UserRoleManager = Class.create({
	serverUrl:"",
	proxyUrl:false,
	useJsonp:false,

	initialize:function(config) {
		this.serverUrl = config.restServer.url;
		if (config.proxyLoader && config.proxyLoader.enabled) {
			this.proxyUrl = config.proxyLoader.url;
		}
		this.useJsonp = config.proxyLoader.usejsonp;
	},
	
	checkAccess:function(onSuccess) {
		//onSuccess(true,true);
		var thisClass = this;
		var id = paella.utils.parameters.get('id');
		
		thisClass.loadUserRoles(function(roleInfo) {
			var userRoles = new Array();
			var adminRole = roleInfo.org.adminRole;
			var anonymousRole = roleInfo.org.anonymousRole;
			var isAnonymous = true;
			if (roleInfo.roles) {
				for(var i = 0; i<roleInfo.roles.length; ++i) {
					var roleName = roleInfo.roles[i];
					userRoles.push(roleName);
					if (roleName!=anonymousRole) {
						isAnonymous = false;
					}
				}
			}
	
			thisClass.getPermissions(id,function(data) {
				var canRead = false;
				var canContribute = false;
				var canWrite = false;
				var loadError = false;
				if (data && data.acl) {
					paella.matterhorn.series.acl = data.acl;
					if (data.acl.ace.length == undefined){
						data.acl.ace = [data.acl.ace];
					}
					for(var i=0;i<data.acl.ace.length;++i) {
						var currentAcl = data.acl.ace[i];
						for (var j=0;j<userRoles.length;++j) {
							var currentRole = userRoles[j];
							if (currentRole==adminRole) {
								canRead = true;
								canWrite = true;
								canContribute = true;
								break;
							}
							else if (currentAcl.role==currentRole) {
								if (currentAcl.action=="read" && currentAcl.allow) {
									canRead = true;
								}
								else if (currentAcl.action=="write" && currentAcl.allow) {
									canWrite = true;
								}
								else if (currentAcl.action=="contribute" && currentAcl.allow) {
									canContribute = true;
								}
							}
						}
					}
				}
				else if (data) {
					canRead = true;
					
					// Enable write if admin
					for (var i=0;i<userRoles.length;++i) {
						var currentRole = userRoles[i];
						if (currentRole==adminRole) {
							canWrite = true;
							canContribute = true;
							break;
						}
					}
				}
				else {
					loadError = true;
				}
				
				paella.matterhorn.access.read = canRead;
				paella.matterhorn.access.write = canWrite;
				paella.matterhorn.access.contribute = canContribute;
				paella.matterhorn.access.isAnonymous = isAnonymous;
				onSuccess(canRead,canContribute,canWrite,loadError,isAnonymous);
			});
		});
	},
	
	loadUserRoles:function(onSuccess) {
		var params = {};
		var url = this.serverUrl + "info/me.json";
		new paella.Ajax(url,params,function(data) {
			if (typeof(data)=="string") {
				data = JSON.parse(data);
			}
			paella.matterhorn.me = data;
			onSuccess(data);
		},this.proxyUrl,this.useJsonp)
	},
	
	getPermissions:function(id,onSuccess) {
		var thisClass = this;
		var params = {}
		var url = this.serverUrl + "search/series.json?id=" + id;
		new paella.Ajax(url,params,function(data) {
			if (typeof(data)=='string') {
				data = JSON.parse(data);
			}
			var seriesId = data.dcIsPartOf;
			if (data["search-results"] && data["search-results"].total && parseInt(data["search-results"].total)>0) {
				paella.matterhorn.series.serie = data["search-results"].result;
				var seriesId = data["search-results"].result.dcIsPartOf;
				if (seriesId) {
					var aclParams = {};
					url = thisClass.serverUrl + "series/" + seriesId + "/acl.json";
					new paella.Ajax(url,aclParams,function(result) {
						if (typeof(result)=='string') {
							result = JSON.parse(result);
						}
						onSuccess(result);
					},thisClass.proxyUrl,thisClass.useJsonp);
				}
				else {
					var result = {acl:null}
					onSuccess(result);
				}
			}
			else {
				onSuccess(null);
			}
		},this.proxyUrl,this.useJsonp);
	}
});

paella.utils.MatterhornData = Class.create({
	restServer:'',
	series:'',
	episodes:'',
	proxyUrl:false,
	useJsonp:false,

	initialize:function(config) {
		this.restServer = config.restServer.url;
		this.series = config.restServer.seriesJson;
		this.episodes = config.restServer.episodeJson;
		if (config.proxyLoader && config.proxyLoader.enabled) {
			this.proxyUrl = config.proxyLoader.url;
		}
		this.useJsonp = config.proxyLoader.usejsonp;
	},
	
	loadVideoData:function(id,onSuccess) {
		var parameters = {id:id};
		var episodesUrl = this.restServer + this.episodes;

		new paella.Ajax(episodesUrl,{id:id},function(data) {
			var jsonData = data;
			if (typeof(jsonData)=="string") jsonData = JSON.parse(jsonData);
			
			var result = jsonData['search-results'].result;
			if (result) {
				paella.matterhorn.episode = result;
				var tracks = result.mediapackage.media.track;
				var masterData = {sources:{}};
				var slaveData = {sources:{}};
				for (var i=0;i<tracks.length;++i) {
					var track = tracks[i];
					var sourceInfo = {}
					sourceInfo.src = track.url;
					sourceInfo.type = track.mimetype;
					var destinationData;
					
					if ((track.type=='presenter/delivery') || (track.type=='presentation/delivery')){
						if  ((track.url!="") && (!(/^rtmp:\/\//i.test(track.url)))) {
						    if (track.type=='presenter/delivery') {
								destinationData = masterData; 
						    }
						    else if (track.type=='presentation/delivery') {
								destinationData = slaveData;
						    }

						    if (track.mimetype=='video/mp4') {
								destinationData.sources.mp4 = sourceInfo;
						    }
						    else if (track.mimetype=='video/ogg') {
								destinationData.sources.ogg = sourceInfo;
						    }
						    else if (track.mimetype=='video/webm') {
								destinationData.sources.webm = sourceInfo;
						    }
						}
					}
				}
				
				var videoData = {};
				videoData.master = masterData;
				videoData.slave = slaveData;
				
				videoData.frames = {};
				var unorderedFrames = {}
				var attachments = result.mediapackage.attachments.attachment;
				var lastFrameTime = 0;
				for (var attachment in attachments) {
					attachment = attachments[attachment];
					if (attachment.type=="presentation/segment+preview") {
						var url = attachment.url;
						var time = 0;
						if (/time=T(\d+):(\d+):(\d+)/.test(attachment.ref)) {
							time = parseInt(RegExp.$1)*60*60 + parseInt(RegExp.$2)*60 + parseInt(RegExp.$3);
						}
						unorderedFrames[time] = {time:time,url:url,mimetype:attachment.mimetype,id:attachment.id};
						if (time>lastFrameTime) lastFrameTime = time;
					}
				}
	
				for (var i=0;i<lastFrameTime;++i) {
					if (unorderedFrames[i]) {
						videoData.frames[i] = unorderedFrames[i];
					}
				}
	
				onSuccess(videoData);
			}
			else {
				paella.messageBox.showError(paella.errors.noSuchIdentifier);
				$(document).trigger(paella.events.error,{error:paella.errors.noSuchIdentifier});
			}
		},this.proxyUrl,this.useJsonp);
	}
});

paella.utils.TrimData = Class.create({
	serverUrl:'',
	enabled:false,
	proxyUrl:'',
	useJsonp:false,

	initialize:function(config) {
		this.serverUrl = config.restServer.url;
		this.enabled = config.trimming.enabled;
		if (config.proxyLoader && config.proxyLoader.enabled) {
			this.proxyUrl = config.proxyLoader.url;
		}
		this.useJsonp = config.proxyLoader.usejsonp;
	},
	
	load:function(id,onSuccess) {
		var parameters = {episode:id,type:'trim'};
		var trimServerUrl = this.serverUrl + "annotation/annotations.json";
		new paella.Ajax(trimServerUrl,parameters,function(mhdata) {
			if (typeof(mhdata)=="string") {
				mhdata = JSON.parse(mhdata);
			}
			var data = {published:"true",trimStart:0,trimEnd:0}
			if (mhdata.annotations && mhdata.annotations.total>0) {
				data.published = mhdata.annotations.annotation.value;
				data.trimStart = mhdata.annotations.annotation.inpoint / 1000;
				data.trimEnd = mhdata.annotations.annotation.outpoint / 1000;
			}
			onSuccess(data);
		},this.proxyUrl,this.useJsonp);
	},
	
	save:function(id,trimStart,trimEnd,published,onSuccess) {
		trimStart = Math.round(trimStart * 1000);
		trimEnd = Math.round(trimEnd * 1000);
		var thisClass = this;
		var parameters = {episode:id,type:'trim'};
		var trimServerUrl = this.serverUrl;
		var videoDuration = paella.player.videoContainer.duration();
		paella.debug.log("Requesting annotation id");
		new paella.Ajax(trimServerUrl + "annotation/annotations.json",parameters,function(mhdata){
			if (typeof(mhdata)=="string") {
				mhdata = JSON.parse(mhdata);
			}
			var data = {episode:id,type:"trim",value:published,"in":trimStart,out:trimEnd};
			if (mhdata.annotations.total==0) {
				if (published=="unchanged") {
					data.value = "false"; 
				}
				if (trimStart<0) data["in"] = 0;
				if (trimEnd==0) data["out"] = videoDuration;
				else if (trimEnd<0) data["out"] = 0;
				// Create annotation
				new paella.Ajax(trimServerUrl + "annotation/",data,function(result) {
					if (typeof(result)=="string") {
						result = JSON.parse(result);
					}
					paella.debug.log("annotation saved");
					$(document).trigger(paella.events.didSaveChanges);
					if (onSuccess) {
						onSuccess();
					}
				},thisClass.proxyUrl,thisClass.useJsonp,'PUT');
			}
			else {
				var annotationId = mhdata.annotations.annotation.annotationId;
				if (published=="unchanged") {
					data.value = mhdata.annotations.annotation.value;
				}
				if (trimStart<0) data["in"] = mhdata.annotations.annotation.inpoint;
				if (trimEnd==0) data["out"] = videoDuration;
				else if (trimEnd<0) data["out"] = mhdata.annotations.annotation.outpoint;
				// Create annotation
				new paella.Ajax(trimServerUrl + "annotation/" + annotationId,data,function(result) {
					if (typeof(result)=="string") {
						result = JSON.parse(result);
					}
					paella.debug.log("annotation with id=" + annotationId + " deleted");
					// Create annotation
					new paella.Ajax(trimServerUrl + "annotation/",data,function(result) {
						if (typeof(result)=="string") {
							result = JSON.parse(result);
						}
						paella.debug.log("new annotation saved: ");
						paella.debug.log(data);
						$(document).trigger(paella.events.didSaveChanges);
						if (onSuccess) {
							onSuccess();
						}
					},thisClass.proxyUrl,thisClass.useJsonp,'PUT');
				},thisClass.proxyUrl,thisClass.useJsonp,'DELETE');
			}
		},this.proxyUrl,this.useJsonp);
	}
});

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

var Html5Video = Class.create(DomNode,{
	classNameBackup:'',

	initialize:function(id,left,top,width,height) {
		var relativeSize = new RelativeVideoSize();
		var percentTop = relativeSize.percentVSize(top) + '%';
		var percentLeft = relativeSize.percentWSize(left) + '%';
		var percentWidth = relativeSize.percentWSize(width) + '%';
		var percentHeight = relativeSize.percentVSize(height) + '%';
		var style = {top:percentTop,left:percentLeft,width:percentWidth,height:percentHeight,position:'absolute',zIndex:GlobalParams.video.zIndex};
		this.parent('video',id,style);
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

paella.VideoContainerBase = Class.create(DomNode,{
	initialize:function(id) {
		var style = {position:'absolute',left:'0px',right:'0px',top:'0px',bottom:'0px',overflow:'hidden'}
		this.parent('div',id,style);
	},
	
	initEvents:function() {
		var thisClass = this;
		$(document).bind(paella.events.play,function(event) { thisClass.play(); });
		$(document).bind(paella.events.pause,function(event) { thisClass.pause(); });
		$(document).bind(paella.events.next,function(event) { thisClass.next(); });
		$(document).bind(paella.events.previous,function(event) { thisClass.previous(); });
		$(document).bind(paella.events.seekTo,function(event,params) { thisClass.setCurrentPercent(params.newPositionPercent); });
		$(document).bind(paella.events.seekToTime,function(event,params) { thisClass.setCurrentTime(params.time); });
		$(document).bind(paella.events.setPlaybackRate,function(event,params) { thisClass.setPlaybackRate(params); });
		$(document).bind(paella.events.setVolume,function(event,params) { thisClass.setVolume(params); });
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
	trimming:{enabled:false,start:0,end:0},
	//fitHorizontal:false,
	isHidden:false,
	maxSyncDelay:0.5,
	logos:null,
	isMasterReady:false,
	isSlaveReady:false,

	initialize:function(id) {
		this.parent(id);
		this.containerId = id + '_container';
		this.video1Id = id + '_1';
		this.video2Id = id + '_2';
		this.backgroundId = id + '_bkg';
		this.logos = [];
		
		this.container = new DomNode('div',this.containerId,{position:'relative',display:'block',marginLeft:'auto',marginRight:'auto',width:'1024px',height:'567px'});
		this.addNode(this.container);
		
		var masterVideo = new Html5Video(this.video1Id,850,140,360,550);
		masterVideo.domElement.className = this.video1ClassName;
		this.container.addNode(masterVideo);
		
		var slaveVideo = new Html5Video(this.video2Id,10,40,800,600);
		slaveVideo.domElement.className = this.video2ClassName;
		slaveVideo.setVolume(0);
		this.container.addNode(slaveVideo);
		
		this.container.addNode(new BackgroundContainer(this.backgroundId,'config/profiles/resources/default_background_paella.jpg'));
		var thisClass = this;
		$(masterVideo.domElement).bind('timeupdate',function(event) { $(document).trigger(paella.events.timeupdate, {videoContainer:thisClass, currentTime:masterVideo.domElement.currentTime }); });
		$(masterVideo.domElement).bind('seeking',function(event) { $(document).trigger(paella.events.seeking, {videoContainer:thisClass, currentTime:masterVideo.domElement.currentTime }); });
		$(masterVideo.domElement).bind('seeked',function(event) { $(document).trigger(paella.events.seeked, {videoContainer:thisClass, currentTime:masterVideo.domElement.currentTime }); });

		this.initEvents();
		$(document).bind(paella.events.timeupdate,function(event) { thisClass.checkVideoTrimming(); } );		
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
		if (masterVideo && slaveVideo && masterVideo.currentTime && slaveVideo.currentTime) {
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
			return this.masterVideo().domElement.duration;			
		}
	},
	
	paused:function() {
		return this.masterVideo().domElement.paused;
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

	setSources:function(masterVideoData,slaveVideoData) {
		var master = this.masterVideo();
		var slave = this.slaveVideo();
		var thisClass = this;
		$(master.domElement).bind('canplay',function(event) {
			thisClass.isMasterReady = true;
		});
		$(slave.domElement).bind('canplay',function(event) {
			thisClass.isSlaveReady = true;
		});
		this.setupVideo(master,masterVideoData);
		this.setupVideo(slave,slaveVideoData);
	},
	
	setupVideo:function(videoNode,videoData) {
		if (videoNode && videoData) {
			var mp4Source = videoData.sources.mp4;
			var oggSource = videoData.sources.ogg;
			var webmSource = videoData.sources.webm;
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
	},

	setProfile:function(profileName,onSuccess) {
		var thisClass = this;
		paella.Profiles.loadProfile(profileName,function(profileData) {
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
		var slaveDimensions = video2.getDimensions();
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
		video1.setVisible(profileData.masterVideo.visible,true);
		video2.setRect(rectSlave,true);
		video2.setVisible(profileData.slaveVideo.visible,true);
		video1.setLayer(profileData.masterVideo.layer);
		video2.setLayer(profileData.slaveVideo.layer);
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
		this.addNode(new PlaybackBar(this.playbackBarId));
		this.addNode(new DomNode('div',this.playbackPopUpsId,{position:'absolute',top:'0px',right:'0px',height:'37px'}));

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
	
	autohideTimer:null,
	hideControlsTimeMillis:3000,
	videoSyncTimeMillis:5000,

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
		if (this.domElement.style.opacity!=1.0) {
			this.domElement.style.opacity = 1.0;
			$(document).trigger(paella.events.controlBarDidShow);
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
		if (!paella.player.videoContainer.paused()) {
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

paella.PlayerBase = Class.create({
	config:null,
	playerId:'',
	mainContainer:null,
	videoContainer:null,
	controls:null,
	
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
			$(document).trigger(paella.events.error,{error:paella.errors.browserCompatibilityError});
			paella.messageBox.showError(paella.errors.browserCompatibilityError + '<div style="display:block;width:700px;margin-left:auto;margin-right:auto;font-family:Verdana,sans-sherif;"><a href="http://www.google.es/chrome" style="color:#004488;float:left;margin-right:20px;"><img src="resources/images/chrome.png" alt="Google Chrome"></img><p>Google Chrome</p></a><a href="http://windows.microsoft.com/en-US/internet-explorer/products/ie/home" style="color:#004488;float:left;margin-right:20px;"><img src="resources/images/explorer.png" alt="Internet Explorer 9"></img><p>Internet Explorer 9</p></a><a href="http://www.apple.com/safari/" style="float:left;margin-right:20px;color:#004488"><img src="resources/images/safari.png" alt="Safari"></img><p>Safari 5</p></a><a href="http://www.mozilla.org/firefox/" style="float:left;color:#004488"><img src="resources/images/firefox.png" alt="Safari"></img><p>Firefox 12</p></a></div>');
		}
		return false;
	},

	initialize:function(playerId) {
		if (!this.checkCompatibility()) {
			paella.debug.log('Your browser is not compatible');
		}
		else {
			paella.player = this;
			this.playerId = playerId;
			this.mainContainer = $('#' + this.playerId)[0];
			//this.mainContainer.className = 'paellaMainContainer';
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
		var configUrl = 'config/config.json';
		var thisClass = this;
		var params = {};
		this.loader = new paella.LoaderContainer('paellaPlayer_loader');
		document.documentElement.appendChild(this.loader.domElement);
		$(document).trigger(paella.events.loadStarted);

		new paella.Ajax(configUrl,params,function(data) {
			if (typeof(data)=="string") {
				data = JSON.parse(data);
			}
			thisClass.onLoadConfig(data);
		});
	},

	onLoadConfig:function(configData) {
		if (typeof(configData)=="string") {
			configData = JSON.parse(configData);
		}
		this.config = configData;
		this.videoIdentifier = paella.utils.parameters.get('id');

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
		this.checkPermissionsAndLoad();
	},
	
	checkPermissionsAndLoad:function() {
		var thisClass = this;
		var roleManager = new paella.utils.UserRoleManager(this.config);
		roleManager.checkAccess(function(canRead,canContribute,canWrite,loadError,isAnonimous) {
			if (!loadError) {
				paella.debug.log("read:" + canRead + ", contribute:" + canContribute + ", write:" + canWrite);
				var unloadIfNotPublished = true;
				if (canWrite) {
					unloadIfNotPublished = false;
					paella.utils.require('javascript/paella_editor.js');
					thisClass.setupEditor();
					$(document).bind(paella.events.showEditor,function(event) { thisClass.showEditor(); });
					$(document).bind(paella.events.hideEditor,function(event) { thisClass.hideEditor(); });
					thisClass.videoContainer.publishVideo();
				}
				if (canRead) {
					thisClass.loadTrimAndVideo(unloadIfNotPublished);
				}
				else {
					thisClass.unloadAll(paella.errors.authorizationFailed);
				}	
			}
			else if (isAnonimous) {
				thisClass.unloadAll(paella.errors.anonimousUserError);
				$(document).trigger(paella.events.error,{error:paella.errors.anonimousUserError});
			}
			else {
				thisClass.unloadAll(paella.errors.loadError);
				$(document).trigger(paella.events.error,{error:paella.errors.loadError});
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

	loadTrimAndVideo:function(unloadIfNotPublished) {
		if (this.videoIdentifier) {
			if (this.config.trimming.enabled) {
				var trimData = new paella.utils.TrimData(this.config);
				var thisClass = this;
				trimData.load(this.videoIdentifier,function(trimData) {
					if (unloadIfNotPublished && (trimData.published==false || trimData.published=="undefined")) {
						thisClass.unloadAll(paella.errors.videoNotPublished);
					}
					else {
						thisClass.videoContainer.publishVideo();
					}

					if (trimData.trimEnd!=0) {
						thisClass.videoContainer.enableTrimming();
						thisClass.videoContainer.setTrimming(trimData.trimStart,trimData.trimEnd);
					}

					thisClass.loadVideo(trimData);
				});
			}
			else {
				this.loadVideo();
			}
		}
	},
	
	setupEditor:function() {
		if (paella.extended) return;
		if (paella.utils.PaellaEditor && paella.player.config.editor && paella.player.config.editor) {
			this.editor = new paella.utils.PaellaEditor('editor',this);
			this.controls.showEditorButton();
			this.mainContainer.appendChild(this.editor.domElement);
		}
		else {
			setTimeout('paella.player.setupEditor()',500);
		}
	},
	
	showEditor:function() {
		this.controls.enterEditMode();
		var editor = this.editor;
		var player = this.videoContainer;
		if (editor && player) {
			var height = $(editor.domElement).height();
			player.domElement.style.bottom = height + 'px';
			this.onresize();
		}
	},

	hideEditor:function() {
		this.controls.exitEditMode();
		var editor = this.editor;
		var player = this.videoContainer;
		if (editor && player) {
			player.domElement.style.bottom = '0px';
			this.onresize();
		}
	},

	loadVideo:function(trimData) {
		if (this.videoIdentifier) {
			var matterhornData = new paella.utils.MatterhornData(this.config);
			var thisClass = this;
			matterhornData.loadVideoData(this.videoIdentifier,function(videoData) {
				var playbackControl = thisClass.controls.playbackControl();
				var trimEnabled = thisClass.videoContainer.trimEnabled();
				var trimStart = thisClass.videoContainer.trimStart();
				var trimEnd = thisClass.videoContainer.trimEnd();
				var frameList = videoData.frames;
				thisClass.videoContainer.setSources(videoData.master,videoData.slave);
				
				var timer = new paella.utils.Timer(function(timer) {
					thisClass.videoContainer.syncVideos();
				},thisClass.videoSyncTimeMillis);
				timer.repeat = true;
				
				thisClass.videoData = videoData;
				
				// Check browser video codec compatibility
				var videoElement = document.createElement('video');
				var status = false;
				
				// h264 support
				var h264 = videoElement.canPlayType('video/mp4; codecs="avc1.42E01E"');
				if (h264=="") h264 = videoElement.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
				h264 = (h264=='probably') || (h264=='maybe');
				
				// ogg support
				var ogg = videoElement.canPlayType('video/ogg; codecs="theora"');
				ogg = (ogg=='probably') || (ogg=='maybe');
				
				// webm support
				var webm = videoElement.canPlayType('video/webm; codecs="vp8, vorbis"');
				webm = (webm=='probably') || (webm=='maybe');
				
				paella.debug.log("Browser video capabilities: mp4=" + ((h264) ? 'yes':'no') + ', ogg=' + ((ogg) ? 'yes':'no') + ', webm=' + ((webm) ? 'yes':'no'));
			
				if (videoData.master.sources.mp4 && h264) status = true;
				else if (videoData.master.sources.ogg && ogg) status = true;
				else if (videoData.master.sources.webm && webm) status = true;
				
				if (!status) {
					paella.messageBox.showError(paella.errors.videoCodecError);
					$(document).trigger(paella.events.error,{error:paella.errors.videoCodecError});
				}

				// This event will hide the frames outside the trimming area
				$(document).trigger(paella.events.setTrim,{trimEnabled:trimEnabled,trimStart:trimStart,trimEnd:trimEnd});
				
				// Load plugins
				$(document).trigger(paella.events.loadPlugins,{pluginManager:paella.pluginManager});
				
				// The loadComplete event depends on the readyState of presenter and slide video
				new paella.utils.Timer(function(timer) {
					var master = thisClass.videoContainer.masterVideo();
					var slave = thisClass.videoContainer.slaveVideo();
					if (master.domElement.readyState>2 && slave.domElement.readyState>2) {
						$(document).trigger(paella.events.loadComplete,{masterVideo:master,slaveVideo:slave,frames:frameList});
						thisClass.onresize();
						timer.repeat = false;
					}
					else {
						timer.repeat = true;
					}
				},500);
			});
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
		},1000);
	}
});

var paellaPlayer = null;

paella.plugins = {};

paella.plugins.events = {};

paella.InitCallback = Class.create({
	translatePlayerMessages:function(language,messages) {
		if (language && (language.toLowerCase()=='es-es' || language.toLowerCase()=='es')) {
			messages.videoCodecError = "Tu navegador no dispone de los codecs de vídeo necesarios.";
			messages.browserCompatibilityError = "Tu navegador no es compatible con HTML 5. Puedes utilizar cualquiera de los siguientes navegadores:";
			messages.videoNotPublished = "El profesor no ha publicado este vídeo";
			messages.authorizationFailed = "No estás autorizado a ver este recurso";
			messages.loadError = "No estás autorizado a ver este recurso";
			messages.anonimousUserError = "No se ha podido mostrar el vídeo porque no estás identificado en el sistema";
			messages.noSuchIdentifier = "El vídeo no existe";
		}	
	},
	
	translateEditorMessages:function(language,messages) {
		if (language && (language.toLowerCase()=='es-es' || language.toLowerCase()=='es')) {
			messages.saveChanges = 'Guardar cambios';
			messages.autopublishVideo = "Publicar el vídeo a los siete días";
			messages.publishVideo = 'Publicar este vídeo';
			messages.hideVideo = 'No publicar este vídeo';
			messages.closeEditor = 'Cerrar editor';
			messages.trimLeftTool = 'Herramienta de recortar por la izquierda';
			messages.selectTool = 'Herramienta de selección';
			messages.trimRightTool = 'Herramienta de recortar por la derecha';
		}
	}
});

paella.initCallback = null;

/* Initializer function */
function initPaellaEngage(playerId,initCallback) {
	if (!initCallback || !initCallback.translatePlayerMessages) {
		initCallback = new paella.InitCallback();
	}
	paella.initCallback = initCallback;
	var lang = navigator.language || window.navigator.userLanguage;
	paella.initCallback.translatePlayerMessages(lang,paella.errors);
	paellaPlayer = new PaellaPlayer(playerId);
}

