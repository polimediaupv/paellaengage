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
