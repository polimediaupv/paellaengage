paella.plugins.CheckPublish = Class.create(paella.EventDrivenPlugin,{
	infoContainer:null,
	messageContainer:null,
	unpublishedMessage:'this video is not published',
	publishedMessage:'this video is published',
	autopublishMessage:'this video is not published, will be published automatically in seven days from recording day',
	
	getEvents:function() {
		return [paella.events.loadComplete,paella.events.didSaveChanges,paella.events.showEditor,paella.events.hideEditor];
	},
	
	onEvent:function(eventType,params) {
		switch (eventType) {
			case paella.events.loadComplete:
				this.onLoad();
				this.checkPublished();
				break;
			case paella.events.didSaveChanges:
				this.checkPublished();
				break;
			case paella.events.showEditor:
				this.showEditor();
				break;
			case paella.events.hideEditor:
				this.hideEditor();
				break;
		}
	},
	
	onLoad:function() {
		var language = navigator.language || window.navigator.userLanguage;
		if (language && (language.toLowerCase()=='es-es' || language.toLowerCase()=='es')) {
			this.publishedMessage = 'El vídeo está publicado';
			this.unpublishedMessage = 'El video no está publicado';
			this.autopublishMessage = 'Este vídeo no está publicado, se publicará en siete días a partir de la fecha de grabación.';
		}
	},
	
	checkPublished:function() {
		var id = paella.utils.parameters.get('id');
		this.createInfoContainer();
		var trimData = new paella.utils.TrimData(paellaPlayer.config);
		var thisClass = this;
		trimData.load(id,function(trimData) {
			if (trimData.published=="undefined") {
				thisClass.messageContainer.domElement.innerHTML = thisClass.autopublishMessage;
				thisClass.messageContainer.domElement.style.backgroundColor = 'orange';
			}
			else if (!trimData.published) {
				thisClass.messageContainer.domElement.innerHTML = thisClass.unpublishedMessage;
				thisClass.messageContainer.domElement.style.backgroundColor = 'red';
			}
			else {
				thisClass.messageContainer.domElement.innerHTML = thisClass.publishedMessage;
				thisClass.messageContainer.domElement.style.backgroundColor = 'green';					
			}
		})
	},
	
	showEditor:function() {
		this.checkPublished();
		this.showInfoContainer();
	},
	
	hideEditor:function() {
		this.hideInfoContainer();
	},
	
	createInfoContainer:function() {
		if (this.infoContainer==null) {
			var style = {};
			this.infoContainer = new DomNode('div','checkPublishPlugin_editor_info_container',style);
			this.messageContainer = new DomNode('div','checkPublishPlugin_editor_message_container',style);
			this.messageContainer.domElement.innerHTML = '';
			this.infoContainer.addNode(this.messageContainer);
			document.body.appendChild(this.infoContainer.domElement);
			this.hideInfoContainer();
		}
	},
	
	showInfoContainer:function() {
		this.createInfoContainer();
		$(this.infoContainer.domElement).show();
	},
	
	hideInfoContainer:function() {
		$(this.infoContainer.domElement).hide();
	},
	
	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},
	
	getIndex:function() {
		return 1000;
	},
	
	getName:function() {
		return "CheckPublishPlugin";
	}
});

new paella.plugins.CheckPublish();