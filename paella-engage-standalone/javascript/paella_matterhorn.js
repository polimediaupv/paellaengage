paella.matterhorn = {
	series:{
		serie:null,
		acl:null
	},
	episode:null,
	me:null,
	access:{write:false,read:false,contribute:false,isAnonymous:false}
};

paella.matterhorn.UserRoleManager = Class.create({
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
		var params = {"episodes":"true", "id":id};
		var url = this.serverUrl + "search/series.json";
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

paella.matterhorn.MatterhornData = Class.create({
	restServer:'',
	series:'',
	episodes:'',
	proxyUrl:false,
	useJsonp:false,

	initialize:function(config) {
		this.restServer = config.restServer.url;
		this.series = config.restServer.seriesJson;
		this.episodes = "search/episode.json";
		if (config.proxyLoader && config.proxyLoader.enabled) {
			this.proxyUrl = config.proxyLoader.url;
		}
		this.useJsonp = config.proxyLoader.usejsonp;
	},
	
	isStreaming:function(track) {
		return /rtmp:\/\//.test(track.url);
	},

	loadVideoData:function(id,onSuccess) {
		var parameters = {id:id};
		var episodesUrl = this.restServer + this.episodes;
		var thisClass =this;

		new paella.Ajax(episodesUrl,{id:id},function(data) {
			var jsonData = data;
			if (typeof(jsonData)=="string") jsonData = JSON.parse(jsonData);
			
			var result = jsonData['search-results'].result;
			if (result) {
				paella.matterhorn.episode = result;
				var tracks = result.mediapackage.media.track;
				if (!(tracks instanceof Array)){
				    tracks = [tracks];
				}				
				var presenterData = {sources:{}};
				var presentationData = {sources:{}};
				
				var presenterFound = false;
				var presentationFound = false;
					
				for (var i=0;i<tracks.length;++i) {
					var track = tracks[i];
					var sourceInfo = {}
					sourceInfo.src = track.url;
					sourceInfo.type = track.mimetype;
					var destinationData;
					
					if ((track.type=='presenter/delivery') || (track.type=='presentation/delivery')){
						if  (track.url!="") {
						    if (track.type=='presenter/delivery') {
								destinationData = presenterData;
								presenterFound = true;
						    }
						    else if (track.type=='presentation/delivery') {
								destinationData = presentationData;
								presentationFound = true;
						    }

						    if (thisClass.isStreaming(track)) {
						    	destinationData.sources.rtmp = sourceInfo;
						    }
						    else if (track.mimetype=='video/mp4') {
								destinationData.sources.mp4 = sourceInfo;
						    }
						    else if (track.mimetype=='video/ogg') {
								destinationData.sources.ogg = sourceInfo;
						    }
						    else if (track.mimetype=='video/webm') {
								destinationData.sources.webm = sourceInfo;
						    }
						    else if (track.mimetype=='video/x-flv') {
							    destinationData.sources.flv = sourceInfo;
						    }
						}
					}
				}
				
				var videoData = {};
				if (presenterFound && presentationFound) {
					videoData.master = presenterData;
					videoData.slave = presentationData;
				}
				else if (presenterFound) {
					videoData.master = presenterData;
					videoData.slave = null;
				}
				else if (presentationFound) {
					videoData.master = presentationData;
					videoData.slave = null;
				}
				
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
					else if (attachment.type=="presentation/player+preview") {
						if (videoData.slave) { videoData.slave.preview = attachment.url;}
						else if (videoData.master) { videoData.master.preview = attachment.url;}
					}
					else if (attachment.type=="presenter/player+preview") {
						videoData.master.preview = attachment.url;
					}
				}
	
				for (var i=0;i<=lastFrameTime;++i) {
					if (unorderedFrames[i]) {
						videoData.frames[i] = unorderedFrames[i];
					}
				}
	
				onSuccess(videoData);
			}
			else {
				var message = paella.dictionary.translate("The specified video identifier does not exist");
				paella.messageBox.showError(message);
				$(document).trigger(paella.events.error,{error:message});
			}
		},this.proxyUrl,this.useJsonp);
	}
});

paella.matterhorn.AccessControl = Class.create(paella.AccessControl,{
	checkAccess:function(onSuccess) {
		var thisClass = this;
		var roleManager = new paella.matterhorn.UserRoleManager(paella.player.config);
		roleManager.checkAccess(function(canRead,canContribute,canWrite,loadError,isAnonymous) {
			thisClass.permissions.canRead = canRead;
			thisClass.permissions.canContribute = canContribute;
			thisClass.permissions.canWrite = canWrite;
			thisClass.permissions.loadError = loadError;
			thisClass.permissions.isAnonymous = isAnonymous;
			onSuccess(thisClass.permissions);
		});
	}
});

paella.matterhorn.VideoLoader = Class.create(paella.VideoLoader,{
	loadVideo:function(videoId,onSuccess) {
		var matterhornData = new paella.matterhorn.MatterhornData(paella.player.config);
		var thisClass = this;
		matterhornData.loadVideoData(videoId,function(videoData) {
			thisClass.loadStatus = true;
			thisClass.frameList = videoData.frames;
			thisClass.streams.push(videoData.master);
			if (videoData.slave) {
				thisClass.streams.push(videoData.slave);
			}			
			onSuccess();
		});	
	}
});



paella.matterhorn.AnnotationService = Class.create({
	serverUrl:'',
	proxyUrl:'',
	useJsonp:false,

	initialize:function(config) {
		this.serverUrl = config.restServer.url;
		if (config.proxyLoader && config.proxyLoader.enabled) {
			this.proxyUrl = config.proxyLoader.url;
		}
		this.useJsonp = config.proxyLoader.usejsonp;
	},

	getAnnotation:function(annotationId, onSuccess, onError) {
		var restEndpointGetAnnotation = this.serverUrl + "annotation/"+annotationId+".json"; 		
		new paella.Ajax(restEndpointGetAnnotation, {}, function(response) {
			if (typeof(response)=="string") {
				try {
					response = JSON.parse(response);
				}
				catch(e) {response = null;}
			}
			if (response && response.annotation){
				if (onSuccess) onSuccess(response.annotation);
			}
			else{
				if (onError) onError();
			}
		}, this.proxyUrl, this.useJsonp, 'GET');		
	},
	
	getAnnotations:function(episodeId, type, limit, offset, onSuccess, onError) {
		var restEndpointGetAnnotation = this.serverUrl + "annotation/annotations.json"; 		
		new paella.Ajax(restEndpointGetAnnotation, {episode:episodeId, type:type, limit:limit, offset:offset}, function(response) {
			if (typeof(response)=="string") {
				try {
					response = JSON.parse(response);
				}
				catch(e) {response = null;}
			}
			if (response){
				if (onSuccess) onSuccess(response.annotations);
			}
			else{
				if (onError) onError();
			}
		}, this.proxyUrl, this.useJsonp, 'GET');	
	},

	putAnnotation:function(episodeId, type, value, inPoint, outPoint, onSuccess, onError){
		var restEndpoint = this.serverUrl + "annotation"; 		
		new paella.Ajax(restEndpoint,{episode:episodeid, type:type, in:inPoint, out:outPoint, value:value}, function(response) {
			if (onSuccess) onSuccess();
		}, this.proxyUrl, this.useJsonp, 'PUT');
	},

	updateAnnotation:function(annotationId, value, onSuccess, onError) { 
		var restEndpoint = this.serverUrl + "annotation/" + annotationId; 		
		new paella.Ajax(restEndpoint, {value:value}, function(response) {
			if (onSuccess) onSuccess();
		}, this.proxyUrl, this.useJsonp, 'PUT');
	
	},
	
	deleteAnnotation:function(annotationId, onSuccess, onError) { 
		var restEndpoint = this.serverUrl + "annotation/" + annotationId; 		
		new paella.Ajax(restEndpoint, {}, function(response) {
			if (onSuccess) onSuccess();
		}, this.proxyUrl, this.useJsonp, 'DELETE');
	}
});



paella.matterhorn.LoaderSaverInfo = Class.create({

	AsyncLoaderAjaxCallback: Class.create(paella.AsyncLoaderCallback,{
		url:null,
		params:null,
		onSuccess:null,
		proxyUrl:null,
		useJsonp:null,
		method:null,
		
		initialize:function(url,params,onSuccess,proxyUrl,useJsonp,method) {
			this.parent("pluginAjaxCallback");
			this.url = url;
			this.params = params;
			this.onSuccess = onSuccess;
			this.proxyUrl = proxyUrl;
			this.useJsonp = useJsonp;
			this.method = method;
		},
		
		load:function(onSuccess,onError) {
			var thisClass = this;
			new paella.Ajax(this.url,this.params, function(response) {
//						if (thisClass.onSuccess) thisClass.onSuccess(response);
						if (onSuccess) onSuccess();
			}, this.proxyUrl, this.useJsonp, this.method);	
		}
	}),
	config:null,
	
	initialize:function(config) {
		this.config = config;
	},

	loadData:function(episodeid, type, onSuccess, onError){
		var proxyUrl = '';
		var useJsonp = this.config.proxyLoader.usejsonp;
		if (this.config.proxyLoader && this.config.proxyLoader.enabled) {
			proxyUrl = this.config.proxyLoader.url;
		}
		var restEndpointGetAnnotationsList = this.config.restServer.url + "annotation/annotations.json"; 		
		new paella.Ajax(restEndpointGetAnnotationsList,{episode:episodeid, type:type, limit:1}, function(response) {
			if (typeof(response)=="string") {
				try {
					response = JSON.parse(response);
				}
				catch(e) {response = null;}
			}
			if (response){
				var value = "";
				if (response.annotations.total == 1){
					value = response.annotations.annotation.value;
					if (onSuccess) onSuccess(value);
				}
				else{
					if (onError) onError();					
				}
			}
			else{
				if (onError) onError();
			}
		}, proxyUrl, useJsonp, 'GET');			
	},
	
	saveData:function(episodeid, type, value, onSuccess, onError){
		var thisClass = this;
		var proxyUrl = '';
		var useJsonp = this.config.proxyLoader.usejsonp;
		if (this.config.proxyLoader && this.config.proxyLoader.enabled) {
			proxyUrl = this.config.proxyLoader.url;
		}
		var restEndpointGetAnnotationsList = this.config.restServer.url + "annotation/annotations.json"; 		
		var restEndpointPutAnnotation = this.config.restServer.url + "annotation";
		var restEndpointDeleteAnnotation = this.config.restServer.url + "annotation";

		
		new paella.Ajax(restEndpointGetAnnotationsList,{episode:episodeid, type:type, limit:1000}, function(response) {
			if (typeof(response)=="string") {
				response = JSON.parse(response);
			}		
			var asyncLoader = new paella.AsyncLoader();
			
			if (response.annotations.total>0) {
				if (!(response.annotations.annotation instanceof Array)){
				    response.annotations.annotation = [response.annotations.annotation];
				}	
				//There are annotations of the desired type, deleting...
				for (var i=0; i< response.annotations.total; i=i+1){
					asyncLoader.addCallback(new thisClass.AsyncLoaderAjaxCallback(restEndpointDeleteAnnotation+"/"+response.annotations.annotation[i].annotationId, {}, function(response) {}, proxyUrl, useJsonp, 'DELETE'));
				}
			}
			
			asyncLoader.load(function() {
				new paella.Ajax(restEndpointPutAnnotation,{episode:episodeid, type:type, in:0, out:0, value:value}, function(response) {
					if (onSuccess) onSuccess();
				}, proxyUrl, useJsonp, 'PUT'); 			
			},
			function() {
				if (onError) onError();
			});			
		}, proxyUrl, useJsonp, 'GET');	
	}	

});



paella.matterhorn.SearchEpisode = Class.create({
	config:null,
	proxyUrl:'',
	recordingEntryID:'',
	useJsonp:false,
	divLoading:null,
	divResults:null,
			
	AsyncLoaderPublishCallback: Class.create(paella.AsyncLoaderCallback,{
		config:null,
		recording:null,
		
		initialize:function(config, recording) {
			this.parent("AsyncLoaderPublishCallback");
			this.config = config;
			this.recording = recording;
		},
		
		load:function(onSuccess,onError) {
			var thisClass = this;
			
			var loader = new paella.matterhorn.LoaderSaverInfo(thisClass.config);
			
			loader.loadData(this.recording.id, "paella/publish", function(response) {

				if (response == true){
					thisClass.recording.entry_published_class = "published";					
				}
				else if (response == false){
					thisClass.recording.entry_published_class = "unpublished";					
				}
				else if (response == "undefined"){
					thisClass.recording.entry_published_class = "pendent";					
				}
					
				onSuccess();
			}, function(){
				thisClass.recording.entry_published_class = "no_publish_info";
				onSuccess();
			});
		}
	}),
	
	initialize:function(config) {
		this.config = config;
		if (config.proxyLoader && config.proxyLoader.enabled) {
			this.proxyUrl = config.proxyLoader.url;
		}
		this.useJsonp = config.proxyLoader.usejsonp;
	},
	
	doSearch:function(params, domElement) {
		var thisClass = this;
		var divList = domElement; //document.getElementById(divListId);
		divList.innerHTML = "";

		this.recordingEntryID =	 domElement.id + "_entry_";				   

		// loading div
		this.divLoading = document.createElement('div');
		this.divLoading.id = thisClass.recordingEntryID + "_loading";
		this.divLoading.className = "recordings_loading";
		this.divLoading.innerHTML = paella.dictionary.translate("Searching...");
		divList.appendChild(this.divLoading);

		// header div
		var divHeader = document.createElement('div');
		divHeader.id = thisClass.recordingEntryID + "_header";
		divHeader.className = "recordings_header";
		divList.appendChild(divHeader);

		this.divResults = document.createElement('div');
		this.divResults.id = thisClass.recordingEntryID + "_header_results";
		this.divResults.className = "recordings_header_results";
		divHeader.appendChild(this.divResults);

		var divNavigation = document.createElement('div');
		divNavigation.id = thisClass.recordingEntryID + "_header_navigation";
		divNavigation.className = "recordings_header_navigation";
		divHeader.appendChild(divNavigation);


		// loading results
		thisClass.setLoading(true);

		paella.debug.log("Params offet: " + params.offset);
		paella.debug.log("Params limit: " + params.limit);
		paella.debug.log("Params q: " + params.q);

		var resultsAvailable = true;
		var restEndpoint = thisClass.config.restServer.url + "search/episode.json"; 		

		new paella.Ajax(restEndpoint, params, function(response) {
			if (typeof(response)=="string") {
				response = JSON.parse(response);
			}		

			var resultsAvailable = (response !== undefined) && 
				(response['search-results'] !== undefined) &&
				(response['search-results'].total !== undefined);

			if (resultsAvailable === false) {
				paella.debug.log("Seach failed, respons:  " + response);
				return;
			}


			var totalItems = parseInt(response['search-results'].total);

			if (totalItems === 0) {
				if (params.q === undefined) {
					thisClass.setResults(paella.dictionary.translate("No recordings"));
				} else {
					thisClass.setResults(paella.dictionary.translate("No recordings found: \"{0}\"").replace(/\{0\}/g, params.q));
				}
			} else {
				var offset = parseInt(response['search-results'].offset);
				var limit = parseInt(response['search-results'].limit);

				var startItem = offset;
				var endItem = offset + limit;
				if (startItem < endItem) {
				  startItem = startItem + 1;
				}

				if ((params.q === undefined) || (params.q == "")) {
					thisClass.setResults(paella.dictionary.translate("Results {0}-{1} of {2}").replace(/\{0\}/g, startItem).replace(/\{1\}/g, endItem).replace(/\{2\}/g, totalItems));
				} else {
					thisClass.setResults(paella.dictionary.translate('Results {0}-{1} of {2} for "{3}"').replace(/\{0\}/g, startItem).replace(/\{1\}/g, endItem).replace(/\{2\}/g, totalItems).replace(/\{3\}/g, params.q));
				}


				// *******************************							
				// *******************************							
				// TODO 
				var asyncLoader = new paella.AsyncLoader();
				var results = response['search-results'].result;
				var restEndpointDeleteAnnotation = thisClass.config.restServer.url + "annotation/annotations.json";
				//There are annotations of the desired type, deleting...
				for (var i =0; i < results.length; ++i ){
					asyncLoader.addCallback(new thisClass.AsyncLoaderPublishCallback(thisClass.config, results[i]));
				}
				 
				asyncLoader.load(function() {
					// create navigation div
					if (results.length < totalItems) {
						// current page
						var currentPage = 1;
						if (params.offset !== undefined) {
							currentPage = (params.offset / params.limit) + 1;
						}
		
						// max page 
						var maxPage = parseInt(totalItems / params.limit);
						if (totalItems % 10 != 0) maxPage += 1;
						maxPage =  Math.max(1, maxPage);
		
						
						// previous link
						var divPrev = document.createElement('div');
						divPrev.id = thisClass.recordingEntryID + "_header_navigation_prev";
						divPrev.className = "recordings_header_navigation_prev";
						if (currentPage > 1) {
							var divPrevLink = document.createElement('a');
							divPrevLink.param_offset = (currentPage - 2) * params.limit;	
							divPrevLink.param_limit	= params.limit;
							divPrevLink.param_q = params.q;
							$(divPrevLink).click(function(event) {
								var params = {};
								params.offset = this.param_offset;
								params.limit = this.param_limit;
								params.q = this.param_q;
								thisClass.doSearch(params, divList);
							});
							divPrevLink.innerHTML = paella.dictionary.translate("Previous");
							divPrev.appendChild(divPrevLink);
						} else {
							divPrev.innerHTML = paella.dictionary.translate("Previous");
						}
						divNavigation.appendChild(divPrev);
		
						var divPage = document.createElement('div');
						divPage.id = thisClass.recordingEntryID + "_header_navigation_page";
						divPage.className = "recordings_header_navigation_page";
						divPage.innerHTML = paella.dictionary.translate("Page:");
						divNavigation.appendChild(divPage);
		
						// take care for the page buttons
						var spanBeforeSet = false;
						var spanAfterSet = false;
						var offsetPages = 2;
						for (var i = 1; i <= maxPage; i++)	{
							var divPageId = document.createElement('div');
							divPageId.id = thisClass.recordingEntryID + "_header_navigation_pageid_"+i;
							divPageId.className = "recordings_header_navigation_pageid";
		
							if (!spanBeforeSet && currentPage >= 5 && i > 1 && (currentPage - (offsetPages + 2) != 1)) {
								divPageId.innerHTML = "..."
								i = currentPage - (offsetPages + 1);
								spanBeforeSet = true;
							}
							else if (!spanAfterSet && (i - offsetPages) > currentPage && maxPage - 1 > i && i > 4) {
								divPageId.innerHTML = "..."
								i = maxPage - 1;
								spanAfterSet = true;
							}
							else {
								if (i !== currentPage) {
									var divPageIdLink = document.createElement('a');
									divPageIdLink.param_offset = (i -1) * params.limit;	
									divPageIdLink.param_limit = params.limit;
									divPageIdLink.param_q = params.q;
									$(divPageIdLink).click(function(event) {
										var params = {};
										params.offset = this.param_offset;
										params.limit = this.param_limit;
										params.q = this.param_q;
										thisClass.doSearch(params, divList);
									});
									divPageIdLink.innerHTML = i
									divPageId.appendChild(divPageIdLink);
								} else {
									divPageId.innerHTML = i
								}
							}
							divNavigation.appendChild(divPageId);
						}
	
						// next link
						var divNext = document.createElement('div');
						divNext.id = thisClass.recordingEntryID + "_header_navigation_next";
						divNext.className = "recordings_header_navigation_next";
						if (currentPage < maxPage) {
							var divNextLink = document.createElement('a');
							divNextLink.param_offset = currentPage * params.limit;	
							divNextLink.param_limit	= params.limit;
							divNextLink.param_q = params.q;
							$(divNextLink).click(function(event) {
								var params = {};
								params.offset = this.param_offset;
								params.limit = this.param_limit;
								params.q = this.param_q;
								thisClass.doSearch(params, divList);
							});
							divNextLink.innerHTML = paella.dictionary.translate("Next");
							divNext.appendChild(divNextLink);
						} else {
							divNext.innerHTML = paella.dictionary.translate("Next");
						}
						divNavigation.appendChild(divNext);
		
					}
	
					// create recording divs 
					for (var i =0; i < results.length; ++i ){
						var recording = results[i];
						  	
						var divRecording = thisClass.createRecordingEntry(i, recording);
						divList.appendChild(divRecording);
					}
				}, null);
			}	
			// finished loading
			thisClass.setLoading(false);
		}, this.proxyUrl, this.useJsonp);
	},		 

	setLoading:function(loading) {
		if (loading == true) {
			this.divLoading.style.display="block"
		} else {
			this.divLoading.style.display="none"
		}
	},
				
	setResults:function(results) {
		//var divResults = document.getElementById(this.recordingEntryID + "_header_results");
		this.divResults.innerHTML = results;
	},
				
	getUrlOfAttachmentWithType:function(recording, type) {
		for (var i =0; i < recording.mediapackage.attachments.attachment.length; ++i ){
			var attachment = recording.mediapackage.attachments.attachment[i];
			if (attachment.type === type) {
				return attachment.url;
			}
		}

		return "";
	},

	createRecordingEntry:function(index, recording) {
		var thisClass = this;
		var rootID = thisClass.recordingEntryID + index;


		var divEntry = document.createElement('div');
		divEntry.id = rootID;


		divEntry.className="recordings_entry " + recording.entry_published_class;
		if (index % 2 == 1) {
			divEntry.className=divEntry.className+" odd_entry";
		} else {
			divEntry.className=divEntry.className+" even_entry";
		}

		var previewUrl = thisClass.getUrlOfAttachmentWithType(recording, "presentation/search+preview");

		var divPreview = document.createElement('div');
		divPreview.id = rootID+"_preview_container";
		divPreview.className = "recordings_entry_preview_container";
		var imgLink = document.createElement('a');
		imgLink.id = rootID+"_preview_link";
		imgLink.className = "recordings_entry_preview_link";
		imgLink.href = 'watch.html?server='+paella.utils.parameters.get("server")+'&id=' + recording.id;
		var imgPreview = document.createElement('img');
		imgPreview.id = rootID+"_preview";
		imgPreview.src = previewUrl;
		imgPreview.className = "recordings_entry_preview";
		imgLink.appendChild(imgPreview);
		divPreview.appendChild(imgLink);
		divEntry.appendChild(divPreview);

		var divResultText = document.createElement('div');
		divResultText.id = rootID+"_text_container";
		divResultText.className = "recordings_entry_text_container";
		

		// title
		var divResultTitleText = document.createElement('div');
		divResultTitleText.id = rootID+"_text_title_container";
		divResultTitleText.className = "recordings_entry_text_title_container";
		var titleResultText = document.createElement('a');
		titleResultText.id = rootID+"_text_title";
		titleResultText.innerHTML = recording.dcTitle;
		titleResultText.className = "recordings_entry_text_title";
		titleResultText.href = 'watch.html?server='+paella.utils.parameters.get("server")+'&id=' + recording.id;
		divResultTitleText.appendChild(titleResultText);
		divResultText.appendChild(divResultTitleText);


		// author
		var author = "&nbsp;";
		var author_search = "";
		if(recording.dcCreator) {
		  author = "by " + recording.dcCreator;
		  author_search = recording.dcCreator; //.replace(" ", "+");
		}
		var divResultAuthorText = document.createElement('div');
		divResultAuthorText.id = rootID+"_text_author_container";
		divResultAuthorText.className = "recordings_entry_text_author_container";
		var authorResultText = document.createElement('a');
		authorResultText.id = rootID+"_text_title";
		authorResultText.innerHTML = author;
		authorResultText.className = "recordings_entry_text_title";
		if (author_search != "") {
			authorResultText.href = '?server='+paella.utils.parameters.get('server')+'&q=' + author_search;
		}
		divResultAuthorText.appendChild(authorResultText);
		divResultText.appendChild(divResultAuthorText);


		// date time
		//var timeDate = recording.mediapackage.start;
		var timeDate = recording.dcCreated;
		if (timeDate) {
			var offsetHours = parseInt(timeDate.substring(20, 22), 10);
			var offsetMinutes = parseInt(timeDate.substring(23, 25), 10);
			if (timeDate.substring(19,20) == "-") {
			  offsetHours = - offsetHours;
			  offsetMinutes = - offsetMinutes;
			}
			var sd = new Date();
			sd.setUTCFullYear(parseInt(timeDate.substring(0, 4), 10));
			sd.setUTCMonth(parseInt(timeDate.substring(5, 7), 10) - 1);
			sd.setUTCDate(parseInt(timeDate.substring(8, 10), 10));
			sd.setUTCHours(parseInt(timeDate.substring(11, 13), 10) - offsetHours);
			sd.setUTCMinutes(parseInt(timeDate.substring(14, 16), 10) - offsetMinutes);
			sd.setUTCSeconds(parseInt(timeDate.substring(17, 19), 10));
			timeDate = sd.toLocaleString();
		} else {
			timeDate = "n.a."
		}

		
		var divResultDateText = document.createElement('div');
		divResultDateText.id = rootID+"_text_date";
		divResultDateText.className = "recordings_entry_text_date";
		divResultDateText.innerHTML = timeDate;
		divResultText.appendChild(divResultDateText);
		
		divEntry.appendChild(divResultText);

		return divEntry;
	}
	
});

