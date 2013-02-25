paella.plugins.DescriptionPlugin  = Class.create(paella.TabBarPlugin,{
	id:null,
	divRoot:null,
	desc: { date:'-', contributor:'-', language:'-', views:'-', serie:'-', serieId:'', presenter:'-', description:'-', title:'-', subject:'-' },
	
	getIndex:function() {
		return 10;
	},
	
	getTabName:function() {
		return "Description";
	},
	
	getRootNode:function(id) {
		this.id = id + 'descriptionPlugin';
		this.divRoot = new DomNode('div',this.id ,{display:'block'});
		
		this.doDescription();		
		return this.divRoot;		
	},
	
	doDescription:function() {
		var thisClass = this;
				
		if (paella.matterhorn.episode.dcTitle) { this.desc.title = paella.matterhorn.episode.dcTitle; }
		if (paella.matterhorn.episode.dcIsPartOf) { 
			this.desc.serieId = paella.matterhorn.episode.dcIsPartOf;
			if (paella.matterhorn.series.serie.dcTitle) { this.desc.serie = paella.matterhorn.series.serie.dcTitle; }
		}
		if (paella.matterhorn.episode.dcCreator) { this.desc.presenter = paella.matterhorn.episode.dcCreator; }
		if (paella.matterhorn.episode.dcContributor) { this.desc.contributor = paella.matterhorn.episode.dcContributor; }
		if (paella.matterhorn.episode.dcDescription) { this.desc.description = paella.matterhorn.episode.dcDescription; }
		if (paella.matterhorn.episode.dcLanguage) { this.desc.language = paella.matterhorn.episode.dcLanguage; }
		if (paella.matterhorn.episode.dcSubject) { this.desc.subject = paella.matterhorn.episode.dcSubject; }		

		this.desc.date = "n.a."
		var dcCreated = paella.matterhorn.episode.dcCreated;
		if (dcCreated) {			
			var sd = new Date();
			sd.setFullYear(parseInt(dcCreated.substring(0, 4), 10));
			sd.setMonth(parseInt(dcCreated.substring(5, 7), 10) - 1);
			sd.setDate(parseInt(dcCreated.substring(8, 10), 10));
			sd.setHours(parseInt(dcCreated.substring(11, 13), 10));
			sd.setMinutes(parseInt(dcCreated.substring(14, 16), 10));
			sd.setSeconds(parseInt(dcCreated.substring(17, 19), 10));
			this.desc.date = sd.toLocaleString();
		}
		
		var restEndpoint = paella.player.config.restServer.url + "usertracking/stats.json"; 
		new paella.Ajax(restEndpoint,{id:paella.player.videoIdentifier}, function(response) {
			if (typeof(response)=="string") {
				response = JSON.parse(response);
			}
			thisClass.desc.views = response.stats.views;
			thisClass.insertDescription();
		}, paella.player.config.proxyLoader.url, paella.player.config.proxyLoader.usejsonp);
	},
	
	insertDescription:function() {			
		var divDate = new DomNode('div',this.id+"_Date", {});
		var divContributor = new DomNode('div',this.id+"_Contributor" , {});
		var divLanguage = new DomNode('div',this.id+"_Language" , {});
		var divViews = new DomNode('div',this.id+"_Views" , {});
		var divTitle = new DomNode('div',this.id+"_Title", {});
		var divSubject = new DomNode('div',this.id+"_Subject", {});
		var divSeries = new DomNode('div',this.id+"_Series", {});
		var divPresenter = new DomNode('div',this.id+"_Presenter", {});
		var divDescription = new DomNode('div',this.id+"_Description", {});

		divDate.domElement.innerHTML = 'Date: <span style="color:grey;">'+this.desc.date+'</span>';
		divContributor.domElement.innerHTML = 'Contributor: <span style="color:grey;">'+this.desc.contributor+'</span>';
		divLanguage.domElement.innerHTML = 'Language: <span style="color:grey;">'+this.desc.language+'</span>';
		divViews.domElement.innerHTML = 'Views: <span style="color:grey;">'+this.desc.views+'</span>';			
		divTitle.domElement.innerHTML = 'Title: <span style="color:grey;">'+this.desc.title+'</span>';
		divSubject.domElement.innerHTML = 'Subject: <span style="color:grey;">'+this.desc.subject+'</span>';
		divSeries.domElement.innerHTML = 'Series: <a href="' + paella.player.config.restServer.url + 'engage/ui/index.html?series='+this.desc.serieId+'">'+this.desc.serie+'</a>';
		divPresenter.domElement.innerHTML = 'Presenter: <a href="' + paella.player.config.restServer.url + 'engage/ui/index.html?q='+this.desc.presenter+'">'+this.desc.presenter+'</a>';
		divDescription.domElement.innerHTML = 'Description: <span style="color:grey;">'+this.desc.description+'</span>';

		//---------------------------//			
		var divLeft = new DomNode('div',this.id+"_Left" ,{display:'inline-block', width:'45%', padding: '1em 1.4em', verticalAlign: 'top'});			

		divLeft.addNode(divTitle);
		divLeft.addNode(divPresenter);
		divLeft.addNode(divSeries);
		divLeft.addNode(divDate);		
		divLeft.addNode(divViews);
		
		//---------------------------//
		var divRight = new DomNode('div',this.id ,{display:'inline-block', width:'45%', padding: '1em 1.4em', verticalAlign: 'top'});

		divRight.addNode(divContributor);
		divRight.addNode(divSubject);
		divRight.addNode(divLanguage);
		divRight.addNode(divDescription);
			
			
		this.divRoot.addNode(divLeft);	
		this.divRoot.addNode(divRight);	
	}
	
});

new paella.plugins.DescriptionPlugin();

paella.plugins.ExtendedProfilesPlugin = Class.create(paella.PlaybackPopUpPlugin,{
	profilesContainer:null,
	container:null,
	button:null,
	rightPosition:0,
	sizeBackup:null,

	initialize:function() {
		this.parent();
	},

	getRootNode:function(id) {
		var thisClass = this;
		this.button = new Button(id + '_extended_profiles','showExtendedProfiles',function(event) { thisClass.showProfilesPress(); },true);
		return this.button;
	},
	
	getWidth:function() {
		return 45;
	},
	
	setRightPosition:function(position) {
		this.button.domElement.style.right = position + 'px';
		this.rightPosition = position;
	},
	
	getPopUpContent:function(id) {
		var thisClass = this;
		this.profilesContainer = new DomNode('div',id + '_extended_profiles_container',{display:'none'});
		this.profilesContainer.addNode(new Button(id + '_extended_profiles_profile1','extendedProfilesProfile1',function(event) { thisClass.profile1Click(); }));
		this.profilesContainer.addNode(new Button(id + '_extended_profiles_profile2','extendedProfilesProfile2',function(event) { thisClass.profile2Click(); }));
		this.profilesContainer.addNode(new Button(id + '_extended_profiles_fullscreen','extendedProfilesFullscreen',function(event) { thisClass.fullscreenClick(); }));
		this.profilesContainer.domElement.style.right = this.rightPosition + 'px';
		return this.profilesContainer;
	},

	showProfilesButton:function() {
		return this.button;
	},
	
	showProfilesPress:function() {
		if (this.showProfilesButton().isToggled()) {
			$(this.profilesContainer.domElement).show();
		}
		else {
			$(this.profilesContainer.domElement).hide();
		}
	},
	
	profile1Click:function() {
		$(this.profilesContainer.domElement).hide();
		this.button.toggle();
		paella.extended.setMainProfile();
		var fs = document.getElementById(paella.player.mainContainer.id);
		if (this.isFullscreen()) {
			if (document.webkitCancelFullScreen) {
				document.webkitCancelFullScreen();
			}
			else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			}
			else if (document.cancelFullScreen) {
				document.cancelFullScreen();
			}
		}
	},
	
	profile2Click:function() {
		$(this.profilesContainer.domElement).hide();
		this.button.toggle();
		paella.extended.setProfile('profile2');
		var fs = document.getElementById(paella.player.mainContainer.id);
		if (this.isFullscreen()) {
			if (document.webkitCancelFullScreen) {
				document.webkitCancelFullScreen();
			}
			else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			}
			else if (document.cancelFullScreen) {
				document.cancelFullScreen();
			}
		}
	},
	
	fullscreenClick:function() {
		$(this.profilesContainer.domElement).hide();
		this.button.toggle();
		this.switchFullscreen();
	},
	
	isFullscreen:function() {
		if (document.webkitIsFullScreen!=undefined) {
			return document.webkitIsFullScreen;
		}
		else if (document.mozFullScreen!=undefined) {
			return document.mozFullScreen;
		}
		return false;
	},

	switchFullscreen:function() {
		var fs = document.getElementById(paella.player.mainContainer.id);
		
		if (this.isFullscreen()) {
			if (document.webkitCancelFullScreen) {
				document.webkitCancelFullScreen();
			}
			else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			}
			else if (document.cancelFullScreen) {
				document.cancelFullScreen();
			}
		}
		else {
			if (fs.webkitRequestFullScreen) {
				fs.webkitRequestFullScreen();
				this.fullscreen = true;
			}
			else if (fs.mozRequestFullScreen) {
				fs.mozRequestFullScreen();
				this.fullscreen = true;
			}
			else if (fs.requestFullScreen()) {
				fs.requestFullScreen();
				this.fullscreen = true;
			}
			else {
				alert('Your browser does not support fullscreen mode');
			}
		}
	},
	
	checkEnabled:function(onSuccess) {
		onSuccess(paella.extended!=null);
	},
	
	getIndex:function() {
		return 109;
	},
	
	getName:function() {
		return "ExtendedProfiles";
	}
});

new paella.plugins.ExtendedProfilesPlugin();



var FrameThumbnail = Class.create(DomNode,{
	isCurrentFrame:null,
	frameData:null,
	nextFrameData:null,
	frameContainer:null,

	initialize:function(frameData,frameContainer) {
		paella.debug.log('create frame thumbnail');
		this.parent('img',frameData.id,{float:'left'});
		this.domElement.className = 'frameThumbnail';
		this.domElement.setAttribute('src',frameData.url);
		this.domElement.setAttribute('height','40');
		this.domElement.setAttribute('width','60');
		this.frameContainer = frameContainer;
		this.frameData = frameData;
		var thisClass = this;
		$(this.domElement).bind('click',function(event) { thisClass.frameContainer.seekToTime(thisClass.frameData.time) });
		$(document).bind(paella.events.setTrim,function(event,params) {
			thisClass.checkVisibility(params.trimEnabled,params.trimStart,params.trimEnd);
		});
	},
	
	setNextFrameData:function(nextFrameData) {
		this.nextFrameData = nextFrameData;
	},
	
	setCurrent:function(current) {
		this.isCurrentFrame = current;

		if (current) {
			this.domElement.className = 'enabledFrameThumbnail';
		}
		else {
			this.domElement.className = 'frameThumbnail';
		}
	},
	
	checkVisibility:function(trimEnabled,trimStart,trimEnd) {
		if (!trimEnabled) {
			$(this.domElement).show();
		}
		else if (this.frameData.time<trimStart) {
			if (this.nextFrameData && this.nextFrameData.time>trimStart) {
				$(this.domElement).show();
			}
			else {
				$(this.domElement).hide();				
			}
		}
		else if (this.frameData.time>trimEnd) {
			$(this.domElement).hide();
		}
		else {
			$(this.domElement).show();
		}
	}
});

var FramesControl = Class.create(DomNode,{
	frames:{},
	currentFrame:null,

	initialize:function(id) {
		this.parent('div',id,{position:'absolute',left:'0px',right:'0px',bottom:'37px',display:'block'});
		this.domElement.className = 'frameListContainer';
		this.hide();
		var thisClass = this;
		$(document).bind(paella.events.loadComplete,function(event,params) { thisClass.setFrames(params.frames)});
		$(document).bind(paella.events.timeupdate,function(event,params) { thisClass.onTimeUpdate(params) });
		$(document).bind(paella.events.controlBarWillHide,function(event) { thisClass.hide(); });
	},
	
	seekToTime:function(time) {
		$(document).trigger(paella.events.seekToTime,{time:time + 1});
	},
	
	isVisible:function() {
		return $(this.domElement).is(':visible');
	},
	
	show:function() {
		$(this.domElement).show();
	},
	
	hide:function() {
		$(this.domElement).hide();
	},

	setFrames:function(frames) {
		this.frames = frames;
		var previousFrame = null;
		for(var frame in frames) {
			var frameThumbnail = new FrameThumbnail(frames[frame],this);
			this.addNode(frameThumbnail);
			frameThumbnail.setNextFrameData(previousFrame);
			previousFrame = frame;
		}
	},
	
	highlightCurrentFrame:function(currentTime) {
		var frame = this.getCurrentFrame(currentTime);
		if (this.currentFrame!=frame) {
			if (this.currentFrame!=null) {
				var lastFrame = this.getNode(this.currentFrame.id);
				lastFrame.setCurrent(false);
			}
			this.currentFrame = frame;
			var frameThumbnail = this.getNode(this.currentFrame.id);
			frameThumbnail.setCurrent(true);
		}
	},
	
	getCurrentFrame:function(currentTime) {
		return this.frames[this.getCurrentFrameIndex(currentTime)];
	},
	
	getCurrentFrameIndex:function(currentTime) {
		var currentFrameIndex = 0;
		for (var i=0;i<currentTime;++i) {
			if (this.frames[i]) {
				currentFrameIndex = this.frames[i].time;
			}
		}
		return currentFrameIndex;
	},
	
	onTimeUpdate:function(memo) {
		if (this.isVisible()) {
			this.highlightCurrentFrame(memo.currentTime);
		}
	}
});

paella.plugins.FrameControlPlugin = Class.create(paella.PlaybackPopUpPlugin,{
	framesControl:null,
	container:null,
	button:null,

	getTabName:function() {
		return "Diapositivas";
	},
	
	getRootNode:function(id) {
		var thisClass = this;
		this.container = new DomNode('div',id + '_frameControl_container');
		this.button = this.container.addNode(new Button(id + '_frameControl_button','showFramesButton',function(event) { thisClass.showFramesPress(); },true));
		return this.container;
	},
	
	getWidth:function() {
		return 45;
	},
	
	setRightPosition:function(position) {
		this.button.domElement.style.right = position + 'px';
	},
	
	getPopUpContent:function(id) {
		var thisClass = this;
		this.framesControl = new FramesControl(id + '_frameContol_frames');
		$(document).bind(paella.events.seekToTime,function(event){
			if (thisClass.showFramesButton().isToggled()) {
				thisClass.showFramesButton().toggleIcon();
			}
		});
		return this.framesControl;
	},

	showFramesButton:function() {
		return this.button;
	},
	
	showFramesPress:function() {
		if (this.showFramesButton().isToggled()) {
			this.framesControl.show();
		}
		else {
			this.framesControl.hide();
		}
	},
	
	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},
	
	getIndex:function() {
		return 100;
	},
	
	getName:function() {
		return "FrameControlPlugin";
	},
	
	getMinWindowSize:function() {
		return 600;
	}
});

new paella.plugins.FrameControlPlugin();

paella.plugins.FullscreenPlugin = Class.create(paella.PlaybackPopUpPlugin,{
	button:null,

	getRootNode:function(id) {
		var thisClass = this;
		this.button = new Button(id + '_fullscreen_button','fullscreenButton',function(event) { thisClass.switchFullscreen(); }, false);
		return this.button;
	},

	getWidth:function() {
		return 45;
	},
	
	setRightPosition:function(position) {
		this.button.domElement.style.right = position + 'px';
	},

	getPopUpContent:function(id) {
		return null;
	},
	
	isFullscreen:function() {
		if (document.webkitIsFullScreen!=undefined) {
			return document.webkitIsFullScreen;
		}
		else if (document.mozFullScreen!=undefined) {
			return document.mozFullScreen;
		}
		return false;
	},
	
	switchFullscreen:function() {
		var fs = document.getElementById(paella.player.mainContainer.id);
		fs.style.width = '100%';
		fs.style.height = '100%';
		if (this.isFullscreen()) {
			if (document.webkitCancelFullScreen) {
				document.webkitCancelFullScreen();
			}
			else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			}
			else if (document.cancelFullScreen) {
				document.cancelFullScreen();
			}
		}
		else {
			if (fs.webkitRequestFullScreen) {
				fs.webkitRequestFullScreen();
				this.fullscreen = true;
			}
			else if (fs.mozRequestFullScreen){
				fs.mozRequestFullScreen();
				this.fullscreen = true;
			}
			else if (fs.requestFullScreen()) {
				fs.requestFullScreen();
				this.fullscreen = true;
			}
			else {
				alert('Your browser does not support fullscreen mode');
			}
		}
	},
	
	checkEnabled:function(onSuccess) {
		onSuccess(paella.extended==null);
	},
	
	getIndex:function() {
		return 103;
	},
	
	getName:function() {
		return "FullScreenButtonPlugin";
	}
});

new paella.plugins.FullscreenPlugin();


paella.plugins.PlayPauseButtonPlugin = Class.create(paella.PlaybackControlPlugin,{
	playId:'',
	pauseId:'',
	containerId:'',
	container:null,

	getRootNode:function(id) {
		this.playId = id + '_playButton';
		this.pauseId = id + '_pauseButton';
		this.containerId = id + '_container';
		var playPauseContainer = new DomNode('div',this.containerId,{position:'absolute'});
		this.container = playPauseContainer;

		var thisClass = this;
		playPauseContainer.addNode(new Button(this.playId,'playButton',function(event) { thisClass.playButtonClick(); },false));
		var pauseButton = new Button(this.pauseId,'pauseButton',function(event) { thisClass.pauseButtonClick(); },false);
		playPauseContainer.addNode(pauseButton);
		$(pauseButton.domElement).hide();
		
		$(document).bind(paella.events.endVideo,function(event) {
			thisClass.playButton().show();
			thisClass.pauseButton().hide();
		});
		
		$(document).bind(paella.events.play,function() {
			thisClass.onPlay();
		});
		$(document).bind(paella.events.pause,function() {
			thisClass.onPause();
		});

		return playPauseContainer;		
	},
	
	setLeftPosition:function(position) {
		this.container.domElement.style.left = position + 'px';
	},
	
	getWidth:function() {
		return 50;
	},
	
	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},

	getIndex:function() {
		return 0;
	},
	
	getName:function() {
		return "PlayPauseButtonPlugin";
	},

	playButton:function() {
		return this.container.getNode(this.playId);
	},

	pauseButton:function() {
		return this.container.getNode(this.pauseId);
	},
	
	playButtonClick:function() {
		this.playButton().hide();
		this.pauseButton().show();
		$(document).trigger(paella.events.play);
	},

	pauseButtonClick:function() {
		this.playButton().show();
		this.pauseButton().hide();
		$(document).trigger(paella.events.pause);
	},
	
	onPlay:function() {
		if (this.playButton()) {
			this.playButton().hide();
			this.pauseButton().show();			
		}
	},
	
	onPause:function() {
		if (this.playButton()) {
			this.playButton().show();
			this.pauseButton().hide();			
		}
	}
});

paella.plugins.playPauseButtonPlugin = new paella.plugins.PlayPauseButtonPlugin();

paella.plugins.PlayButtonOnScreen = Class.create(paella.EventDrivenPlugin,{
	containerId:'paella_plugin_PlayButtonOnScreen',
	container:null,
	enabled:true,
	isPlaying:false,

	initPlugin:function() {
		this.container = document.createElement('div');
		this.container.className = "playButtonOnScreen";
		this.container.id = this.containerId;
		paella.player.videoContainer.domElement.appendChild(this.container);
		var thisClass = this;
		$(this.container).click(function(event){thisClass.onPlayButtonClick()});
		
		var icon = document.createElement('canvas');
		icon.className = "playButtonOnScreenIcon";
		icon.setAttribute("width", 300);
		icon.setAttribute("height",300);
		var ctx = icon.getContext('2d');
		
		ctx.beginPath();
		ctx.arc(150,150,140,0,2*Math.PI,true);
		ctx.closePath();
		
		ctx.strokeStyle = 'white';
		ctx.lineWidth = 10;
		ctx.stroke();
		ctx.fillStyle = '#8f8f8f';
		ctx.fill();
		
		ctx.beginPath();
		ctx.moveTo(100,70);
		ctx.lineTo(250,150);
		ctx.lineTo(100,230);
		ctx.lineTo(100,70);
		ctx.closePath();
		ctx.fillStyle = 'white';
		ctx.fill();

		ctx.stroke();

		this.container.appendChild(icon);
	},
	
	getEvents:function() {
		return [paella.events.endVideo,paella.events.play,paella.events.pause,paella.events.showEditor,paella.events.hideEditor,paella.events.loadComplete];
	},
	
	onEvent:function(eventType,params) {
		switch (eventType) {
			case paella.events.loadComplete:
				this.initPlugin();
				break;
			case paella.events.endVideo:
				this.endVideo();
				break;
			case paella.events.play:
				this.play();
				break;
			case paella.events.pause:
				this.pause();
				break;
			case paella.events.showEditor:
				this.showEditor();
				break;
			case paella.events.hideEditor:
				this.hideEditor();
				break;
		}
	},
	
	onPlayButtonClick:function() {
		$(document).trigger(paella.events.play);
	},
	
	endVideo:function() {
		this.isPlaying = false;
		this.checkStatus();
	},
	
	play:function() {
		this.isPlaying = true;
		this.checkStatus();
	},
	
	pause:function() {
		this.isPlaying = false;
		this.checkStatus();
	},
	
	showEditor:function() {
		this.enabled = false;
		this.checkStatus();
	},
	
	hideEditor:function() {
		this.enabled = true;
		this.checkStatus();
	},
	
	checkStatus:function() {
		if ((this.enabled && this.isPlaying) || !this.enabled) {
			$(this.container).hide();
		}
		else {
			$(this.container).show();
		}
	},

	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},
	
	getIndex:function() {
		return 1010;
	},
	
	getName:function() {
		return "PlayButtonOnScreen";
	}
});

new paella.plugins.PlayButtonOnScreen();


paella.plugins.RepeatButtonPlugin = Class.create(paella.PlaybackControlPlugin,{
	buttonId:'',
	button:null,
	
	getRootNode:function(id) {
		this.buttonId = id + '_repeat_button';
		var thisClass = this;
		this.button = new Button(this.buttonId,'repeatButton',function(event) { thisClass.repeatButtonClick() });
		return this.button;
	},
	
	getWidth:function() {
		return 50;
	},
	
	setLeftPosition:function(left) {
		this.button.domElement.style.left = left + 'px';
		this.button.domElement.style.position = 'absolute';
	},
	
	repeatButtonClick:function() {
		var currentTime = paella.player.videoContainer.currentTime();
		var start = paella.player.videoContainer.trimStart();
		var end = paella.player.videoContainer.trimEnd();
		var duration = paella.player.videoContainer.duration();
		if (paella.player.videoContainer.trimEnabled()) {
			duration = end - start;			
		}
		currentTime = currentTime - start - 30;
		var seekTo = currentTime * 100 / duration;
		$(document).trigger(paella.events.seekTo,{newPositionPercent:seekTo});
	},
	
	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},

	getIndex:function() {
		return 2;
	},
	
	getName:function() {
		return "RepeatButtonPlugin";
	},
	
	getMinWindowSize:function() {
		return 500;
	}
});

new paella.plugins.RepeatButtonPlugin();

paella.plugins.SearchPlugin  = Class.create(paella.TabBarPlugin,{
	id:null,
	divRoot:null,
	divSearchBar:null,
	divLoading:null,
	divResults:null,
	divSearchBarRelevance:null,
	
	getIndex:function() {
		return 100;
	},
	
	getTabName:function() {
		return "Search";
	},
	
	getRootNode:function(id) {
		this.id = id + 'searchPlugin';
		this.divRoot = new DomNode('div',this.id ,{display:'block'});

		this.divLoading = new DomNode('div',this.id+"_loading" ,{display:'none'});		
		this.divResults = new DomNode('div',this.id+"_results" ,{display:'block'});		
		this.prepareSearchBar();
		
		this.divRoot.addNode(this.divSearchBar);
		this.divRoot.addNode(this.divLoading);
		this.divRoot.addNode(this.divResults);
		
		return this.divRoot;
	},
	
	prepareSearchBar:function(){
		var thisClass = this;
		
		this.divSearchBar = new DomNode('div',this.id+"_searchbar" ,{display:'block'});		

		var divSearchBarLeft = new DomNode('div',this.id+"_searchbar_left" ,{display:'block', float: 'left'});	
		var divSearchBarRight = new DomNode('div',this.id+"_searchbar_right" ,{display:'block', float:'right', margin:'5px 10px'});

		// -------  Left
		var inputElement = new DomNode('input', this.id+"_input", {});
		inputElement.domElement.type = "text";
		inputElement.domElement.value = "Search this recording";
		inputElement.domElement.size = "30";
		inputElement.domElement.onfocus = function(){this.value=""; this.onfocus=undefined};
		inputElement.domElement.onkeyup = function(){thisClass.doSearch(this.value);};	
		
		divSearchBarLeft.addNode(inputElement);
		// -------  Right
		this.divSearchBarRelevance = new DomNode('div',this.id+"_searchbar_right_revelance" ,{display:'none'});
		var r1 = new DomNode('div',this.id+"_searchbar_right_text" ,{display:'inline'});
		var r2 = new DomNode('div',this.id+"_searchbar_right_lt30" ,{display:'inline', backgroundColor: '#C0C0C0'});
		var r3 = new DomNode('div',this.id+"_searchbar_right_lt70" ,{display:'inline', backgroundColor: '#ADD8E6'});
		var r4 = new DomNode('div',this.id+"_searchbar_right_gt70" ,{display:'inline', backgroundColor: '#90EE90'});
		r1.domElement.innerHTML = "Search Relevance: ";
		r2.domElement.innerHTML = "&lt; 30%";
		r3.domElement.innerHTML = "&lt; 70%";
		r4.domElement.innerHTML = "&gt; 70%";
		
		r2.domElement.className="searchPlugin_searchBar_revelanceInfo"
		r3.domElement.className="searchPlugin_searchBar_revelanceInfo"
		r4.domElement.className="searchPlugin_searchBar_revelanceInfo"
		
		this.divSearchBarRelevance.addNode(r1);
		this.divSearchBarRelevance.addNode(r2);
		this.divSearchBarRelevance.addNode(r3);
		this.divSearchBarRelevance.addNode(r4);
		divSearchBarRight.addNode(this.divSearchBarRelevance);
		
		this.divSearchBar.addNode(divSearchBarLeft);
		this.divSearchBar.addNode(divSearchBarRight);
	},
	
	doSearch:function(value) {
		var thisClass = this;
		this.divSearchBarRelevance.domElement.style.display="block";
		this.setLoading(true);
		
		var restEndpoint = paella.player.config.restServer.url + "search/episode.json"; 		
		new paella.Ajax(restEndpoint,{id:paella.matterhorn.episode.id, q:value}, function(response) {
			paella.debug.log("Searching id="+paella.matterhorn.episode.id+ " q=" + value);
			
			thisClass.divResults.domElement.innerHTML='Results for "'+value+'" (no actual results for "'+value+'" found)'			
			
			thisClass.setLoading(false);
		}, paella.player.config.proxyLoader.url, paella.player.config.proxyLoader.usejsonp);
	},
	
	setLoading:function(b) {
		if (b == true){
			this.divLoading.domElement.style.display="block";
			this.divResults.domElement.style.display="none";
		}
		else{
			this.divLoading.domElement.style.display="none";
			this.divResults.domElement.style.display="block";
		}
	}
});

new paella.plugins.SearchPlugin();

paella.plugins.events.serieEpisodes = {
	infoLoaded: 'serieEpisodes:infoLoaded'
}

paella.plugins.SerieEpisodesPlugin = Class.create(paella.RightBarPlugin,{
	id:null,
	serieId:null,
	divRoot:null,
	serie: { numTotal:-1, numPublished:0, numNoPublished:0,  numPending:0,  episodes:[] },
	
	
	getRootNode:function(id) {
		var thisClass = this;
		this.id = id + 'serieEpisodesPlugin';
		this.divRoot = new DomNode('div',this.id ,{display:'block'});
		// TODO: Create a loading image!!!
		$(document).bind(paella.plugins.events.serieEpisodes.infoLoaded,function() {
			thisClass.showEpisodes();
		});
		this.showEpisodesAllowed();
		
		return this.divRoot;
	},
	
	showEpisodesAllowed: function() {
		this.retrieveEpisodes();
	},
	
	retrieveEpisodes:function() {
		var thisClass = this
		this.serieId = paella.matterhorn.series.serie.dcIsPartOf;
		paella.debug.log("Getting Episodes from serie " + this.serieId);
		var restEndpoint = paella.player.config.restServer.url + "search/episode.json"; 
		new paella.Ajax(restEndpoint,{sid:this.serieId, limit:100, offset:0,_:new Date().getTime()}, function(response) {
			if (typeof(response)=="string") {
				response = JSON.parse(response);
			}
			results = response["search-results"];
			thisClass.serie.numTotal = results.total;

			var num = results.limit;
			if (num == 1){
				thisClass.checkPublished(results.result);
			}
			else {
				for (var i = 0; i < num; i++){
					thisClass.checkPublished(results.result[i]);
				}
			}
		}, paella.player.config.proxyLoader.url, paella.player.config.proxyLoader.usejsonp);
	},
	
	checkPublished:function(episode) {
		var thisClass = this		
		var restEndpoint = paella.player.config.restServer.url +  'annotation/annotations.json'		
		new paella.Ajax(restEndpoint,{episode:episode.id, type:"trim"}, function(response) {
			if (typeof(response)=="string") {
				response = JSON.parse(response);
			}
			published = true;
			if (response && response.annotations)
				published = response.annotations.annotation.value;
			thisClass.appendEpisode(episode, published);			
		}, paella.player.config.proxyLoader.url, paella.player.config.proxyLoader.usejsonp);
	},	
	
	appendEpisode:function(episode, isPublished) {
		var temp = {};
		temp.title = episode.dcTitle;
		temp.creator = episode.dcCreator;
		temp.created = episode.dcCreated;
		temp.id = episode.id;
		temp.start = episode.mediapackage.start;
		temp.isPublished = isPublished;

		var presentationPreview = undefined;
		var presenterPreview = undefined;
		var numAttachments = episode.mediapackage.attachments.attachment.length;
		for(var i = 0; i < numAttachments; i++) {
			var type = episode.mediapackage.attachments.attachment[i].type;
			var url = episode.mediapackage.attachments.attachment[i].url;
			if (type == "presentation/search+preview") {
				presentationPreview = url;
			}
			else if (type == "presenter/search+preview") {
				presenterPreview = url;
			}
		}

		temp.preview = presenterPreview;
		if (temp.preview == undefined) {
			temp.preview = presentationPreview;
		}
		
		this.serie.episodes.push(temp);

		if (isPublished == true) {
			this.serie.numPublished = this.serie.numPublished + 1;
		}
		else if (isPublished == "undefined") {
			this.serie.numPending = this.serie.numPending + 1;
		}
		else{
			this.serie.numNoPublished = this.serie.numNoPublished + 1;
		}

		if ((this.serie.numTotal != -1) && (this.serie.numPublished + this.serie.numNoPublished + this.serie.numPending == this.serie.numTotal)) {
			this.serie.episodes.sort( function(a,b) {
				var yearA  = parseInt( a.start.substring(0,4) ); 
				var monA = parseInt( a.start.substring(5,7) ) - 1; 
				var dayA  = parseInt( a.start.substring(8,10) );
				var hourA  = parseInt( a.start.substring(11,13) );
				var minA  = parseInt( a.start.substring(14,16) );
				var dateA = Date.UTC(yearA, monA, dayA, hourA, minA, 0, 0);

				var yearB  = parseInt( b.start.substring(0,4) ); 
				var monB = parseInt( b.start.substring(5,7) ) - 1; 
				var dayB  = parseInt( b.start.substring(8,10) );
				var hourB  = parseInt( b.start.substring(11,13) );
				var minB  = parseInt( b.start.substring(14,16) );
				var dateB = Date.UTC(yearB, monB, dayB, hourB, minB, 0, 0);
				return dateB - dateA;
			});
		
			$(document).trigger(paella.plugins.events.serieEpisodes.infoLoaded);
		}
	},
	
	showEpisodes:function() {				
		for (var i = 0; i < this.serie.numTotal; i++) {
			if( (paella.matterhorn.access.write == true) || (this.serie.episodes[i].isPublished == true)  || (this.serie.episodes[i].isPublished == "undefined") ) {				
				this.showEpisode(i);
			}
			else{
				paella.debug.log("Hide episode " + this.serie.episodes[i].id);
				
			}
		}		
	},
	
	showEpisode:function(index) {		
		var episode = this.serie.episodes[index];
		
		var item = new DomNode('div',this.id+"_"+episode.id ,{display:'block', padding:'5px'});
		var classEpisodeColor = undefined;
		
		if (episode.isPublished === "undefined") {
			//item.domElement.style.backgroundColor = "rgb(255,204,102)";
			classEpisodeColor = "SerieEpisodesPlugin_Episode_Pending";
		}
		else if (episode.isPublished === false) {
			//item.domElement.style.backgroundColor = "rgb(255,165,161)";
			classEpisodeColor = "SerieEpisodesPlugin_Episode_NotPublished";
		}
		else {
			classEpisodeColor = "SerieEpisodesPlugin_Episode_Published";
		}
		
		if (index % 2 == 1) {
			classEpisodeColor = classEpisodeColor + " odd";
			//item.domElement.style.backgroundColor = "#F7FBFC";
		}
		else{
			classEpisodeColor = classEpisodeColor + " even";
			//item.domElement.style.backgroundColor = "#EFF7F9";
		}
		
		item.domElement.className = "SerieEpisodesPlugin_Episode " + classEpisodeColor ;
		
		var item_left = new DomNode('div',this.id+"_"+episode.id+"_left" ,{display:'block'});
		var item_right = new DomNode('div',this.id+"_"+episode.id+"_right" ,{display:'block'});
		item_left.domElement.className= "SerieEpisodesPlugin_Episode_Left";
		item_right.domElement.className= "SerieEpisodesPlugin_Episode_Right";
		
		// Left Node
		var thumbLink = new DomNode('a', this.id+"_"+episode.id+"_left_a");
		thumbLink.domElement.target= "_top";
		thumbLink.domElement.href = "?id=" + episode.id;		

		var thumbImg = new DomNode('img', this.id+"_"+episode.id+"_left_img");
		thumbImg.domElement.src = episode.preview;		

		thumbLink.addNode(thumbImg);
		item_left.addNode(thumbLink);
				
		// Right Node
		var title = new DomNode('div', this.id+"_"+episode.id+"_right_title");
		
		var titleB = new DomNode('b', this.id+"_"+episode.id+"_right_title");
		var titleLink = new DomNode('a', this.id+"_"+episode.id+"_left_a");
		titleLink.domElement.target= "_top";
		titleLink.domElement.href = "?id=" + episode.id;		
		
		if (episode.isPublished === "undefined") {
			titleLink.domElement.innerHTML = episode.title + " (PENDING)"
		}
		else if (episode.isPublished == false) {
			titleLink.domElement.innerHTML = episode.title + " (NO PUBLISHED)"
		} 
		else {
			titleLink.domElement.innerHTML = episode.title
		}
		title.addNode(titleLink);

		var author = new DomNode('div', this.id+"_"+episode.id+"_right_author");
		author.domElement.innerHTML = "by " + episode.creator;

		
		var timeDate = new DomNode('div', this.id+"_"+episode.id+"_right_date");
		timeDate.innerHTML = episode.created;
		if (episode.created) {
			var sd = new Date();
			sd.setFullYear(parseInt(episode.created.substring(0, 4), 10));
			sd.setMonth(parseInt(episode.created.substring(5, 7), 10) - 1);
			sd.setDate(parseInt(episode.created.substring(8, 10), 10));
			sd.setHours(parseInt(episode.created.substring(11, 13), 10));
			sd.setMinutes(parseInt(episode.created.substring(14, 16), 10));
			sd.setSeconds(parseInt(episode.created.substring(17, 19), 10));
			timeDate.domElement.innerHTML = sd.toLocaleString();
		}
		else {
			timeDate.domElement.innerHTML = "n.a.";
		}
		
		title.domElement.className = "SerieEpisodesPlugin_Episode_Title"
		author.domElement.className = "SerieEpisodesPlugin_Episode_Author"
		timeDate.domElement.className = "SerieEpisodesPlugin_Episode_Date"
		
		item_right.addNode(title);		
		item_right.addNode(author);
		item_right.addNode(timeDate);
		
		
		item.addNode(item_left);
		item.addNode(item_right);
		
		this.divRoot.addNode(item);		
	}
	
});

paella.plugins.SerieEpisodesPluginInstance = new paella.plugins.SerieEpisodesPlugin();



paella.plugins.SerieEpisodesInfoPlugin = Class.create(paella.TabBarPlugin,{
	id:null,
	divRoot:null,
	
	getIndex:function() {
		return 20;
	},

	getTabName:function() {
		return "Serie's Videos Statistics";
	},
	
	checkEnabled:function(onSuccess) {
		onSuccess(paella.matterhorn.access.write);
	},	
	
	getRootNode:function(id) {
		this.id = id + 'serieEpisodesInfoPlugin';
		this.divRoot = new DomNode('div',this.id ,{display:'block'});
		this.divRoot.domElement.className = "serieEpisodesInfoPlugin";
		// TODO: Create a loading image!!!		
		this.showInfoEpisodesSecure();
		return this.divRoot;
	},
	
	showInfoEpisodesSecure:function() {
		var thisClass = this;
		if (paella.plugins.SerieEpisodesPluginInstance.serie.numTotal == -1){
			$(document).bind(paella.plugins.events.serieEpisodes.infoLoaded,function() {
				thisClass.showInfoEpisodes();
			});	
		}
		else {
			thisClass.showInfoEpisodes();
		}		
	},
	
	showInfoEpisodes:function() {
		var info = new DomNode('div',this.id+"_info" ,{display:'block', padding:'1em 1.4em'});
		var numTotal = new DomNode('div',this.id+"_npub" ,{display:'block'});
		var numPub = new DomNode('div',this.id+"_npub" ,{display:'block'});
		var numNoPub = new DomNode('div',this.id+"_npub" ,{display:'block'});
		var numPending = new DomNode('div',this.id+"_npub" ,{display:'block'});
		
		numTotal.domElement.innerHTML = 'Num. Total Videos: <span style="color:grey;">' + paella.plugins.SerieEpisodesPluginInstance.serie.numTotal +'</span>';
		numPub.domElement.innerHTML = 'Num. Published Videos: <span style="color:grey;">' + paella.plugins.SerieEpisodesPluginInstance.serie.numPublished+'</span>';
		numNoPub.domElement.innerHTML = 'Num. No Published Videos: <span style="color:grey;">' + paella.plugins.SerieEpisodesPluginInstance.serie.numNoPublished+'</span>';
		numPending.domElement.innerHTML = 'Num. Pending Videos: <span style="color:grey;">' + paella.plugins.SerieEpisodesPluginInstance.serie.numPending+'</span>';
		
		info.addNode(numTotal);	
		info.addNode(numPub);	
		info.addNode(numNoPub);	
		info.addNode(numPending);	
		
		this.divRoot.addNode(info);			
	}
});

new paella.plugins.SerieEpisodesInfoPlugin();



paella.plugins.SocialPlugin = Class.create(paella.PlaybackPopUpPlugin,{
	socialContainer:null,
	container:null,
	button:null,
	rightPosition:0,

	getRootNode:function(id) {
		var thisClass = this;
		this.button = new Button(id + '_social_button','showSocialButton',function(event) { thisClass.showSocialPress(); },true);
		return this.button;
	},
	
	getWidth:function() {
		return 45;
	},
	
	setRightPosition:function(position) {
		this.button.domElement.style.right = position + 'px';
		this.rightPosition = position;
	},
	
	getPopUpContent:function(id) {
		var thisClass = this;
		this.socialContainer = new DomNode('div',id + '_social_container',{display:'none'});
		this.socialContainer.addNode(new Button(id + '_social_facebook_button','socialButtonFacebook',function(event) { thisClass.facebookPress(); }));
		this.socialContainer.addNode(new Button(id + '_social_twitter_button','socialButtonTwitter',function(event) { thisClass.twitterPress(); }));
		this.socialContainer.domElement.style.right = this.rightPosition + 'px';
		return this.socialContainer;
	},

	showSocialButton:function() {
		return this.button;
	},
	
	showSocialPress:function() {
		if (this.showSocialButton().isToggled()) {
			$(this.socialContainer.domElement).show();
		}
		else {
			$(this.socialContainer.domElement).hide();
		}
	},
	
	facebookPress:function() {
		var url = this.getVideoUrl()
		window.open('http://www.facebook.com/sharer.php?u=' + url);
	},
	
	twitterPress:function() {
		var url = this.getVideoUrl();
		window.open('http://twitter.com/home?status=' + url);
	},
	
	getVideoUrl:function() {
		var url = document.location.href;
		return url;
	},
	
	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},
	
	getIndex:function() {
		return 102;
	},
	
	getName:function() {
		return "SocialPlugin";
	}
});

new paella.plugins.SocialPlugin();

paella.plugins.userTrackingViewerPlugIn = Class.create(paella.PlaybackPopUpPlugin,{
	container:null,
	button:null,
	rightPosition:0,
	sparklineLoaded:false,
	isVisible:false,
	footprintData:[],
	footprintTimer:null,
	

	getRootNode:function(id) {
		var thisClass = this;
		$(window).resize(function(event) { thisClass.onResize(); });
		jQuery.getScript('javascript/jquery.sparkline.min.js', function(){
			sparklineLoaded = true;
		});
		this.button = new Button(id + '_showuserviewstats_button','showUserViewStatsButton',function(event) { thisClass.onButtonPress(); },true);
		return this.button;
	},
	
	setRightPosition:function(position) {
		this.button.domElement.style.right = position + 'px';
		this.rightPosition = position;
	},

	getWidth:function() {
		return 45;
	},
		
	getPopUpContent:function(id) {				
		this.container = new DomNode('div',id + '_showuserviewstats_container',{display:'none', width:'100%'});
		this.container.domElement.innerHTML = "Loading statistics...";
		return this.container;
	},

	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},
	
	getIndex:function() {
		return 1002;
	},
	
	getName:function() {
		return "userTrackingViewerPlugIn";
	},
		
	onResize:function() {
		var playback = paella.player.controls.playbackControl();
		var bar = playback.playbackBar().domElement;						
		this.container.domElement.style.left = $(bar).position().left+ "px";
		this.container.domElement.style.width = $(bar).width() + "px";
		if (this.isVisible == true){
			this.drawFootprints();
		}
	},
	
	onButtonPress:function() {
		if (this.button.isToggled()) {			
			this.onResize();
			$(this.container.domElement).show();
			this.isVisible = true;
			this.startFootprintTimer();
			this.loadFootprints();			
		}
		else {
			$(this.container.domElement).hide();
			this.isVisible = false;
			this.pauseFootprintTimer();
		}
	},

	startFootprintTimer:function() {
		var thisClass = this;
		this.footprintTimer = new paella.utils.Timer(function(timer) {
			thisClass.loadFootprints();
			},5000);
		this.footprintTimer.repeat = true;		
	},
	
	pauseFootprintTimer:function() {
		if (this.footprintTimer!=null) {
			this.footprintTimer.cancel();
			this.footprintTimer = null;
		}		
	},	
	
	drawFootprints:function () {
		if (sparklineLoaded == true)  {
			paella.debug.log("ShowUserViewStats Plugin: sparkline loaded, drawing foot prints");			
			$(this.container.domElement).sparkline(this.footprintData, {
				type: 'line',
				spotRadius: '0',
				width: '100%',
				height: '25px'
			});
		}
		else {
			paella.debug.log("ShowUserViewStats Plugin: No sparkline loaded");
		}
	},
	
	loadFootprints:function () {
		var thisClass = this;
		var restEndpoint = paella.player.config.restServer.url + "usertracking/footprint.json"; 
		new paella.Ajax(restEndpoint,{id:paella.player.videoIdentifier}, function(response) {		
			var json_ret = response;
			if (typeof(json_ret)=="string") {
				json_ret = JSON.parse(json_ret);
			}
			var duration = Math.floor(paella.player.videoContainer.duration());
			var trimStart = Math.floor(paella.player.videoContainer.trimStart());
			
			if (!isNaN(duration) && (typeof(duration) == 'number') && (duration > 0) ){
				thisClass.footprintData = new Array(duration);
				for (var i = 0; i < thisClass.footprintData.length; i++)
					thisClass.footprintData[i] = 0;				
				
				var fps = json_ret.footprints.footprint;
				if (json_ret.footprints.total == "1"){
					fps = [json_ret.footprints.footprint];
				}
				var lastPosition = -1;
				var lastViews = 0;
				for (var i = 0; i < fps.length; i++) {
					position = fps[i].position - trimStart;
					if (position < duration){
						views = fps[i].views;
						
						if (position - 1 != lastPosition){
							for (var j = lastPosition + 1; j < position; j++) {
								thisClass.footprintData[j] = lastViews;
							}
						}
						thisClass.footprintData[position] = views;
						lastPosition = position;
						lastViews = views;
					}
				}
								
				thisClass.drawFootprints();
			}
		}, paella.player.config.proxyLoader.url, paella.player.config.proxyLoader.usejsonp);		
	},
	
});

new paella.plugins.userTrackingViewerPlugIn();



paella.plugins.events.userTrackingCollector = {
	logEvent:'userTrackingCollector:logEvent'
};

paella.plugins.userTrackingCollectorPlugIn = Class.create(paella.EventDrivenPlugin,{
	INTERVAL_LENGTH:5,
	detailedLogging:false,
	inPosition:0,
	outPosition:0,
	heartbeatTimer:null,

	initPlugin:function() {
		var thisClass = this;
		var restEndpoint = paella.player.config.restServer.url + "usertracking/detailenabled"; 		
		new paella.Ajax(restEndpoint,{}, function(response) {
			if (response === 'true') {
				thisClass.detailedLogging = true;
				thisClass.heartbeatTimer = new Timer(function(timer) {thisClass.addEvent('HEARTBEAT'); }, 30000);
				thisClass.heartbeatTimer.repeat = true;
				//--------------------------------------------------
				$(window).resize(function(event) { thisClass.onResize(); });
			}
		}, paella.player.config.proxyLoader.url, paella.player.config.proxyLoader.usejsonp);
	},
	
	getEvents:function() {
		return [paella.events.loadComplete,
				paella.events.play,
				paella.events.pause,
				paella.events.seekTo,
				paella.events.seekToTime,
				paella.events.timeUpdate,
				paella.plugins.events.userTrackingCollector
		];
	},
	
	onEvent:function(eventType,params) {
		var currentTime = paella.player.videoContainer.currentTime();

		switch (eventType) {
			case paella.events.loadComplete:
				this.initPlugin();
				break;
			case paella.events.play:
				this.addEvent('PLAY');
				break;
			case paella.events.pause:
				this.addEvent('PAUSE');
				break;
			case paella.events.seekTo:
			case paella.events.seekToTime:
				this.addEvent('SEEK');
				break;
			case paella.events.timeUpdate:
				this.onTimeUpdate();
				break;
			case paella.plugins.events.userTrackingCollector:
				//document.fire(paella.plugins.events.userTrackingCollector, {profileName:profileName});
				var eventName = params.eventName;
				if (eventName != undefined) {
					this.addEvent(eventName);
				}
				else {
					paella.debug.log("Warning: eventName parameter nof found. Review your code");
				}
				break;
		}
	},
	
	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},
	
	getIndex:function() {
		return 1010;
	},
	
	getName:function() {
		return "userTrackingCollectorPlugIn";
	},
	
	onResize:function() {
		var w = $(window);
		var label = "RESIZE-TO-"+w.width()+"x"+w.height();
		this.addEvent(label);
	},
	
	onTimeUpdate:function() {
		var videoCurrentTime = Math.round(paella.player.videoContainer.currentTime() + paella.player.videoContainer.trimStart());		
		if (this.inPosition <= videoCurrentTime && videoCurrentTime <= this.inPosition + this.INTERVAL_LENGTH) {
			this.outPosition = videoCurrentTime;
			if (this.inPosition + this.INTERVAL_LENGTH === this.outPosition) {
				this.addEvent("FOOTPRINT");
				this.inPosition = this.outPosition;
			}			
		}
		else {
			this.addEvent("FOOTPRINT");
			this.inPosition = videoCurrentTime;			
			this.outPosition = videoCurrentTime;			
		}
	},
			
	addEvent: function(eventType) {
		if (this.detailedLogging) {
			var videoCurrentTime = paella.player.videoContainer.currentTime() + paella.player.videoContainer.trimStart();
			
			var thisClass = this;
			var restEndpoint = paella.player.config.restServer.url + "usertracking/"; 
			//paella.debug.log("Logging event: " + eventType + "("+this.inPosition + ", " + this.outPosition +")");
			
			new paella.Ajax(restEndpoint,{
					_method: 'PUT',
					id:paella.player.videoIdentifier,
					type:eventType,
					in:this.inPosition,
					out:this.outPosition
				}, function(response) {
			}, paella.player.config.proxyLoader.url, paella.player.config.proxyLoader.usejsonp);			
		}
	}
	
});

new paella.plugins.userTrackingCollectorPlugIn();


var ProfileItemButton = Class.create(DomNode,{
	viewModePlugin:null,

	initialize:function(icon,profileName,viewModePlugin) {
		this.parent('div',profileName + '_button',{display:'block',backgroundImage:'url(' + icon + ')',width:'78px',height:'41px'});
		this.viewModePlugin = viewModePlugin;

		var thisClass = this;
		$(this.domElement).click(function(event) {
			var currentProfileName = paellaPlayer.selectedProfile;
			if (profileName!=currentProfileName) {
				var currentButtonId = currentProfileName + '_button';
				var currentButton = $('#' + currentButtonId);
				$(currentButton).css({'background-position':'0px 0px'});
				var newButtonId = profileName + '_button';
				var newButton = $('#' + newButtonId);
				$(newButton).css({'background-position':'-78px 0px'});
//				paellaPlayer.setProfile(profileName);
				$(document).trigger(paella.events.setProfile,{profileName:profileName});
				if (thisClass.viewModePlugin) {
					$(thisClass.viewModePlugin.viewModeContainer.domElement).hide();
					thisClass.viewModePlugin.button.toggle();
				}
			}
		});
	}
});

paella.plugins.ViewModePlugin = Class.create(paella.PlaybackPopUpPlugin,{
	viewModeContainer:'',
	button:'',

	getRootNode:function(id) {
		var thisClass = this;
		this.button = new Button(id + '_view_mode_button','showViewModeButton',function(event) { thisClass.viewModePress(); },true);
		return this.button;
	},
	
	getWidth:function() {
		return 45;
	},
	
	setRightPosition:function(position) {
		this.button.domElement.style.right = position + 'px';
	},
	
	getPopUpContent:function(id) {
		var thisClass = this;
		this.viewModeContainer = new DomNode('div',id + '_viewmode_container',{display:'none'});
		paella.Profiles.loadProfileList(function(profiles) {
			for (var profile in profiles) {
				var profileData = profiles[profile];
				var imageUrl = 'config/profiles/resources/' + profileData.icon;
				thisClass.viewModeContainer.addNode(new ProfileItemButton(imageUrl,profile,thisClass));

				// Profile icon preload
				var image = new Image();
				image.src = imageUrl;
			}
		});
		return this.viewModeContainer;
	},
	
	viewModePress:function() {
		if (this.button.isToggled()) {
			$(this.viewModeContainer.domElement).show();
		}
		else {
			$(this.viewModeContainer.domElement).hide();
		}
	},
	
	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},
	
	getIndex:function() {
		return 101;
	},
	
	getName:function() {
		return "ViewModePlugin";
	},
	
	getMinWindowSize:function() {
		return 500;
	}
});

new paella.plugins.ViewModePlugin();

