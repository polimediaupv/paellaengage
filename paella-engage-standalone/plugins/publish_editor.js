paella.plugins.publish = {classes:{}, instances:{} };


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Loader Publish Plugin
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
paella.plugins.publish.classes.PublishLoaderPlugin = Class.create(paella.EventDrivenPlugin,{
	
	getName:function() {
		return "PublishLoaderPlugin";
	},

	checkEnabled:function(onSuccess) {
		var enabled = false;
		try {
			enabled = paella.player.config.publish.enabled;
		}
		catch(e) {enabled = false;}

		onSuccess(enabled);	
	},
		
	getEvents:function() {
		return [paella.events.loadComplete];
	},

	onEvent:function(eventType,params) {
		switch (eventType) {
			case paella.events.loadComplete:
				this.loadPublish();
				break;
		}
	},	
	
	loadPublish:function() {
		var thisClass = this;
		var loader = new paella.matterhorn.LoaderSaverInfo(paella.player.config);
		loader.loadData(paella.player.videoIdentifier, "paella/publish", function(response){
			var unloadIfNotPublished = !paella.matterhorn.access.write;
		
			if (unloadIfNotPublished && (response==false || response=="undefined")) {			
				paella.player.unloadAll(paella.dictionary.translate("This video is not published"));
			}
			else {
				paella.player.videoContainer.publishVideo();
			}					
		}, function(){
			thisClass.loadOldPublish();
		});	
	},
	
	loadOldPublish:function() {
		if (paella.player.videoIdentifier) {
			var annotationService = new paella.matterhorn.AnnotationService(paella.player.config);
		
			annotationService.getAnnotations(paella.player.videoIdentifier, "trim", 1, 0, function(response){
				if (typeof(response)=="string") {
					try {
						response = JSON.parse(response);
					}
					catch(e) {response=null;}
				}
				var unloadIfNotPublished = !paella.matterhorn.access.write;
				
				if(response && (response.total==1)){
					if (unloadIfNotPublished && (response.annotation.value==false || response.annotation.value=="undefined")) {
						paella.player.unloadAll(paella.dictionary.translate("This video is not published"));
					}
					else {
						paella.player.videoContainer.publishVideo();
					}					
				}
			});
		}
	},
	
	savePublish:function(episodeId, value, onSuccess, onError) {		
		var saver = new paella.matterhorn.LoaderSaverInfo(paella.player.config);
		saver.saveData(episodeId, "paella/publish", value, onSuccess, onError);
		
	}
});

paella.plugins.publish.instances.publishLoaderPlugin = new paella.plugins.publish.classes.PublishLoaderPlugin();






////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Editor Publish Plugin
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
paella.editor.CheckPublishPlugin = Class.create(paella.editor.EditorToolbarPlugin,{
	status:'-',

	initialize:function() {
		this.parent();
		if (paella.utils.language()=='es') {
			paella.dictionary.addDictionary({
				'Publish':'Publicar',
				'Do not publish':'No publicar',
				'Publish automatically':'Publicar automáticamente'
			});
		}
	},

	checkEnabled:function(onSuccess) {
		var thisClass = this;
		var loader = new paella.matterhorn.LoaderSaverInfo(paella.player.config);
		loader.loadData(paella.player.videoIdentifier, "paella/publish", function(response){
		
			if (response==true){
				thisClass.status = "Publish";
			}
			else if (response==false){
				thisClass.status = "Do not publish";
			}
			else if (response=="undefined"){
				thisClass.status = "Publish automatically";
			}			
		}, function(){});	
		
		onSuccess(paella.player.config.publish && paella.player.config.publish.enabled);
	},
	
	getName:function() {
		return "CheckPublishPlugin";
	},
	
	getButtonName:function() {
		return paella.dictionary.translate(this.status);
	},
	
	getIcon:function() {
		return "icon-share";
	},

	getOptions:function() {
		return [paella.dictionary.translate("Publish"),
				paella.dictionary.translate("Publish automatically"),
				paella.dictionary.translate("Do not publish")];
	},
	
	onOptionSelected:function(optionIndex) {
		switch (optionIndex) {
			case 0:
				this.status = "Publish";
				break;
			case 1:
				this.status = "Publish automatically";
				break;
			case 2:
				this.status = "Do not publish";
				break;
		}
	},
	
	onSave:function(onSuccess) {
		if (this.status != "-") {
			var value="";
			if (this.status == "Publish"){
				value = "true"
			}
			else if (this.status == "Publish automatically"){
				value = "undefined"
			}
			else if (this.status == "Do not publish"){
				value = "false"			
			}
			paella.debug.log("Saving: " + value);
			paella.plugins.publish.instances.publishLoaderPlugin.savePublish(paella.player.videoIdentifier, value, function(){onSuccess(true);}, function(){onSuccess(true)});
		}	
	}
});

paella.editor.checkPublishPlugin = new paella.editor.CheckPublishPlugin();
