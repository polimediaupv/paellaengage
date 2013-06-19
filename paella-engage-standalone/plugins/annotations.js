paella.plugins.Annotations = Class.create(paella.EventDrivenPlugin,{
	timer:null,
	annotations:[],
	enabled:false,
	currentAnnotations:[],
	containerId:'paella_plugin_AnnotationsContainer',
	container:null,

	getEvents:function() {
		return [paella.events.loadComplete,paella.events.play,paella.events.pause];
	},
	
	onEvent:function(eventType,params) {
		switch (eventType) {
			case paella.events.loadComplete:
				this.loadComplete();
				break;
			case paella.events.play:
				this.startTimer();
				break;
			case paella.events.pause:
				this.pauseTimer();
				break;
		}
	},
	
	loadComplete:function() {
		var id = paella.utils.parameters.get('id');
		var annotations = paellaPlayer.config.annotations;
		if (annotations.enabled) {
			var annotationsContainer = document.createElement('div');
			annotationsContainer.id = this.containerId;
			annotationsContainer.setAttribute('class',"annotationsContainer");
			var videoContainer = paellaPlayer.player.domElement;
			videoContainer.appendChild(annotationsContainer);
			this.container = annotationsContainer;
			var proxy = paellaPlayer.config.proxyLoader;
			var proxyUrl = '';
			this.enabled = true;
			if (proxy.enabled) {
				proxyUrl = proxy.url;
			}
			var thisClass = this;
			new paella.Ajax(annotations.url,{command:'getAnnotations',videoId:id},
				function(response) {
					if (response.queryResult=='OK') {
						for(var i=0;i<response.annotations.size();++i) {
							var annotation = response.annotations[i];
							thisClass.annotations[annotation.start] = annotation;
						}
					}
				},proxyUrl);
		}
	},
	
	startTimer:function() {
		if (this.enabled) {
			var thisClass = this;
			this.timer = new paella.utils.Timer(function(timer) {
				thisClass.onUpdateAnnotations();
				},1000.0);
			this.timer.repeat = true;	
		}
	},
	
	pauseTimer:function() {
		if (this.timer!=null && this.enabled) {
			this.timer.cancel();
			this.timer = null;
		}
	},
	
	onUpdateAnnotations:function() {
		var time = paellaPlayer.player.videoContainer().currentTime();
		time = Math.round(time);
		var annotation = this.annotations[time];
		if (annotation) {
			this.currentAnnotation = annotation;
		}
		if (this.currentAnnotation) {
			if (time>=this.currentAnnotation.start && time<this.currentAnnotation.end) {
				this.container.innerHTML = this.currentAnnotation.text;
			}
			else {
				this.currentAnnotaiton = null;
				this.container.innerHTML = "";
			}
		}
	},
	
	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},
	
	getIndex:function() {
		return 1000;
	},
	
	getName:function() {
		return "AnnotationsPlugin";
	}
});

new paella.plugins.Annotations();