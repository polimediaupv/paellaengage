paella.plugins.SearchPlugin  = Class.create(paella.TabBarPlugin,{
	id:null,
	divRoot:null,
	divSearchBar:null,
	divLoading:null,
	divResults:null,
	divSearchBarRelevance:null,
	
	getIndex:function() {
		return 100;
	},
	
	getTabName:function() {
		return "Search";
	},
	
	getRootNode:function(id) {
		this.id = id + 'searchPlugin';
		this.divRoot = new DomNode('div',this.id ,{display:'block'});

		this.divLoading = new DomNode('div',this.id+"_loading" ,{display:'none'});		
		this.divResults = new DomNode('div',this.id+"_results" ,{display:'block'});		
		this.prepareSearchBar();
		
		this.divRoot.addNode(this.divSearchBar);
		this.divRoot.addNode(this.divLoading);
		this.divRoot.addNode(this.divResults);
		
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
		inputElement.domElement.value = "Search this recording";
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
		r1.domElement.innerHTML = "Search Relevance: ";
		r2.domElement.innerHTML = "&lt; 30%";
		r3.domElement.innerHTML = "&lt; 70%";
		r4.domElement.innerHTML = "&gt; 70%";
		
		r2.domElement.className="searchPlugin_searchBar_revelanceInfo"
		r3.domElement.className="searchPlugin_searchBar_revelanceInfo"
		r4.domElement.className="searchPlugin_searchBar_revelanceInfo"
		
		this.divSearchBarRelevance.addNode(r1);
		this.divSearchBarRelevance.addNode(r2);
		this.divSearchBarRelevance.addNode(r3);
		this.divSearchBarRelevance.addNode(r4);
		divSearchBarRight.addNode(this.divSearchBarRelevance);
		
		this.divSearchBar.addNode(divSearchBarLeft);
		this.divSearchBar.addNode(divSearchBarRight);
	},
	
	doSearch:function(value) {
		var thisClass = this;
		this.divSearchBarRelevance.domElement.style.display="block";
		this.setLoading(true);
		
		var restEndpoint = paella.player.config.restServer.url + "search/episode.json"; 		
		new paella.Ajax(restEndpoint,{id:paella.matterhorn.episode.id, q:value}, function(response) {
			paella.debug.log("Searching id="+paella.matterhorn.episode.id+ " q=" + value);
			
			thisClass.divResults.domElement.innerHTML='Results for "'+value+'" (no actual results for "'+value+'" found)'			
			
			thisClass.setLoading(false);
		}, paella.player.config.proxyLoader.url, paella.player.config.proxyLoader.usejsonp);
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