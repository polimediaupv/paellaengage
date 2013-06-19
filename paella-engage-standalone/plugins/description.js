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