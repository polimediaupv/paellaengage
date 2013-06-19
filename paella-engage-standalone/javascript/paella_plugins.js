
paella.editor.ToolStatusPlugin = Class.create(paella.editor.RightBarPlugin,{
	currentTrack:null,
	currentTextField:null,
	trackItemContainer:null,
	selectedColor:"rgb(255, 255, 236)",
	
	initialize:function() {
		this.parent();
		if (paella.utils.language()=='es') {
			var esDict = {
				'Tool':'Herramienta',
				'Selected tool':'Herramienta seleccionada',
				'this track does not contain any item':'esta pista no contiene ningún elemento',
				'Click on timeline outside any track to select current playback time.':'Haz clic en el fondo de la línea de tiempo para establecer el instante actual de reproducción',
				'Quick help':'Ayuda rápida',
				'item':'elemento',
				'items':'elementos',
				'from':'desde',
				'to':'hasta'
			};
			paella.dictionary.addDictionary(esDict);
		}
	},

	getIndex:function() {
		return 10000;
	},
	
	getName:function() {
		return "toolStatusPlugin";
	},
	
	getTabName:function() {
		return paella.dictionary.translate("Tool");
	},
	
	getContent:function() {
		this.currentTextField = null;
		var elem = document.createElement('div');
		if (this.currentTrack) {
			elem.innerHTML = "<h6>" + paella.dictionary.translate("Tool") + ": " + paella.dictionary.translate(this.currentTrack.getTrackName()) + "</h6>";
			var trackList = this.currentTrack.getTrackItems();
			var trackContainer = document.createElement('div');
			trackContainer.className = "editorPluginToolStatus_trackItemList";
			this.trackItemContainer = trackContainer;
			for (var i=0;i<trackList.length;++i) {
				this.addTrackData(trackContainer,trackList[i]);
			}
			elem.appendChild(trackContainer);
		}
		else {
			elem.innerHTML = "<h6>" + paella.dictionary.translate("Tool") + ": " + paella.dictionary.translate("Selection") + "</h6>";
			
		}
		
		this.addToolHelp(elem);
		
		return elem;
	},
	
	addTrackData:function(parent,track) {
		var trackData = document.createElement('div');
		//trackData.innerHTML = track.id + " s:" + track.s + ", e:" + track.e;
		var trackTime = document.createElement('div');
		var duration = Math.round((track.e - track.s) * 100) / 100;
		trackTime.innerHTML = paella.dictionary.translate('from') + ' ' + paella.utils.timeParse.secondsToTime(track.s) + ' ' +
							  paella.dictionary.translate('to') + ' ' + paella.utils.timeParse.secondsToTime(track.e) + ', ' +
							  duration + ' sec';
		trackData.appendChild(trackTime); 
		if (track.content) {
			this.addTrackContent(trackData,track.id,track.content,track.s,track.e);
		}
		parent.appendChild(trackData);
	},
	
	addTrackContent:function(parent,id,content,start,end) {
		var contentElem = null;
		var thisClass = this;
		if (this.currentTrack.allowEditContent()) {
			contentElem = document.createElement('input');
			contentElem.setAttribute('type', 'text');
			contentElem.setAttribute('id','trackContentEditor_' + id);
			contentElem.setAttribute('value',content);
			contentElem.trackData = {id:id,content:content,s:start,e:end};
			contentElem.plugin = this.currentTrack;
			$(contentElem).change(function(event) {
				this.plugin.onTrackContentChanged(this.trackData.id,$(this).val());
				paella.editor.instance.bottomBar.timeline.rebuildTrack(this.plugin.getName());
			});
			$(contentElem).click(function(event) {
				thisClass.onFocusChanged(this,this.plugin,this.trackData);
			});
			$(contentElem).focus(function(event) {
				thisClass.onFocusChanged(this,this.plugin,this.trackData);
			});
			
			var selectedTrackItemId = paella.editor.instance.bottomBar.timeline.currentTrackList.currentTrack.trackInfo.trackData.id;
			if (selectedTrackItemId==id) {
				this.currentTextField = contentElem;
				this.currentTextField.style.backgroundColor = this.selectedColor;
			}
		}
		else {
			contentElem = document.createElement('input');
			contentElem.setAttribute('type', 'text');
			contentElem.setAttribute('id',id);
			contentElem.setAttribute('disabled','disabled');
			contentElem.setAttribute('style','color:rgb(119, 119, 119)');
			contentElem.setAttribute('value',content);
		}
		
		
		parent.appendChild(contentElem);
	},
	
	onFocusChanged:function(field,plugin,trackData) {
		if (this.currentTextField) {
			this.currentTextField.style.backgroundColor = "#fff";
		}
		field.style.backgroundColor = this.selectedColor;
		paella.editor.instance.bottomBar.timeline.focusTrackListItem(plugin.getName(),trackData.id);
		this.currentTextField = field;
		
		// Set the timeline position at the end of this track item
		var time = trackData.e;
		$(document).trigger(paella.events.seekToTime,{time:time});
	},
	
	onLoadFinished:function() {
		if (this.currentTextField) {
			this.trackItemContainer.scrollTop = $(this.currentTextField).position().top;
		}
	},
		
	addToolHelp:function(parent) {
		var helpText = "";
		if (this.currentTrack) {
			helpText = this.currentTrack.contextHelpString();
		}
		else {
			helpText = paella.dictionary.translate("Click on timeline outside any track to select current playback time.");
		}
		
		if (helpText!="") {
			var helpElem = document.createElement('div');
			helpElem.className = "editorPluginToolStatusHelp";
			parent.appendChild(helpElem);
			helpElem.innerHTML = '<strong>' + paella.dictionary.translate('Quick help') + ': </strong>' + helpText;
		}		
	},
	
	onTrackSelected:function(newTrack) {
		this.currentTrack = newTrack;
	}
});

new paella.editor.ToolStatusPlugin();



paella.editor.ConsolidatePlugin = Class.create(paella.editor.RightBarPlugin,{
	getIndex:function() {
		return 10001;
	},
	
	getName:function() {
		return "consolidatePlugin";
	},
	
	getTabName:function() {
		return "Consolidate";
	},
	
	getContent:function() {
		var elem = document.createElement('div');
		elem.innerHTML = "Consolidate video";
		
		elem.innerHTML += '<div><label for="title">Title:</label><input type="text" value="title" id="title"></div>';
		elem.innerHTML += '<div><label for="author">Author:</label><input type="text" value="author" id="title"></div>';
		elem.innerHTML += '<div><label for="serie">Serie:</label><input type="text" value="serie" id="title"></div>';
		
		elem.innerHTML += '<div><input type="button" value="Consolidate"></div>';
		
		return elem;
	}
});

new paella.editor.ConsolidatePlugin();


/*

paella.editor.CaptionsPlugin = Class.create(paella.editor.TrackPlugin,{
	tracks:[],
	selectedTrackItem:null,

	initialize:function() {
		this.parent();
		if (paella.utils.language()=="es") {
			var esDict = {
				'Captions':'Subtítulos'
			};
			paella.dictionary.addDictionary(esDict);
		}
	},

	getTrackItems:function() {
		for (var i=0;i<this.tracks.length;++i) {
			this.tracks[i].name = this.tracks[i].content;
		}
		return this.tracks;
	},
	
	getTools:function() {
		return [
			{name:'create',label:paella.dictionary.translate('Create'),hint:paella.dictionary.translate('Create a new caption in the current position')},
			{name:'delete',label:paella.dictionary.translate('Delete'),hint:paella.dictionary.translate('Delete selected caption')}
		];
	},
	
	getTrackItemIndex:function(item) {
		for(var i=0;i<this.tracks.length;++i) {
			if (item.id==this.tracks[i].id) {
				return i;
			}
		}
		return -1;
	},

	onToolSelected:function(toolName) {
		if (this.selectedTrackItem && toolName=='delete' && this.selectedTrackItem) {
			this.tracks.splice(this.getTrackItemIndex(this.selectedTrackItem),1);
			return true;
		}
		else if (toolName=='create') {
			var start = paella.player.videoContainer.currentTime();
			var end = start + 60;
			var id = this.getTrackUniqueId();
			this.tracks.push({id:id,s:start,e:end,content:paella.dictionary.translate('Caption')});
			return true;
		}
	},
	
	getTrackUniqueId:function() {
		var newId = -1;
		if (this.tracks.length==0) return 1;
		for (var i=0;i<this.tracks.length;++i) {
			if (newId<=this.tracks[i].id) {
				newId = this.tracks[i].id + 1;
			}
		}
		return newId;
	},
	
	getName:function() {
		return "trackCaptions";
	},
	
	getTrackName:function() {
		return paella.dictionary.translate("Captions");
	},
	
	getColor:function() {
		return 'rgb(212, 212, 224)';
	},
	
	getTextColor:function() {
		return 'rgb(90,90,90)';
	},
	
	onTrackChanged:function(id,start,end) {
		var item = this.getTrackItem(id);
		if (item) {
			item.s = start;
			item.e = end;
			this.selectedTrackItem = item;
		}
	},
	
	onTrackContentChanged:function(id,content) {
		var item = this.getTrackItem(id);
		if (item) {
			item.content = content;
			item.name = content;
		}
	},
	
	allowEditContent:function() {
		return true;
	},
	
	getTrackItem:function(id) {
		for (var i=0;i<this.tracks.length;++i) {
			if (this.tracks[i].id==id) return this.tracks[i];
		}
	},
	
	contextHelpString:function() {
		if (paella.utils.language()=="es") {
			return "Utiliza esta herramienta para crear, borrar y editar subtítulos. Para crear un subtítulo, selecciona el instante de tiempo haciendo clic en el fondo de la línea de tiempo, y pulsa el botón 'Crear'. Utiliza esta pestaña para editar el texto de los subtítulos";
		}
		else {
			return "Use this tool to create, delete and edit video captions. To create a caption, select the time instant clicking the timeline's background and press 'create' button. Use this tab to edit the caption text.";
		}
	}
});

paella.editor.captionsPlugin = new paella.editor.CaptionsPlugin();
*/







paella.plugins.SocialPlugin = Class.create(paella.PlaybackPopUpPlugin,{
	socialContainer:null,
	container:null,
	button:null,
	rightPosition:0,


	initialize:function() {
		this.parent();
		if (paella.utils.language()=='es') {
			var esDict = {
				'Custom size:': 'Tamaño personalizado:',
				'Choose your embed size. Copy the text and paste it in your html page.': 'Elija el tamaño del video a embeber. Copie el texto y péguelo en su página html.',
				'Width:':'Ancho:',
				'Height:':'Alto:'				
			};
			paella.dictionary.addDictionary(esDict);
		}		
	},


	getRootNode:function(id) {
		var thisClass = this;
		this.button = new Button(id + '_social_button','showSocialButton',function(event) { thisClass.showSocialPress(); },true);
		return this.button;
	},
	
	getWidth:function() {
		return 45;
	},
	
	getMinWindowSize:function() {
		return 500;
	},
	
	setRightPosition:function(position) {
		this.button.domElement.style.right = position + 'px';
		this.rightPosition = position;
	},
	
	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},
	
	getIndex:function() {
		return 102;
	},
	
	getName:function() {
		return "SocialPlugin";
	},

	getPopUpContent:function(id) {
		var thisClass = this;
		this.socialContainer = new DomNode('div',id + '_social_container',{display:'none'});
		this.socialContainer.addNode(new Button(id + '_social_facebook_button','socialButtonFacebook',function(event) { thisClass.facebookPress(); }));
		this.socialContainer.addNode(new Button(id + '_social_twitter_button','socialButtonTwitter',function(event) { thisClass.twitterPress(); }));
		this.socialContainer.addNode(new Button(id + '_social_embed_button','socialButtonEmbed',function(event) { thisClass.embedPress(); }));
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

	embedPress:function() {
		var host = document.location.protocol + "//" +document.location.host;
		var pathname = document.location.pathname;
		
		var p = pathname.split("/");
		if (p.length > 0){p[p.length-1] = "embed.html";}
		var url = host+p.join("/")+"?id="+paella.matterhorn.episode.id
//		var paused = paella.player.videoContainer.paused();
//		$(document).trigger(paella.events.pause);
		
		var divSelectSize="<div style='display:inline-block;'> " +
			"    <input class='embedSizeButton' style='width:110px; height:73px;' value='620x349' />" +
			"    <input class='embedSizeButton' style='width:100px; height:65px;' value='540x304' />" +
			"    <input class='embedSizeButton' style='width:90px;  height:58px;' value='460x259' />" +
			"    <input class='embedSizeButton' style='width:80px;  height:50px;' value='380x214' />" +
			"    <input class='embedSizeButton' style='width:70px;  height:42px;' value='300x169' />" +
			"</div><div style='display:inline-block; vertical-align:bottom; margin-left:10px;'>"+
			"    <div>"+paella.dictionary.translate("Custom size:")+"</div>" +
			"    <div>"+paella.dictionary.translate("Width:")+" <input id='social_embed_width-input' class='embedSizeInput' maxlength='4' type='text' name='Costum width min 300px' alt='Costum width min 300px' title='Costum width min 300px' value=''></div>" +
			"    <div>"+paella.dictionary.translate("Height:")+" <input id='social_embed_height-input' class='embedSizeInput' maxlength='4' type='text' name='Costum width min 300px' alt='Costum width min 300px' title='Costum width min 300px' value=''></div>" +
			"</div>";
		
		
		var divEmbed = "<div style='text-align:left; font-size:14px; color:black;'><div id=''>"+divSelectSize+"</div> <div id=''>"+paella.dictionary.translate("Choose your embed size. Copy the text and paste it in your html page.")+"</div> <div id=''><textarea id='social_embed-textarea' class='social_embed-textarea' rows='4' cols='1' style='font-size:12px; width:95%; overflow:auto; margin-top:5px; color:black;'></textarea></div>  </div>";
		
		
		
		
		paella.messageBox.showMessage(divEmbed, {
			closeButton:true,
			width:'750px',
			height:'200px',
			onClose:function() {
			//	if (paused == false) {$(document).trigger(paella.events.play);}
			}
		});
		var w_e = $('#social_embed_width-input')[0];
		var h_e = $('#social_embed_height-input')[0];
		w_e.onkeyup = function(event){
			var width = parseInt(w_e.value);
			var height = parseInt(h_e.value);
			if (isNaN(width)){
				w_e.value="";
			}
			else{
				if (width<300){
					$("#social_embed-textarea")[0].value = "Embed width too low. The minimum value is a width of 300.";
				}
				else{
					if (isNaN(height)){
						height = (width/(16/9)).toFixed();
						h_e.value = height;
					} 				
					$("#social_embed-textarea")[0].value = '<iframe src="'+url+'" style="border:0px #FFFFFF none;" name="Paella Player" scrolling="no" frameborder="0" marginheight="0px" marginwidth="0px" width="'+width+'" height="'+height+'"></iframe>';
				}
			}
		};
		var embs = $(".embedSizeButton");
		for (var i=0; i< embs.length; i=i+1){
			var e = embs[i];
			e.onclick=function(event){
				var value = event.toElement.value;
				if (value) {
					var size = value.split("x");
					
					w_e.value = size[0];
					h_e.value = size[1];
					$("#social_embed-textarea")[0].value = '<iframe src="'+url+'" style="border:0px #FFFFFF none;" name="Paella Player" scrolling="no" frameborder="0" marginheight="0px" marginwidth="0px" width="'+size[0]+'" height="'+size[1]+'"></iframe>';
				}
			};
		}
	},
	
	getVideoUrl:function() {
		var url = document.location.href;
		return url;
	}	
});

new paella.plugins.SocialPlugin();

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




paella.plugins.DownloadsPlugin = Class.create(paella.TabBarPlugin,{
	id:null,
	divRoot:null,
	
	getIndex:function() {
		return 20;
	},

	getTabName:function() {
		return paella.dictionary.translate("Downloads");
	},
	
	checkEnabled:function(onSuccess) {
		onSuccess(paella.matterhorn.access.write);
	},	
	
	getRootNode:function(id) {
		this.id = id + 'DownloadsPlugin';
		this.divRoot = new DomNode('div',this.id ,{display:'block'});
		this.divRoot.domElement.className = "DownloadsPlugin";
		
		// TODO: Create a loading image!!!
		// TODO: Load the download info from paella.matterhorn.episode.mediapackage.media.track array!
				
		this.divRoot.domElement.innerHTML = "<div>TODO: Rellenar esto con la info que sea!</div>";
				
		return this.divRoot;
	}
	
});

//new paella.plugins.DownloadsPlugin();


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
		onSuccess(!paella.player.videoContainer.isMonostream);
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

paella.plugins.CommentsPlugin  = Class.create(paella.TabBarPlugin,{
	id:null,
	divRoot:null,
	divPublishComment:null,
	divComments:null,
	divLoading:null,
	isPublishAllowed: true,
	isPublishByAnonymousAllowed: true,
	publishCommentTextArea:null,
	publishCommentButtons:null,
	canPublishAComment: false,
	btnAddCommentToInstant: null,
	currentTime: 0,
	proxyUrl:'',
	useJsonp:false,
        commentsTree: [],
	

	getIndex:function() {
		return 100;
	},
	
	getTabName:function() {
		return paella.dictionary.translate("Comments");
	},

        initialize:function() {
                this.parent();
                var thisClass = this;

		this.divPublishComment = new DomNode('div','CommentPlugin_Publish' ,{display:'block'});
		this.divLoading = new DomNode('div','CommentPlugin_Loading' ,{display:'none'});		
		this.divComments = new DomNode('div','CommentPlugin_Comments' ,{display:'none'});

                $(document).bind(paella.events.loadComplete,function(event,params) {
                        thisClass.reloadComments();
                });
        },
	
	getRootNode:function(id) {
		var thisClass = this;
		this.useJsonp = paella.player.config.proxyLoader.usejsonp;
		if (paella.player.config.proxyLoader && paella.player.config.proxyLoader.enabled) {
			this.proxyUrl = paella.player.config.proxyLoader.url;
		}		
		this.id = 'CommentPlugin';
		this.divRoot = new DomNode('div',this.id ,{display:'block'});
	
		this.divPublishComment.domElement.id = this.id+"_Publish";
		this.divLoading.domElement.id = this.id+"_Loading";
		this.divComments.domElement.id = this.id+"_Comments";
		
		this.divRoot.addNode(this.divPublishComment);
		this.divRoot.addNode(this.divLoading);
		this.divRoot.addNode(this.divComments);

		if ( ((paella.matterhorn.me.username == "anonymous") && (this.isPublishByAnonymousAllowed == true)) || (paella.matterhorn.me.username != "anonymous") ){
			if (this.isPublishAllowed == true){
				this.canPublishAComment = true;
				this.createPublishComment();
				$(document).bind(paella.events.timeUpdate, function(event, params){
					thisClass.currentTime = params.currentTime;
                                        var currentTime = params.currentTime;
                                        if (paella.player.videoContainer.trimEnabled()){
                                          currentTime = params.currentTime - paella.player.videoContainer.trimming.start;
                                        }
					thisClass.btnAddCommentToInstant.domElement.innerHTML = paella.dictionary.translate("Publish at {0}").replace(/\{0\}/g, paella.utils.timeParse.secondsToTime(currentTime));
					
				});
			}
		}
		
		return this.divRoot;
	},
	
	setLoadingComments:function(b) {
		if ((this.divLoading) && (this.divComments)){
		if (b == true){
			this.divLoading.domElement.style.display="block";
			this.divComments.domElement.style.display="none";
		}
		else{
			this.divLoading.domElement.style.display="none";
			this.divComments.domElement.style.display="block";
		}
		}
	},
	
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// Publish functions
	///////////////////////////////////////////////////////////////////////////////////////////////////
	createPublishComment:function() {
		var thisClass = this;
		var rootID = this.divPublishComment.identifier+"_entry";
		var divEntry = new DomNode('div', rootID, {display:'block'});
		divEntry.domElement.className="comments_entry";
		
		var divSilhouette = new DomNode('img',rootID+"_silhouette" ,{display:'inline-block'});
		divSilhouette.domElement.src="plugins/silhouette32.png";
		divSilhouette.domElement.className = "comments_entry_silhouette";
		divEntry.addNode(divSilhouette);
		
		var divTextAreaContainer = new DomNode('div',rootID+"_textarea_container" ,{display:'inline-block'});
		divTextAreaContainer.domElement.className = "comments_entry_container";
		divTextAreaContainer.domElement.onclick = function(){thisClass.onClickTextAreaContainer(divTextAreaContainer)};		
		divEntry.addNode(divTextAreaContainer);
		
		this.publishCommentTextArea = new DomNode('textarea',rootID+"_textarea" ,{display:'block'});
		divTextAreaContainer.addNode(this.publishCommentTextArea);

		this.publishCommentButtons = new DomNode('div',rootID+"_buttons_area" ,{display:'none'});
		divTextAreaContainer.domElement.className = "comments_entry_container";
		divTextAreaContainer.addNode(this.publishCommentButtons);



		var btnAddComment = new DomNode('button',rootID+"_btnAddComment" ,{display:'float', float:'right'});
		btnAddComment.domElement.onclick = function(){thisClass.addComment();};
		
                btnAddComment.domElement.innerHTML = paella.dictionary.translate("Publish");

		this.publishCommentButtons.addNode(btnAddComment);
		
		this.btnAddCommentToInstant = new DomNode('button',rootID+"_btnAddCommentAt" ,{display:'float', float:'right'});
		
		this.btnAddCommentToInstant.domElement.innerHTML = paella.dictionary.translate("Publish at {0}").replace(/\{0\}/g,'??:??:??');
		this.btnAddCommentToInstant.domElement.onclick = function(){thisClass.addCommentAtTime();};
		this.publishCommentButtons.addNode(this.btnAddCommentToInstant);
		
		divTextAreaContainer.domElement.commentsTextArea = this.publishCommentTextArea;
		divTextAreaContainer.domElement.commentsBtnAddComment = btnAddComment;
		divTextAreaContainer.domElement.commentsBtnAddCommentToInstant = this.btnAddCommentToInstant;
		
				
		this.divPublishComment.addNode(divEntry);
	},
	
	onClickTextAreaContainer:function(textAreaContainerElement){ 
		this.publishCommentTextArea.domElement.style.height="60px";
		this.publishCommentButtons.domElement.style.display="block";
	},
	
	addCommentAtTime:function(){
		var thisClass = this;
		var txtValue = this.publishCommentTextArea.domElement.value;
		txtValue = txtValue.replace(/<>/g, "< >");  //TODO: Hacer este replace bien!
		
		var commentValue = paella.matterhorn.me.username + "<>" + txtValue + "<>scrubber";
		var inTime = Math.floor(thisClass.currentTime);
		
		this.publishCommentTextArea.domElement.value = "";
		
		var restEndpoint = paella.player.config.restServer.url + "annotation"; 		
		new paella.Ajax(restEndpoint,{episode:paella.matterhorn.episode.id, type:"comment", in:inTime, out:0, value:commentValue}, function(response) {
			thisClass.reloadComments();
		}, thisClass.proxyUrl, thisClass.useJsonp, 'PUT'); 	
	},
	
	addComment:function(){
		var thisClass = this;
		var txtValue = this.publishCommentTextArea.domElement.value;
		txtValue = txtValue.replace(/<>/g, "< >");  //TODO: Hacer este replace bien!
		
		var commentValue = paella.matterhorn.me.username + "<>" + txtValue + "<>normal";
	
		this.publishCommentTextArea.domElement.value = "";
		
		var restEndpoint = paella.player.config.restServer.url + "annotation"; 		
		new paella.Ajax(restEndpoint,{episode:paella.matterhorn.episode.id, type:"comment", in:0, out:0, value:commentValue}, function(response) {
			thisClass.reloadComments();
		}, thisClass.proxyUrl, thisClass.useJsonp, 'PUT'); 
	},

	addReply:function(annotationID, domNodeId){
		var thisClass = this;
                
                var textArea = document.getElementById(domNodeId);

		var txtValue = textArea.value;
		txtValue = txtValue.replace(/<>/g, "< >");  //TODO: Hacer este replace bien!
		
		var commentValue = paella.matterhorn.me.username + "<>" + txtValue + "<>reply<>"+annotationID;
	
		textArea.value = "";
		
		var restEndpoint = paella.player.config.restServer.url + "annotation"; 		
		new paella.Ajax(restEndpoint,{episode:paella.matterhorn.episode.id, type:"comment", in:0, out:0, value:commentValue}, function(response) {
			thisClass.reloadComments();
		}, thisClass.proxyUrl, thisClass.useJsonp, 'PUT'); 
	},
		
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// Comments Listing Functions
	///////////////////////////////////////////////////////////////////////////////////////////////////
	reloadComments:function() {
		var thisClass = this;
		this.useJsonp = paella.player.config.proxyLoader.usejsonp;
		if (paella.player.config.proxyLoader && paella.player.config.proxyLoader.enabled) {
			this.proxyUrl = paella.player.config.proxyLoader.url;
		}
		thisClass.setLoadingComments(true);
		this.divComments.domElement.innerHTML = "";
                thisClass.commentsTree = [];
				
				
		var restEndpoint = paella.player.config.restServer.url + "annotation/annotations.json"; 		
		new paella.Ajax(restEndpoint,{episode:paella.matterhorn.episode.id, type:"comment", limit:1000}, function(response) {
			if (typeof(response)=="string") {
				try {
					response = JSON.parse(response);
				}
				catch(e) {
					response=null;
				}
			}
			if (response  && response.annotations) {
				if (response.annotations.total == 1) {
					response.annotations.annotation = [response.annotations.annotation]
				}
				if (response.annotations.total > 0) {
					response.annotations.annotation.sort(function(a,b){
						var aD = paella.utils.timeParse.matterhornTextDateToDate(a.created);
						var bD = paella.utils.timeParse.matterhornTextDateToDate(b.created);				
						return bD.getTime()-aD.getTime();
					});

                                        var tempDict = {};

                                        // obtain normal and scrubs comments        
					for (var i =0; i < response.annotations.annotation.length; ++i ){
						var annotation = response.annotations.annotation[i];
						
                                                var valuesArray = annotation.value.split("<>");
                                                var valueUser = valuesArray[0];
                                                var valueType = valuesArray[2];
                                                var valueText = valuesArray[1];
                                                valueText = valueText.replace(/\n/g,"<br/>");
                                                
                                                if (valueType !== "reply") { 
                                                  var comment = {};
                                                  comment["id"] = annotation.annotationId;


                                                  comment["user"] = valueUser;
                                                  comment["type"] = valueType;
                                                  comment["text"] = valueText;
                                                  comment["userId"] = annotation.userId;
                                                  comment["created"] = annotation.created;
                                                  comment["inpoint"] = annotation.inpoint;
                                                  comment["replies"] = [];
                                                  
                                                  thisClass.commentsTree.push(comment);
                                                  tempDict[comment["id"]] = thisClass.commentsTree.length - 1; 

                                                }
					}

                                        // obtain replies comments
					for (var i =0; i < response.annotations.annotation.length; ++i ){
						var annotation = response.annotations.annotation[i];

                                                var valuesArray = annotation.value.split("<>");
                                                var valueUser = valuesArray[0];
                                                var valueType = valuesArray[2];
                                                var valueText = valuesArray[1];
                                                var valueParentId = valuesArray[3],
                                                valueText = valueText.replace(/\n/g,"<br/>");
                                                
                                                if (valueType === "reply") { 
                                                  var comment = {};
                                                  comment["id"] = annotation.annotationId;


                                                  comment["user"] = valueUser;
                                                  comment["type"] = valueType;
                                                  comment["text"] = valueText;
                                                  comment["userId"] = annotation.userId;
                                                  comment["created"] = annotation.created;
                                                  
                                                  var index = tempDict[valueParentId];

                                                  thisClass.commentsTree[index]["replies"].push(comment);
                                                }
					}

                                        thisClass.displayComments();
				}
			}
			thisClass.setLoadingComments(false);
			
		}, thisClass.proxyUrl, thisClass.useJsonp);	
		
	},
			
	displayComments:function() {
          var thisClass = this;
          for (var i =0; i < thisClass.commentsTree.length; ++i ){
            var comment = thisClass.commentsTree[i];
            var e = thisClass.createACommentEntry(comment);
            thisClass.divComments.addNode(e);
          } 

        },

	createACommentEntry:function(comment) {
		var thisClass = this;
		var rootID = this.divPublishComment.identifier+"_entry_"+comment["id"];
		
		var divEntry = new DomNode('div',rootID ,{display:'block'});
		divEntry.domElement.className="comments_entry";

		var divSilhouette = new DomNode('img',rootID+"_silhouette" ,{display:'inline-block'});
		divSilhouette.domElement.src="plugins/silhouette32.png";
		divSilhouette.domElement.className = "comments_entry_silhouette";
		divEntry.addNode(divSilhouette);
		
				
		var divCommentContainer = new DomNode('div',rootID+"_comment_container" ,{display:'inline-block'});
		divCommentContainer.domElement.className = "comments_entry_container";
		divEntry.addNode(divCommentContainer);
				

		var divCommentMetadata = new DomNode('div',rootID+"_comment_metadata" ,{display:'block'});
		divCommentContainer.addNode(divCommentMetadata);
		var datePublish = "";
		if (comment["created"]) {
			var dateToday=new Date()
			var dateComment = paella.utils.timeParse.matterhornTextDateToDate(comment["created"]);			
			datePublish = paella.utils.timeParse.secondsToText((dateToday.getTime()-dateComment.getTime())/1000);
		}		
		
		
		var headLine = "<span class='comments_entry_username'>" + comment["userId"] + "</span>";
		if (comment["type"] === "scrubber"){
                        var publishTime = comment["inpoint"];
                        if (paella.player.videoContainer.trimEnabled()){
                            publishTime = comment.inpoint - paella.player.videoContainer.trimming.start;
                        }
			headLine += "<span class='comments_entry_timed'> " + paella.utils.timeParse.secondsToTime(publishTime) + "</span>";
		}
		headLine += "<span class='comments_entry_datepublish'>" + datePublish + "</span>";
 
		divCommentMetadata.domElement.innerHTML = headLine;
		
		var divCommentValue = new DomNode('div',rootID+"_comment_value" ,{display:'block'});
		divCommentValue.domElement.className = "comments_entry_comment";
		divCommentContainer.addNode(divCommentValue);		
		
		divCommentValue.domElement.innerHTML = comment["text"];

		var divCommentReply = new DomNode('div',rootID+"_comment_reply" ,{display:'block'});
		divCommentContainer.addNode(divCommentReply);
		
		if (this.canPublishAComment == true) {
			var btnRplyComment = new DomNode('button',rootID+"_comment_reply_button" ,{display:'block'});
	
			btnRplyComment.domElement.onclick = function(){
				var e = thisClass.createAReplyEntry(comment["id"]);
				this.style.display="none";
				this.parentElement.parentElement.appendChild(e.domElement);
			};
	
			btnRplyComment.domElement.innerHTML = paella.dictionary.translate("Reply");
			divCommentReply.addNode(btnRplyComment);
		}

                
                
                for (var i =0; i < comment["replies"].length; ++i ){
                  var e = thisClass.createACommentReplyEntry(comment["id"], comment["replies"][i]);
                  divCommentContainer.addNode(e);
                }

				
		return divEntry;
	},

	createACommentReplyEntry:function(parentID, comment) {
		var thisClass = this;
		var rootID = this.divPublishComment.identifier+"_entry_" + parentID + "_reply_" + comment["id"];

		var divEntry = new DomNode('div',rootID ,{display:'block'});
		divEntry.domElement.className="comments_entry";

		var divSilhouette = new DomNode('img',rootID+"_silhouette" ,{display:'inline-block'});
		divSilhouette.domElement.src="plugins/silhouette32.png";
		divSilhouette.domElement.className = "comments_entry_silhouette";
		divEntry.addNode(divSilhouette);
		
				
		var divCommentContainer = new DomNode('div',rootID+"_comment_container" ,{display:'inline-block'});
		divCommentContainer.domElement.className = "comments_entry_container";
		divEntry.addNode(divCommentContainer);
				

		var divCommentMetadata = new DomNode('div',rootID+"_comment_metadata" ,{display:'block'});
		divCommentContainer.addNode(divCommentMetadata);
		var datePublish = "";
		if (comment["created"]) {
			var dateToday=new Date()
			var dateComment = paella.utils.timeParse.matterhornTextDateToDate(comment["created"]);			
			datePublish = paella.utils.timeParse.secondsToText((dateToday.getTime()-dateComment.getTime())/1000);
		}		
		
		
		var headLine = "<span class='comments_entry_username'>" + comment["userId"] + "</span>";
		headLine += "<span class='comments_entry_datepublish'>" + datePublish + "</span>";
 
		divCommentMetadata.domElement.innerHTML = headLine;
		
		var divCommentValue = new DomNode('div',rootID+"_comment_value" ,{display:'block'});
		divCommentValue.domElement.className = "comments_entry_comment";
		divCommentContainer.addNode(divCommentValue);		
		
		divCommentValue.domElement.innerHTML = comment["text"];
		
				
		return divEntry;
	},
	
	
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// Reply Functions
	///////////////////////////////////////////////////////////////////////////////////////////////////	
	createAReplyEntry:function(annotationID) {
		var thisClass = this;
		paella.debug.log("----> " + annotationID)
		var rootID = this.divPublishComment.identifier+"_entry_" + annotationID + "_reply";
		var divEntry = new DomNode('div',rootID+"_entry" ,{display:'block'});
		divEntry.domElement.className="comments_entry";
		
		
		var divSilhouette = new DomNode('img',rootID+"_silhouette" ,{display:'inline-block'});
		divSilhouette.domElement.src="plugins/silhouette32.png";
		divSilhouette.domElement.className = "comments_entry_silhouette";
		divEntry.addNode(divSilhouette);
		
		
		var divCommentContainer = new DomNode('div',rootID+"_reply_container" ,{display:'inline-block'});
		divCommentContainer.domElement.className = "comments_entry_container comments_reply_container";
		divEntry.addNode(divCommentContainer);
		
		var textArea = new DomNode('textarea',rootID+"_textarea" ,{display:'block'});
		divCommentContainer.addNode(textArea);

		this.publishCommentButtons = new DomNode('div',rootID+"_buttons_area" ,{display:'block'});
		//divCommentContainer.domElement.className = "comments_entry_container";
		divCommentContainer.addNode(this.publishCommentButtons);


		var btnAddComment = new DomNode('button',rootID+"_btnAddComment" ,{display:'float', float:'right'});
		btnAddComment.domElement.onclick = function(){thisClass.addReply(annotationID, textArea.domElement.id);};
		btnAddComment.domElement.innerHTML = paella.dictionary.translate("Reply");
		this.publishCommentButtons.addNode(btnAddComment);		
		
		
		return divEntry;
	}
});

/*
episode:6d03cdbb-14ff-4738-b5da-7039bd0c2fb0
type:comment
in:0
value:admin<>un reply<>reply<>2352
out:0
*/
new paella.plugins.CommentsPlugin();


paella.plugins.userTrackingViewerPlugIn = Class.create(paella.PlaybackPopUpPlugin,{
	container:null,
	button:null,
	rightPosition:0,
	sparklineLoaded:false,
	isVisible:false,
	footprintData:[],
	footprintTimer:null,
	proxyUrl:'',
	useJsonp:false,
	

	getRootNode:function(id) {
		this.useJsonp = paella.player.config.proxyLoader.usejsonp;
		if (paella.player.config.proxyLoader && paella.player.config.proxyLoader.enabled) {
			this.proxyUrl = paella.player.config.proxyLoader.url;
		}
	
	
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
	
	getMinWindowSize:function() {
		return 700;
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
		}, this.proxyUrl, this.useJsonp);		
	}
	
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
	proxyUrl:'',
	useJsonp:false,

	initPlugin:function() {
		this.useJsonp = paella.player.config.proxyLoader.usejsonp;
		if (paella.player.config.proxyLoader && paella.player.config.proxyLoader.enabled) {
			this.proxyUrl = paella.player.config.proxyLoader.url;
		}	
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
		}, this.proxyUrl, this.useJsonp);
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
			}, this.proxyUrl, this.useJsonp);			
		}
	}
	
});

new paella.plugins.userTrackingCollectorPlugIn();


paella.plugins.DescriptionPlugin  = Class.create(paella.TabBarPlugin,{
	id:null,
	divRoot:null,
	proxyUrl:'',
	useJsonp:false,
	proxyEllaServer:'',
	desc: { date:'-', contributor:'-', language:'-', views:'-', serie:'-', serieId:'', presenter:'-', description:'-', title:'-', subject:'-' },
	
	getIndex:function() {
		return 10;
	},
	
	getTabName:function() {
		return paella.dictionary.translate("Description");
	},
	
	getRootNode:function(id) {
		this.proxyEllaServer = paella.utils.parameters.get("server");
		this.id = id + 'descriptionPlugin';
		this.divRoot = new DomNode('div',this.id ,{display:'block'});
		if (paella.player.config.proxyLoader && paella.player.config.proxyLoader.enabled) {
			this.proxyUrl = paella.player.config.proxyLoader.url;
		}
		this.useJsonp = paella.player.config.proxyLoader.usejsonp;
		
		this.doDescription();		
		return this.divRoot;		
	},
	
	doDescription:function() {
		var thisClass = this;
				
		if (paella.matterhorn.episode.dcTitle) { this.desc.title = paella.matterhorn.episode.dcTitle; }
		if (paella.matterhorn.episode.dcIsPartOf) { 
			this.desc.serieId = paella.matterhorn.episode.dcIsPartOf;
			if (paella.matterhorn.series.serie.dcTitle) { this.desc.serie = paella.matterhorn.episode.mediapackage.seriestitle; }
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
				try{
					response = JSON.parse(response);
				}
				catch(e) { response = null;}
			}
			if (response){
				thisClass.desc.views = response.stats.views;
				thisClass.insertDescription();
			}
		}, thisClass.proxyUrl, thisClass.useJsonp);
	},
	
	insertDescription:function() {			
		var divDate = new DomNode('div',this.id+"_Date", {padding:"2px 0px"});
		var divContributor = new DomNode('div',this.id+"_Contributor" , {padding:"2px 0px"});
		var divLanguage = new DomNode('div',this.id+"_Language" , {padding:"2px 0px"});
		var divViews = new DomNode('div',this.id+"_Views" , {padding:"2px 0px"});
		var divTitle = new DomNode('div',this.id+"_Title", {padding:"2px 0px"});
		var divSubject = new DomNode('div',this.id+"_Subject", {padding:"2px 0px"});
		var divSeries = new DomNode('div',this.id+"_Series", {padding:"2px 0px"});
		var divPresenter = new DomNode('div',this.id+"_Presenter", {padding:"2px 0px"});
		var divDescription = new DomNode('div',this.id+"_Description", {padding:"2px 0px"});

		divDate.domElement.innerHTML = paella.dictionary.translate("Date:")+'<span style="margin-left:5px; color:grey;">'+this.desc.date+'</span>';
		divContributor.domElement.innerHTML = paella.dictionary.translate("Contributor:")+'<span style="margin-left:5px; color:grey;">'+this.desc.contributor+'</span>';
		divLanguage.domElement.innerHTML = paella.dictionary.translate("Language:")+'<span style="color:grey;">'+this.desc.language+'</span>';
		divViews.domElement.innerHTML = paella.dictionary.translate("Views:")+'<span style="margin-left:5px; color:grey;">'+this.desc.views+'</span>';			
		divTitle.domElement.innerHTML = paella.dictionary.translate("Title:")+'<span style="margin-left:5px; color:grey;">'+this.desc.title+'</span>';
		divSubject.domElement.innerHTML = paella.dictionary.translate("Subject:")+'<span style="margin-left:5px; color:grey;">'+this.desc.subject+'</span>';
		divSeries.domElement.innerHTML = paella.dictionary.translate("Serie:")+'<a style="margin-left:5px;" href="index.html?server='+this.proxyEllaServer+'&series='+this.desc.serieId+'">'+this.desc.serie+'</a>';
		divPresenter.domElement.innerHTML = paella.dictionary.translate("Presenter:")+'<a style="margin-left:5px;" href="index.html?server='+this.proxyEllaServer+'&q='+this.desc.presenter+'">'+this.desc.presenter+'</a>';
		divDescription.domElement.innerHTML = paella.dictionary.translate("Description:")+'<span style="margin-left:5px; color:grey;">'+this.desc.description+'</span>';

		//---------------------------//			
		var divLeft = new DomNode('div',this.id+"_Left" ,{display:'inline-block', width:'50%', margin: '0px', padding: '0px', verticalAlign: 'top'});			

		divLeft.addNode(divTitle);
		divLeft.addNode(divPresenter);
		divLeft.addNode(divSeries);
		divLeft.addNode(divDate);		
		divLeft.addNode(divViews);
		
		//---------------------------//
		var divRight = new DomNode('div',this.id+"_Right" ,{display:'inline-block', width:'50%', margin: '0px', padding: '0px', verticalAlign: 'top'});

		divRight.addNode(divContributor);
		divRight.addNode(divSubject);
		divRight.addNode(divLanguage);
		divRight.addNode(divDescription);
			
			
		this.divRoot.addNode(divLeft);	
		this.divRoot.addNode(divRight);	
	}
	
});

new paella.plugins.DescriptionPlugin();

paella.plugins.SerieEpisodesPlugin = Class.create(paella.RightBarPlugin,{
	id:null,
	serieText:'',
	serieId:null,
	divRoot:null,
	proxyUrl:'',
	useJsonp:false,	
	serie: { numTotal:-1, numPublished:0, numNoPublished:0,  numPending:0,  episodes:[] },
	
	
	getRootNode:function(id) {
		if (paella.player.config.proxyLoader && paella.player.config.proxyLoader.enabled) {
			this.proxyUrl = paella.player.config.proxyLoader.url;
		}
		this.useJsonp = paella.player.config.proxyLoader.usejsonp;
		this.serieId = paella.matterhorn.series.serie.dcIsPartOf;
		if (this.serieId == undefined){
			this.serieId = paella.matterhorn.series.serie.id;
		}
		this.serieText = paella.matterhorn.episode.mediapackage.seriestitle;
		if (this.serieText == undefined) this.serieText = "";
		
		var thisClass = this;
		var id = 'SerieEpisodesPlugin';
		this.divRoot = new DomNode('div', id ,{display:'block'});
		
		var title = new DomNode('div',id+"_Title" ,{display:'block'});
		title.domElement.className = "SerieEpisodesPlugin_Title";
		title.domElement.innerHTML = "<span class='SerieEpisodesPlugin_Title_Bold'>" +paella.dictionary.translate("Videos in this serie:")+"</span> " + this.serieText;
		this.divRoot.addNode(title);

		var listing = new DomNode('div',id+"_Listing" ,{display:'block'});
		listing.domElement.className = "SerieEpisodesPlugin_Listing"; 
		this.divRoot.addNode(listing);
		
		
		var myClass = new paella.matterhorn.SearchEpisode(paella.player.config, {sid:this.serieId, limit:10, page:0});			
		myClass.doSearch({sid:this.serieId, limit:10, page:0}, listing.domElement);

				
		this.showEpisodesAllowed();
		
		return this.divRoot;
	},
	
	showEpisodesAllowed: function() {
		paella.debug.log("SerieEpisodesPlugin");

	},
	

});

new paella.plugins.SerieEpisodesPlugin();


/*
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
*/


	
paella.plugins.events.googleAnalytics = {
	track:'ga:track'
};

paella.plugins.GoogleAnalitycs = Class.create(paella.EventDrivenPlugin,{
	_gaq:null,

	getEvents:function() {
		return [paella.events.loadStarted,	
			paella.events.play,	
			paella.events.pause,	
			paella.events.endVideo,		
			paella.plugins.events.googleAnalytics.track];
	},
	
	onEvent:function(eventType, params) {		
		switch (eventType) {
			case paella.events.loadStarted:
				this.loadStarted();
				break;
			case paella.plugins.events.googleAnalytics.track:
				this.trackEvent(params);
				break;
			case paella.events.play:
				this._trackEvent("PaellaPlayer", "Play", document.location.href);
				break;
			case paella.events.pause:
				this._trackEvent("PaellaPlayer", "Pause", document.location.href);
				break;
			case paella.events.endVideo:
				this._trackEvent("PaellaPlayer", "Finish", document.location.href);
				break;
		}		
	},
	
	loadStarted:function() {
		var account = null;
		try{
			account = paella.player.config.googleAnalytics.account;
		}
		catch(e) {account=null;}
		if (account != null){
			paella.debug.log("Google Analitycs Enabled");
			var _gaq = _gaq || [];
			_gaq.push(['_setAccount', account]);
			_gaq.push(['_trackPageview']);
	
			(function() {
				var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
				ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
				var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
			})();
		}
		else{
			paella.debug.log("Google Analitycs Disabled");
		}
	},
	
	trackEvent:function(params) {		
		this._trackEvent(params.action, params.label, params.value);
	},
	
	_trackEvent:function(action, label, value, noninteraction) {
		if (this._gaq != null) {
			this._gaq.push(['_trackEvent', action, label, value]);
		}
	}
});

paella.plugins.googleAnalytics = new paella.plugins.GoogleAnalitycs();


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

paella.plugins.publish = {classes:{}, instances:{} };


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Loader Publish Plugin
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
paella.plugins.publish.classes.PublishLoaderPlugin = Class.create(paella.EventDrivenPlugin,{
	
	getName:function() {
		return "PublishLoaderPlugin";
	},

	checkEnabled:function(onSuccess) {
		onSuccess(paella.player.config.publish && paella.player.config.publish.enabled);
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
		return 750;
	}
});

new paella.plugins.RepeatButtonPlugin();

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
		$(this.domElement).bind('click',function(event) {
                  thisClass.frameContainer.seekToTime(thisClass.frameData.time)
                });
		$(document).bind(paella.events.setTrim,function(event,params) {
			thisClass.checkVisibility(params.trimEnabled,params.trimStart,params.trimEnd);
		});
		$(this.domElement).bind('mouseover',function(event) {
					var frame;
					
					frame = thisClass.frameContainer.frameHiRes[thisClass.frameData.time];
					if (frame === undefined){
						frame = thisClass.frameContainer.frames[thisClass.frameData.time];						
					}
					if (frame != undefined){
						var url = frame.url;
						thisClass.frameContainer.showHiResFrame(url);
					}
                });
		$(this.domElement).bind('mouseout',function(event) {
                  thisClass.frameContainer.removeHiResFrame();
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
	frameHiRes:{},
	currentFrame:null,
        hiResFrame:null,

	initialize:function(id) {
		this.parent('div',id,{position:'absolute',left:'0px',right:'0px',bottom:'37px',display:'block'});
		this.domElement.className = 'frameListContainer';
		this.hide();
		var thisClass = this;
		$(document).bind(paella.events.loadComplete,function(event,params) {
			thisClass.setFrames(params.frames);
			thisClass.obtainHiResFrames();
		});
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
	},

	obtainHiResFrames:function() {
		var unorderedFrames = {}
		var attachments = paella.matterhorn.episode.mediapackage.attachments.attachment; 
		var lastFrameTime = 0;
		for (var attachment in attachments) {
			attachment = attachments[attachment];
			if (attachment.type=="presentation/segment+preview+hires") {
				var url = attachment.url;
				var time = 0;
				if (/time=T(\d+):(\d+):(\d+)/.test(attachment.ref)) {
					time = parseInt(RegExp.$1)*60*60 + parseInt(RegExp.$2)*60 + parseInt(RegExp.$3);
				}
				unorderedFrames[time] = {time:time,url:url,mimetype:attachment.mimetype,id:attachment.id};
				if (time>lastFrameTime) lastFrameTime = time;
			}
		}

		for (var i=0;i<=lastFrameTime;++i) {
			if (unorderedFrames[i]) {
				this.frameHiRes[i] = unorderedFrames[i];
			}
		}
	},

	showHiResFrame:function(url) {
		var frameRoot = document.createElement("div"); 
		var frame = document.createElement("div"); 
		var hiResImage = document.createElement('img'); 
        hiResImage.className = 'frameHiRes';
        hiResImage.setAttribute('src',url);
        hiResImage.setAttribute('style', 'width: 100%;');
          	
		$(frame).append(hiResImage);
		$(frameRoot).append(frame);

        frameRoot.setAttribute('style', 'display: table;');
        frame.setAttribute('style', 'display: table-cell; vertical-align:middle;');
		overlayContainer = paella.player.videoContainer.overlayContainer;
		
		var streams = paella.initDelegate.initParams.videoLoader.streams;
		if (streams.length == 1){
			overlayContainer.addElement(frameRoot, overlayContainer.getMasterRect());
		}
		else if (streams.length >= 2){
			overlayContainer.addElement(frameRoot, overlayContainer.getSlaveRect());
		}
		overlayContainer.enableBackgroundMode();
		this.hiResFrame = frameRoot;
	},

	removeHiResFrame:function() {
		overlayContainer = paella.player.videoContainer.overlayContainer;
		overlayContainer.removeElement(this.hiResFrame);
		overlayContainer.disableBackgroundMode();
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
		this.profilesContainer.addNode(new Button(id + '_extended_profiles_small','extendedProfilesSmall',function(event) { thisClass.profileSmall(); }));
		this.profilesContainer.addNode(new Button(id + '_extended_profiles_big','extendedProfilesBig',function(event) { thisClass.profileBig(); }));
		this.profilesContainer.addNode(new Button(id + '_extended_profiles_full','extendedProfilesFull',function(event) { thisClass.profileFull(); }));
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
	
	profileFull:function() {
		$(this.profilesContainer.domElement).hide();
		this.button.toggle();
		paella.extended.setProfile('full');
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

	
	profileSmall:function() {
		$(this.profilesContainer.domElement).hide();
		this.button.toggle();
		paella.extended.setProfile('small');
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
	profileBig:function() {
		$(this.profilesContainer.domElement).hide();
		this.button.toggle();
		paella.extended.setProfile('big');
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
		this.profileFull();
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



paella.plugins.captions = {classes:{}, instances:{}, events:{}, captions:null, enableEdit:false};

paella.plugins.captions.events = {
	loaded:'captions:loaded',
	enable:'captions:enable',
	disable:'captions:disable'	
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Captions Loader
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
paella.plugins.captions.classes.DFXPParser = Class.create({
	
	parseCaptions:function(text)
	{
		var xml = $(text);
		var ps = xml.find("body div p");
		var captions= [];
		var i = 0;		
		for (i=0; i< ps.length; i++) {		
			var c = this.getCaptionInfo(ps[i]);
			captions.push(c);
		}		
		return captions;
	},
	
	getCaptionInfo:function(cap) {
		var b = this.parseTimeTextToSeg(cap.getAttribute("begin"));
		var d = this.parseTimeTextToSeg(cap.getAttribute("end"));
		var v = $(cap).text();
		
		return {begin:b, duration:d, value:v};
	},
	
	parseTimeTextToSeg:function(ttime){
		var split = ttime.split(":");
		var h = parseInt(split[0]);
		var m = parseInt(split[1]);
		var s = parseInt(split[2]);
		return s+(m*60)+(h*60*60);
	},
	
	captionsToDxfp:function(captions){
		var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
		xml = xml + '<tt xml:lang="en" xmlns="http://www.w3.org/2006/10/ttaf1" xmlns:tts="http://www.w3.org/2006/04/ttaf1#styling">\n';
		xml = xml + '<body><div xml:id="captions" xml:lang="en">\n';
		
		for (var i=0; i<captions.length; i=i+1){
			var c = captions[i];
			xml = xml + '<p begin="'+ paella.utils.timeParse.secondsToTime(c.begin) +'" end="'+ paella.utils.timeParse.secondsToTime(c.duration) +'">' + c.value + '</p>\n';
		}
		xml = xml + '</div></body></tt>';
		
		return xml;
	}
});


paella.plugins.captions.classes.CaptionsLoader = Class.create({
	
	initialize:function() {
		var thisClass = this;
		$(document).bind(paella.events.loadComplete,function(event,params) {
			if ((paella.player.config.captions) && (paella.player.config.captions.enableEdit)){
				paella.plugins.captions.enableEdit = true;				
			}
			thisClass.loadCaptions();
		});		
	},
	
	loadCaptionsUsingMediapackage:function(onSuccess, onError){
		var catalogs = null;
		try {
			catalogs = paella.matterhorn.episode.mediapackage.metadata.catalog;
			if (!(catalogs instanceof Array)){
			    catalogs = [catalogs];
			}					
		}
		catch(e){catalogs = null;}
		if (catalogs != null){
			var catalog = null;
			for (var i=0; i< catalogs.length; i=i+1){
				var c = catalogs[i];
				if (c.type == "captions/timedtext"){
					catalog = c;
					break;
				}
			}
			if (catalog != null){
				paella.debug.log("Captions found in MediaPackage: Loading Captions file...");
				// Load captions!
				var proxyUrl = '';
				var useJsonp = paella.player.config.proxyLoader.usejsonp;
				if (paella.player.config.proxyLoader && paella.player.config.proxyLoader.enabled) {
					proxyUrl = paella.player.config.proxyLoader.url;
				}
				
				new paella.Ajax(catalog.url, {}, function(response) {
					if (response){					
						var parser = new paella.plugins.captions.classes.DFXPParser();
						paella.plugins.captions.captions = parser.parseCaptions(response);						
						$(document).trigger(paella.plugins.captions.events.loaded, {});	
						if (onSuccess) onSuccess();						
					}
					else{
						if (onError) onError();
					}
				}, proxyUrl, useJsonp, 'GET');
				
			}
			else{
				paella.debug.log("Captions does not found in MediaPackage!");		
			}
		}		
	},
	
	loadCaptionsUsingAnnotations:function(onSuccess, onError){
		var episodeid = paella.matterhorn.episode.id;
		this.loadAttachmentData(episodeid, "paella/captions/timedtext", function(value){
			if (value){
				paella.debug.log("Captions found in the annotation service: Loading annotation file...");
				var parser = new paella.plugins.captions.classes.DFXPParser();
				paella.plugins.captions.captions = parser.parseCaptions(value);
				$(document).trigger(paella.plugins.captions.events.loaded, {});	
				if (onSuccess) onSuccess();						
			}
			else{
				paella.debug.log("Captions does not found in the annotation service!");
				if (onError) onError();
			}
		}, onError);
	},
	
	
	loadCaptions:function(onSuccess, onError){
		// Try to load Captions from annotation service first if active....
		var thisClass = this;
		if (this.enableEdit){
			this.loadCaptionsUsingAnnotations(null, function(){ thisClass.loadCaptionsUsingMediapackage(); });
		}
		else{
			this.loadCaptionsUsingMediapackage();
		}
	},
	
	saveCaptions:function(onSuccess, onError){
		var episodeid = paella.matterhorn.episode.id;
		var value = parser.captionsToDxfp(paella.plugins.captions.captions);
		paella.debug.log("Saving captions in the annotation service: Loading Annotation file...");

		this.saveAttachmentData(episodeid, "paella/captions/timedtext", value, onSuccess, onError);
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

paella.plugins.captions.instances.captionsLoader = new paella.plugins.captions.classes.CaptionsLoader();


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Captions Player Button Plugin
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
paella.plugins.captions.classes.CaptionsPlayerButtonPlugin = Class.create(paella.PlaybackPopUpPlugin,{
	button:null,
	thereAreCaptions:false,
	
	initialize:function() {
		this.parent();
		var thisClass = this;
		this.button = new Button('loadding_captionsplayer_button','captionsButton_noCaptions',function(event) { thisClass.onButtonClick(); }, true);
		
		$(document).bind(paella.plugins.captions.events.loaded,function(event,params) {
			thisClass.thereAreCaptions = true;
			thisClass.button.domElement.className = "captionsButton";			
		});
	},
	
	getRootNode:function(id) {
		this.button.identifier = id + '_captionsplayer_button';
		this.button.domElement.id = this.button.identifier;
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
	
	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},
	
	getIndex:function() {
		return 1005;
	},
	
	getName:function() {
		return "CaptionsPlayerButtonPlugin";
	},
	
	getMinWindowSize:function() {
		return 700;
	},
	
	onButtonClick:function() {
		if (this.thereAreCaptions == true) {
			if (this.button.isToggled()) {
				$(document).trigger(paella.plugins.captions.events.enable, {});
			}
			else {
				$(document).trigger(paella.plugins.captions.events.disable, {});
			}
		}
	}	
});

paella.plugins.captions.instances.captionsPlayerButtonPlugin = new paella.plugins.captions.classes.CaptionsPlayerButtonPlugin();



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Captions Player Overlay Plugin
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
paella.plugins.captions.classes.CaptionsPlayerOverlayPlugin = Class.create(paella.EventDrivenPlugin,{
	timer:null,	
	visible:false,	
	overlayFrame:null,

	getEvents:function() {
		
		return [paella.events.loadComplete,
			paella.events.play,
			paella.events.pause,
			paella.plugins.captions.events.enable,
			paella.plugins.captions.events.disable
		];
		
		return [];
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
			case paella.plugins.captions.events.enable:
				this.onEnable();
				break;
			case paella.plugins.captions.events.disable:
				this.onDisable();
				break;
		}
	},
	
	loadComplete:function() {		
		var overlayContainer = paella.player.videoContainer.overlayContainer;
		this.overlayFrame = document.createElement("div");
		this.overlayFrame.setAttribute('class',"CaptionsPlayerOverlayPlugin");
		overlayContainer.addElement(this.overlayFrame, overlayContainer.getMasterRect());
	},
	
	startTimer:function() {
		var thisClass = this;
		this.timer = new paella.utils.Timer(function(timer) {
			thisClass.onUpdateCaptions();
			},1000.0);
		this.timer.repeat = true;		
	},
	
	pauseTimer:function() {
		if (this.timer!=null) {
			this.timer.cancel();
			this.timer = null;
		}		
	},
	
	onUpdateCaptions:function() {		
		var captions = paella.plugins.captions.captions;
		
		if (captions){
			var time = paella.player.videoContainer.currentTime();
			cap = "";
			var i;
			for (i=0; i<captions.length;i++){
				if ((captions[i].begin<=time) && ((captions[i].begin+captions[i].duration)>=time)){
					cap = captions[i].value					
				}
			}
			this.overlayFrame.innerHTML = cap;
		}
	},

	onEnable:function() {
		this.visible = true;
		$(this.overlayFrame).show();
	},
	
	onDisable:function() {
		this.visible = false;
		$(this.overlayFrame).hide();
	},

	
	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},
	
	getIndex:function() {
		return 1000;
	},
	
	getName:function() {
		return "CaptionsPlayerOverlayPlugin";
	}
});

paella.plugins.captions.instances.captionsPlayerOverlayPlugin = new paella.plugins.captions.classes.CaptionsPlayerOverlayPlugin();



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Captions Editor Plugin
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
paella.plugins.captions.classes.CaptionsEditorPlugin = Class.create(paella.editor.TrackPlugin,{
	tracks:[],
	selectedTrackItem:null,

	initialize:function() {
		this.parent();
		var thisClass = this;
		if (paella.utils.language()=="es") {
			var esDict = {
				'Captions':'Subtítulos',
				'Show':'Mostrar',
				'Hide':'Ocultar',
				'Show captions':'Mostrar subtítulos',
				'Hide captions':'Ocultar subtítulos'
			};
			paella.dictionary.addDictionary(esDict);
		}
		
		$(document).bind(paella.plugins.captions.events.loaded,function(event,params) {
			for (var i =0; i<paella.plugins.captions.captions.length; i=i+1){
				var c = paella.plugins.captions.captions[i];
				var id = thisClass.getTrackUniqueId();
				thisClass.tracks.push({id:id,s:c.begin,e:c.duration,content:c.value, lock:true});
			}
		});
		
	},

	getTrackItems:function() {
		for (var i=0;i<this.tracks.length;++i) {
			this.tracks[i].name = this.tracks[i].content;
		}
		return this.tracks;
	},
	
	getTools:function() {
		var tools = [
			{name:'show',label:paella.dictionary.translate('Show'),hint:paella.dictionary.translate('Show captions')},
			{name:'hide',label:paella.dictionary.translate('Hide'),hint:paella.dictionary.translate('Hide captions')}
		];
		if (paella.plugins.captions.enableEdit == true){
			tools.push({name:'create',label:paella.dictionary.translate('Create'),hint:paella.dictionary.translate('Create a new caption in the current position')});
			tools.push({name:'delete',label:paella.dictionary.translate('Delete'),hint:paella.dictionary.translate('Delete selected caption')});
		}
		
		return tools;
	},
	
	getTrackItemIndex:function(item) {
		for(var i=0;i<this.tracks.length;++i) {
			if (item.id==this.tracks[i].id) {
				return i;
			}
		}
		return -1;
	},

	onToolSelected:function(toolName) {
		if (this.selectedTrackItem && toolName=='delete' && this.selectedTrackItem) {
			this.tracks.splice(this.getTrackItemIndex(this.selectedTrackItem),1);
			return true;
		}
		else if (toolName=='show') {
			$(document).trigger(paella.plugins.captions.events.enable, {});
		}
		else if (toolName=='hide') {
			$(document).trigger(paella.plugins.captions.events.disable, {});
		}
		else if (toolName=='create') {
			var start = paella.player.videoContainer.currentTime();
			var end = start + 5;
			var id = this.getTrackUniqueId();
			this.tracks.push({id:id,s:start,e:end,content:paella.dictionary.translate('Caption')});
			return true;
		}
	},
	
	getTrackUniqueId:function() {
		var newId = -1;
		if (this.tracks.length==0) return 1;
		for (var i=0;i<this.tracks.length;++i) {
			if (newId<=this.tracks[i].id) {
				newId = this.tracks[i].id + 1;
			}
		}
		return newId;
	},
	
	getName:function() {
		return "CaptionsEditorPlugin";
	},
	
	getTrackName:function() {
		return paella.dictionary.translate("Captions");
	},
	
	getColor:function() {
		return 'rgb(212, 212, 224)';
	},
	
	getTextColor:function() {
		return 'rgb(90,90,90)';
	},
	
	onTrackChanged:function(id,start,end) {
		var item = this.getTrackItem(id);
		if (item) {
			item.s = start;
			item.e = end;
			this.selectedTrackItem = item;
		}
	},
	
	onTrackContentChanged:function(id,content) {
		var item = this.getTrackItem(id);
		if (item) {
			item.content = content;
			item.name = content;
		}
	},
	
	allowEditContent:function() {
		return paella.plugins.captions.enableEdit;
	},
	
	getTrackItem:function(id) {
		for (var i=0;i<this.tracks.length;++i) {
			if (this.tracks[i].id==id) return this.tracks[i];
		}
	},
	
	contextHelpString:function() {
		if (paella.utils.language()=="es") {
			return "Utiliza esta herramienta para crear, borrar y editar subtítulos. Para crear un subtítulo, selecciona el instante de tiempo haciendo clic en el fondo de la línea de tiempo, y pulsa el botón 'Crear'. Utiliza esta pestaña para editar el texto de los subtítulos";
		}
		else {
			return "Use this tool to create, delete and edit video captions. To create a caption, select the time instant clicking the timeline's background and press 'create' button. Use this tab to edit the caption text.";
		}
	}
});

paella.plugins.captions.instances.captionsEditorPlugin = new paella.plugins.captions.classes.CaptionsEditorPlugin();


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








paella.plugins.SearchPlugin  = Class.create(paella.TabBarPlugin,{
	id:null,
	divRoot:null,
	divSearchBar:null,
	divLoading:null,
	divResults:null,
	divSearch:null,
	divSearchBarRelevance:null,
	resultsEntryID:'',
	foundAlready:false, // flag if something has already been found
	lastHit:'',         // storage for latest successful search hit
	proxyUrl:'',
	useJsonp:false,
	
	getIndex:function() {
		return 100;
	},
	
	getTabName:function() {
		return paella.dictionary.translate("Search");
	},
	
	getRootNode:function(id) {
		if (paella.player.config.proxyLoader && paella.player.config.proxyLoader.enabled) {
			this.proxyUrl = paella.player.config.proxyLoader.url;
		}
		this.useJsonp = paella.player.config.proxyLoader.usejsonp;

		this.id = id + 'segmentTextPlugin';
		this.divRoot = new DomNode('div',this.id ,{display:'block'});

		this.divLoading = new DomNode('div',this.id+"_loading" ,{display:'none'});		
		this.divSearch = new DomNode('div',this.id+"_search" ,{display:'block'});

		this.divResults = new DomNode('div',this.id+"_results" ,{display:'block'});
        
        this.resultsEntryID =  this.divResults.identifier+"_entry_";                
		this.prepareSearchBar();
		
		this.divRoot.addNode(this.divSearchBar);
		this.divRoot.addNode(this.divLoading);
		this.divRoot.addNode(this.divSearch);
		this.divRoot.addNode(this.divResults);
		
		this.loadSegmentText();		
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
		inputElement.domElement.value = paella.dictionary.translate("Search in this recording");
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
		r1.domElement.innerHTML = paella.dictionary.translate("Search Relevance:");
		r2.domElement.innerHTML = "&lt; 30%";
		r3.domElement.innerHTML = "&lt; 70%";
		r4.domElement.innerHTML = "&gt; 70%";
		
		r2.domElement.className="segmentTextPlugin_searchBar_revelanceInfo"
		r3.domElement.className="segmentTextPlugin_searchBar_revelanceInfo"
		r4.domElement.className="segmentTextPlugin_searchBar_revelanceInfo"
		
		this.divSearchBarRelevance.addNode(r1);
		this.divSearchBarRelevance.addNode(r2);
		this.divSearchBarRelevance.addNode(r3);
		this.divSearchBarRelevance.addNode(r4);
		divSearchBarRight.addNode(this.divSearchBarRelevance);
		
		this.divSearchBar.addNode(divSearchBarLeft);
		this.divSearchBar.addNode(divSearchBarRight);
	},
        
        setNoActualResultAvailable:function(searchValue) {
         	this.divSearch.domElement.innerHTML = paella.dictionary.translate("Results for '{0}; (no actual results for '{1}' found)").replace(/\{0\}/g,this.lastHit).replace(/\{1\}/g,searchValue);
         	
        },
	
        setResultAvailable:function(searchValue) {
         	this.divSearch.domElement.innerHTML =  paella.dictionary.translate("Results for '{0}'").replace(/\{0\}/g,searchValue);
        },
        
        setNotSearch:function() {
         	this.divSearch.domElement.innerHTML="";
        },

	doSearch:function(value) {
		var thisClass = this;
		this.divSearchBarRelevance.domElement.style.display="block";
		this.setLoading(true);

                var segmentsAvailable = false;
		
		var restEndpoint = paella.player.config.restServer.url + "search/episode.json"; 		
		new paella.Ajax(restEndpoint,{id:paella.matterhorn.episode.id, q:value}, function(response) {
			if (typeof(response)=="string") {
				try{
					response = JSON.parse(response);
				}
				catch(e) {response=null;}
			}		

			if (response){
				paella.debug.log("Searching id="+paella.matterhorn.episode.id+ " q=" + value);
	
	
	                        segmentsAvailable = (response !== undefined) && (response['search-results'] !== undefined) &&
	                            (response['search-results'].result !== undefined) && 
	                            (response['search-results'].result.segments !== undefined) && 
	                            (response['search-results'].result.segments.segment.length > 0);
	
	                       
	                        if (value === '') {
	                          thisClass.setNotSearch()
	                        } 
	                        else { 
	                          thisClass.setResultAvailable(value);
	                        }
}
				if (segmentsAvailable)
				{
					var segments = response['search-results'].result.segments;
	
	                                var maxRelevance = 0;
					for (var i =0; i < segments.segment.length; ++i ){
					    var segment = segments.segment[i];
					    if (maxRelevance < parseInt(segment.relevance)) {
	                                        maxRelevance = parseInt(segment.relevance);
	                                    }
					}
	                                paella.debug.log("Max Revelance " + maxRelevance);
	                                
	
					for (var i =0; i < segments.segment.length; ++i ){
						var segment = segments.segment[i];
	                                        var relevance = parseInt(segment.relevance);
	
	                                        var relevanceClass = ''
	                                        if (value !== '') {
	                                          if (relevance <= 0) {
	                                            relevanceClass = 'none_relevance'
	                                          } else if (relevance <  Math.round(maxRelevance * 30 / 100)) {
	                                            relevanceClass = 'low_relevance'
	                                          } else if (relevance < Math.round(maxRelevance * 70 / 100)) {
	                                            relevanceClass = 'medium_relevance'
	                                          } else {
	                                            relevanceClass = 'high_relevance'
	                                          }
	                                        }
	                                        
	                                        var divEntry = thisClass.divResults.getNode( thisClass.resultsEntryID+segment.index)
			                        divEntry.domElement.className="segmentTextPlugin_segments_entry " + relevanceClass;
	                                }
	
	                                if (!thisClass.foundAlready) {
	                                  thisClass.foundAlready = true;
	                                }
	                                thisClass.lastHit = value;
				} else {
	                                paella.debug.log("No Revelance ");
	
	                                if (!thisClass.foundAlready)
	                                { 
	                                    //setNoSegmentDataAvailable();
	                                }
	                                else
	                                {
	                                    thisClass.setNoActualResultAvailable(value);
	                                }
				}	
			thisClass.setLoading(false);
		}, thisClass.proxyUrl, thisClass.useJsonp);
	},

	loadSegmentText:function() {
		var thisClass = this;

		thisClass.setLoading(true);
		this.divResults.domElement.innerHTML = "";
				
				
		var restEndpoint = paella.player.config.restServer.url + "search/episode.json"; 		
		new paella.Ajax(restEndpoint,{id:paella.matterhorn.episode.id, limit:1000}, function(response) {
			if (typeof(response)=="string") {
				response = JSON.parse(response);
			}		
			paella.debug.log("Searching episode="+paella.matterhorn.episode.id);

			if ((response === undefined) || (response['search-results'] === undefined) ||
				(response['search-results'].result === undefined) ||(response['search-results'].result.segments === undefined))
			{
				thisClass.setLoading(false);
				paella.debug.log("Segment Text data not available");
			} else {
				var segments = response['search-results'].result.segments;
				for (var i =0; i < segments.segment.length; ++i ){
					var segment = segments.segment[i];
					thisClass.createSegmentTextEntry(segment);
				}
				thisClass.setLoading(false);
			}

			
		}, thisClass.proxyUrl, thisClass.useJsonp);	
		
	},

	createSegmentTextEntry:function(segment) {
		var thisClass = this;
		var rootID = thisClass.resultsEntryID+segment.index;
		
				
		var divEntry = new DomNode('div',rootID,{});
		divEntry.domElement.onclick = function(){ $(document).trigger( paella.events.seekToTime, {time: segment.time/1000}) };
		divEntry.domElement.className="segmentTextPlugin_segments_entry";

		var divPreview = new DomNode('div',rootID+"_preview_container" ,{display:'inline-block'});
		divPreview.domElement.className = "segmentTextPlugin_segments_entry_preview_container";
		var imgPreview = new DomNode('img',rootID+"_preview" ,{width:'100%'});
		imgPreview.domElement.src = segment.previews.preview.$;
		imgPreview.domElement.className = "segmentTextPlugin_segments_entry_preview";
		divPreview.addNode(imgPreview);
		divEntry.addNode(divPreview);

		var divResultText  = new DomNode('div',rootID+"_text_container" ,{display:'inline-block'});
		divResultText.domElement.className = "segmentTextPlugin_segments_entry_text_container";
		var textResultText = new DomNode('a',rootID+"_text" ,{});
		textResultText.domElement.innerHTML = "<span class='segmentTextPlugin_segments_entry_text_time'>" + paella.utils.timeParse.secondsToTime(segment.time/1000) + "</span> " + segment.text;
		textResultText.domElement.className = "segmentTextPlugin_segments_entry_text";
		divResultText.addNode(textResultText);
		divEntry.addNode(divResultText);

		this.divResults.addNode(divEntry);
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


