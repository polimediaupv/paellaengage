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
