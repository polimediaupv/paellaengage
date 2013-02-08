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
		this.container.domElement.innerHTML = "Plugin: Working In Progress";
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
		},'',false,'get');		
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
		},'',false,'GET');
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
			},'',false,'GET');			
		}
	}
	
});

new paella.plugins.userTrackingCollectorPlugIn();
