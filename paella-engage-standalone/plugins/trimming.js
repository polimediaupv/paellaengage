paella.plugins.trimming = {classes:{}, instances:{} };


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Loader Trimming Plugin
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
paella.plugins.trimming.classes.TrimmingLoaderPlugin = Class.create(paella.EventDrivenPlugin,{
	
	getName:function() {
		return "TrimmingPlayerPlugin";
	},

	checkEnabled:function(onSuccess) {
		onSuccess(paella.player.config.trimming && paella.player.config.trimming.enabled);
	},
		
	getEvents:function() {
		return [paella.events.loadComplete];
	},

	onEvent:function(eventType,params) {
		switch (eventType) {
			case paella.events.loadComplete:
				this.loadTrimming();
				break;
		}
	},	
	
	loadTrimming:function() {
		var thisClass = this;
		var loader = new paella.matterhorn.LoaderSaverInfo(paella.player.config);
		loader.loadData(paella.player.videoIdentifier, "paella/trimming", function(response){			
			if (typeof(response)=="string") {
			    try{
					response = JSON.parse(response);
				}
				catch(e) {response = null;}
			}	
			if (response){
				paella.player.videoContainer.enableTrimming();
				paella.player.videoContainer.setTrimming(response.trimming.start, response.trimming.end);			
			}
			else{
				thisClass.loadOldTrimming();				
			}
		}, function(){
			thisClass.loadOldTrimming();
		});	
	},
	
	loadOldTrimming:function() {
		if (paella.player.videoIdentifier) {
			var annotationService = new paella.matterhorn.AnnotationService(paella.player.config);
		
			annotationService.getAnnotations(paella.player.videoIdentifier, "trim", 1, 0, function(response){
				if (typeof(response)=="string") {
					try {
						response = JSON.parse(response);
					}
					catch(e) {response=null;}
				}
				if(response){
					var trimStart = 0;
					var trimEnd = 0;
					if (response && response.total>0) {
						trimStart = response.annotation.inpoint / 1000;
						trimEnd = response.annotation.outpoint / 1000;
					}
					if (trimEnd!=0) {
						paella.player.videoContainer.enableTrimming();
						paella.player.videoContainer.setTrimming(trimStart, trimEnd);
					}
					
				}
			});
		}
	},
	
	saveTrimming:function(episodeId, onSuccess, onError) {
		var saver = new paella.matterhorn.LoaderSaverInfo(paella.player.config);
		var value = '{"trimming":{"start":'+paella.player.videoContainer.trimming.start+', "end":'+paella.player.videoContainer.trimming.end+'}}';
		saver.saveData(episodeId, "paella/trimming", value, onSuccess, onError);		
	}
});

paella.plugins.trimming.instances.trimmingLoaderPlugin = new paella.plugins.trimming.classes.TrimmingLoaderPlugin();



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Editor Trimming Plugin
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
paella.plugins.trimming.classes.TrimmingTrackPlugin = Class.create(paella.editor.MainTrackPlugin,{
	trimmingTrack:null,
	trimmingBackup:{s:0,e:0},


	getTrackItems:function() {
		if (this.trimmingTrack==null) {
			this.trimmingTrack = {id:1,s:0,e:0};
			this.trimmingTrack.s = paella.player.videoContainer.trimStart();
			this.trimmingTrack.e = paella.player.videoContainer.trimEnd();
			this.trimmingBackup.s = this.trimmingTrack.s;
			this.trimmingBackup.e = this.trimmingTrack.e;
		}		
		var tracks = [];
		tracks.push(this.trimmingTrack);
		return tracks;
	},
		
	getName:function() {
		return "TrimmingTrackPlugin";
	},
	
	getTrackName:function() {
		return paella.dictionary.translate("Trimming");
	},
	
	getColor:function() {
		return 'rgb(0, 51, 107)';
	},
	
	checkEnabled:function(isEnabled) {
		isEnabled(paella.player.config.trimming && paella.player.config.trimming.enabled);
	},
	
	onSave:function(onDone) {	
		paella.player.videoContainer.setTrimmingStart(this.trimmingTrack.s);
		paella.player.videoContainer.setTrimmingEnd(this.trimmingTrack.e);
		
		paella.plugins.trimming.instances.trimmingLoaderPlugin.saveTrimming(paella.player.videoIdentifier, function(){onDone(true);}, function(){onDone(false)});
	},
	
	onDiscard:function(onDone) {
		this.trimmingTrack.s = this.trimmingBackup.s;
		this.trimmingTrack.e = this.trimmingBackup.e;
		onDone(true);
	},
	
	allowDrag:function() {
		return false;
	},
	
	onTrackChanged:function(id,start,end) {
		this.trimmingTrack.s = start;
		this.trimmingTrack.e = end;
	},

	contextHelpString:function() {
		// TODO: Implement this using the standard paella.dictionary class
		if (paella.utils.language()=="es") {
			return "Utiliza la herramienta de recorte para definir el instante inicial y el instante final de la clase. Para cambiar la duración solo hay que arrastrar el inicio o el final de la pista \"Recorte\", en la linea de tiempo.";
		}
		else {
			return "Use this tool to define the start and finish time.";
		}
	}
});

paella.plugins.trimming.instances.trimmingTrackPlugin = new paella.plugins.trimming.classes.TrimmingTrackPlugin();


