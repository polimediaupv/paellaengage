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
		},"",false);
	},
	
	checkPublished:function(episode) {
		var thisClass = this		
		var restEndpoint = paella.player.config.restServer.url +  'annotation/annotations.json'		
		new paella.Ajax(restEndpoint,{episode:episode.id, type:"trim"}, function(response) {
			if (typeof(response)=="string") {
				response = JSON.parse(response);
			}
			published = response.annotations.annotation.value;
			thisClass.appendEpisode(episode, published);			
		});
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
		thumbLink.domElement.target= "_blank";
		thumbLink.domElement.href = "?id=" + episode.id;		

		var thumbImg = new DomNode('img', this.id+"_"+episode.id+"_left_img");
		thumbImg.domElement.src = episode.preview;		

		thumbLink.addNode(thumbImg);
		item_left.addNode(thumbLink);
				
		// Right Node
		var title = new DomNode('div', this.id+"_"+episode.id+"_right_title");
		
		var titleB = new DomNode('b', this.id+"_"+episode.id+"_right_title");
		var titleLink = new DomNode('a', this.id+"_"+episode.id+"_left_a");
		titleLink.domElement.target= "_blank";
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

