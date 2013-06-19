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
