paella.plugins.recess = {classes:{}, instances:{}, recessTracks:[] };


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Recess Loader
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
paella.plugins.recess.classes.RecessLoader = Class.create({
	
	initialize:function() {
		var thisClass = this;
		$(document).bind(paella.events.loadComplete,function(event,params) {			
			thisClass.loadRecessInfo();
		});		
	},
	
	loadRecessInfo:function() {
		var thisClass = this;
		this.loadAttachmentData(paella.matterhorn.episode.id, "paella/recess", function(data){ 
			paella.plugins.recess.recessTracks = thisClass.xmlToTracks(data);
		});				
	},
	
	saveRecessInfo:function() {
		var commentValue = this.tracksToXML(paella.plugins.recess.recessTracks);
		paella.plugins.recess.instances.recessLoader.saveAttachmentData(paella.matterhorn.episode.id, "paella/recess", commentValue);
	},
	
	tracksToXML:function(tracks) {
		var xml = '<?xml version="1.0" encoding="UTF-8"?>';
		xml = xml + '<tracks>'
	
		for (var i = 0; i<tracks.length; i=i+1) {
			var t = tracks[i];
			xml = xml + '<track id="'+ t.id +'" start="'+ t.s +'" end="'+ t.e +'" />'
		}
		xml = xml + '</tracks>'
		return xml;
	},
	
	xmlToTracks:function(xmlText) {
		var tracks = [];
		var xml = null;
		try {
			xml = $(xmlText);
			var xml_tracks = xml.find("track");
			for (var i=0; i< xml_tracks.length; i++) {		
				var t = xml_tracks[i];
				var t_id = t.getAttribute("id")
				var t_start = t.getAttribute("start")
				var t_end = t.getAttribute("end")
				tracks.push({id:t_id,s:t_start,e:t_end});
			}	
		}
		catch(e){ 
			tracks = [];
		}
		return tracks;
	},
	
	loadAttachmentData:function(episodeid, type, onSuccess, onError){
		var loader = new paella.matterhorn.LoaderSaverInfo(paella.player.config);
		loader.loadData(episodeid, type, onSuccess, onError);
	},
	
	saveAttachmentData:function(episodeid, type, value, onSuccess, onError){
		var saver = new paella.matterhorn.LoaderSaverInfo(paella.player.config);
		saver.saveData(episodeid, type, value, onSuccess, onError);
	}

});

paella.plugins.recess.instances.recessLoader = new paella.plugins.recess.classes.RecessLoader();


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Editor Recess Plugin
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
paella.plugins.recess.classes.RecessTrackPlugin = Class.create(paella.editor.MainTrackPlugin,{
	selectedItem:0,
	

	initialize:function() {
		this.parent();
		var thisClass = this;
		if (paella.utils.language()=='es') {
			var esDict = {
				'Recess':'Descanso',
				'Create':'Añadir',
				'Create a new break in the current position': 'Añade un descanso en el instante actual',
				'Delete':'Borrar',
				'Delete selected break': 'Borra el descanso seleccionado'
			};
			paella.dictionary.addDictionary(esDict);
		}
		
		$(document).bind(paella.events.showEditor ,function(event,params) {			
			thisClass.makeTracksBackup();
		});	
		
		$(document).bind(paella.events.hideEditor ,function(event,params) {
			paella.plugins.recess.recessTracks = paella.plugins.recess.recessTracksBackup;
		});	
		
	},

	makeTracksBackup:function() {
		paella.plugins.recess.recessTracksBackup = jQuery.extend(true, {}, paella.plugins.recess.recessTracks);
	},
		
	getTrackItems:function() {
		return paella.plugins.recess.recessTracks;
	},
	
	getName:function() {
		return "RecessTrackPlugin";
	},
	
	getTrackName:function() {
		return paella.dictionary.translate("Recess");
	},
	
	getColor:function() {
		return 'rgb(212, 51, 97)';
	},
	
	onSelect:function(trackData) {
		this.selectedItem = trackData.id;
	},
	
	onUnselect:function() {
		this.selectedItem = 0;
	},
	
	onDblClick:function(trackData) {
	},
	
	getTools:function() {
		return [
			{name:'create',label:paella.dictionary.translate('Create'),hint:paella.dictionary.translate('Create a new break in the current position')},
			{name:'delete',label:paella.dictionary.translate('Delete'),hint:paella.dictionary.translate('Delete selected break')},
			{name:'lock',label:paella.dictionary.translate('Lock'),hint:paella.dictionary.translate('Lock selected break')},
			{name:'unlock',label:paella.dictionary.translate('Unlock'),hint:paella.dictionary.translate('Unlock selected break')}
		];
	},
	
	onTrackChanged:function(id,start,end) {
		var item = this.getItem(id);
		if (item) {
			item.s = start;
			item.e = end;
		}
	},

	onToolSelected:function(toolName) {
		var selectedTrackIndex = this.getSelectedItemIndex();
		if (toolName=='delete' && selectedTrackIndex!=-1) {
			if (!paella.plugins.recess.recessTracks[selectedTrackIndex].lock) {
				paella.plugins.recess.recessTracks.splice(selectedTrackIndex,1);
			}
			return true;
		}
		else if (toolName=='create') {
			var start = paella.player.videoContainer.currentTime();
			var end = start + 60;
			var id = this.getTrackUniqueId();
			paella.plugins.recess.recessTracks.push({id:id,s:start,e:end,content:paella.dictionary.translate('Recess')});
			return true;
		}
		else if (toolName=='lock') {
			paella.plugins.recess.recessTracks[selectedTrackIndex].lock = true;
			return true;
		}
		else if (toolName=='unlock') {
			paella.plugins.recess.recessTracks[selectedTrackIndex].lock = false;
			return true;
		}
	},
	
	getItem:function(id) {
		for (var i=0;i<paella.plugins.recess.recessTracks.length;++i) {
			if (paella.plugins.recess.recessTracks[i].id==id) {
				return paella.plugins.recess.recessTracks[i];
			}
		}
		return null;
	},
	
	getSelectedItemIndex:function() {
		for (var i=0;i<paella.plugins.recess.recessTracks.length;++i) {
			if (paella.plugins.recess.recessTracks[i].id==this.selectedItem) {
				return i;
			}
		}
		return -1;
	},
	
	getTrackUniqueId:function() {
		var newId = -1;
		for (var i=0;i<paella.plugins.recess.recessTracks.length;++i) {
			if (newId<=paella.plugins.recess.recessTracks[i].id) {
				newId = paella.plugins.recess.recessTracks[i].id + 1;
			}
		}
		return newId;
	},
			
	onSave:function(onSuccess) {
		this.makeTracksBackup();
		paella.plugins.recess.instances.recessLoader.saveRecessInfo();
		onSuccess(true);
	},
		
	contextHelpString:function() {
		// TODO: Implement this using the standard paella.dictionary class
		if (paella.utils.language()=="es") {
			return "Utiliza la herramienta de descansos para marcar los descansos de la clase. Para cambiar la duración solo hay que arrastrar el inicio o el final de la pista \"Descanso\", en la linea de tiempo.";
		}
		else {
			return "Use this tool to define the breaks.";
		}
	}
});

paella.plugins.recess.instances.recessTrackPlugin = new paella.plugins.recess.classes.RecessTrackPlugin();



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Player Recess Plugin
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
paella.plugins.recess.classes.RecessPlayerPlugin = Class.create(paella.EventDrivenPlugin,{
	recessFrame: null,
	jumpFromSeek: false,

	initialize:function() {
		this.parent();
		this.recessFrame = document.createElement("div");
        this.recessFrame.setAttribute('style', 'width: 100%; height:100%; background-color:rgba(0,0,0,0.8); z-index:10000; display:none;');
	},
	
	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},
	
	getIndex:function() {
		return 1000;
	},
	
	getName:function() {
		return "RecessPlayerPlugin";
	},

	getEvents:function() {
		return [paella.events.loadComplete, paella.events.play, paella.events.pause, paella.events.seekToTime, paella.events.seekTo];
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
			case paella.events.seekToTime:
				this.seekToTime(params.time);
				break;
			case paella.events.seekTo:
				var time = (paella.player.videoContainer.duration(!(paella.player.videoContainer.trimEnabled())) * params.newPositionPercent) / 100;
				if (paella.player.videoContainer.trimEnabled()){
					time = time + paella.player.videoContainer.trimming.start;
				}
				this.seekToTime(time);
				break;
		}
	},
	
	loadComplete:function() {
        this.recessFrame.innerHTML = '<span style="bottom:50%; position:absolute; width:100%; color:rgb(241, 203, 0); font-size:70px; text-align:center;">'+paella.dictionary.translate('Recess')+'<span>';				
		var overlayContainer = paella.player.videoContainer.overlayContainer;
		overlayContainer.addElement(this.recessFrame, overlayContainer.getMasterRect());
	},
	
	startTimer:function() {
		var thisClass = this;
		this.timer = new paella.utils.Timer(function(timer) {
			var time = paella.player.videoContainer.currentTime();
			thisClass.onUpdateRecess(time);
			},1000.0);
		this.timer.repeat = true;	
	},
	
	pauseTimer:function() {
		if (this.timer!=null) {
			this.timer.cancel();
			this.timer = null;
		}
	},
	
	seekToTime:function(time) {
		this.jumpFromSeek = true;
		this.onUpdateRecess(time);
	},
	
	onUpdateRecess:function(time) {
		var isRecess = false;
		
		for (var i=0; i<paella.plugins.recess.recessTracks.length; i++){
			var recess = paella.plugins.recess.recessTracks[i];
			if ((recess.s < time) && (time < recess.e)) {
				isRecess = true;
				break;						
			}
		}
		if (isRecess == true){
			if (this.jumpFromSeek == false){
				$(document).trigger(paella.events.seekToTime,{time:recess.e});
			}
			else {
				if (this.recessFrame.style.display != "block") {
					this.recessFrame.style.display="block";
				}
			}
		}
		else {
			this.jumpFromSeek = false;
			if ((this.recessFrame) && (this.recessFrame.style.display != "none")){
				this.recessFrame.style.display="none";
			}
		}
	}	
});

paella.plugins.recess.instances.recessPlayerPlugin = new paella.plugins.recess.classes.RecessPlayerPlugin();






