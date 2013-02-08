paella.plugins.DescriptionPlugin  = Class.create(paella.TabBarPlugin,{
	id:null,
	divRoot:null,
	desc: { date:'-', contributor:'-', language:'-', views:'-', serie:'-', presenter:'-', description:'-', title:'-', subject:'-' },
	
	getIndex:function() {
		return 10;
	},
	
	getTabName:function() {
		return "Description";
	},
	
	getRootNode:function(id) {
		this.id = id + 'descriptionPlugin';
		this.divRoot = new DomNode('div',this.id ,{display:'block'});
		
		this.doDescription();		
		return this.divRoot;		
	},
	
	doDescription:function() {
		var thisClass = this;
				
		if (paella.matterhorn.episode.dcTitle) { this.desc.title = paella.matterhorn.episode.dcTitle }
		if (paella.matterhorn.episode.dcIsPartOf) { this.desc.serie = paella.matterhorn.episode.dcIsPartOf }
		if (paella.matterhorn.episode.dcCreator) { this.desc.presenter = paella.matterhorn.episode.dcCreator }
		if (paella.matterhorn.episode.dcContributor) { this.desc.contributor = paella.matterhorn.episode.dcContributor }
		if (paella.matterhorn.episode.dcDescription) { this.desc.description = paella.matterhorn.episode.dcDescription }
		if (paella.matterhorn.episode.dcLanguage) { this.desc.language = paella.matterhorn.episode.dcLanguage }
		if (paella.matterhorn.episode.dcSubject) { this.desc.subject = paella.matterhorn.episode.dcSubject }		

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
				response = JSON.parse(response);
			}
			thisClass.desc.views = response.stats.views;
			thisClass.insertDescription();
		},"",false);
	},
	
	insertDescription:function() {			
		var divDate = new DomNode('div',this.id+"_Date", {});
		var divContributor = new DomNode('div',this.id+"_Contributor" , {});
		var divLanguage = new DomNode('div',this.id+"_Language" , {});
		var divViews = new DomNode('div',this.id+"_Views" , {});
		var divTitle = new DomNode('div',this.id+"_Title", {});
		var divSubject = new DomNode('div',this.id+"_Subject", {});
		var divSeries = new DomNode('div',this.id+"_Series", {});
		var divPresenter = new DomNode('div',this.id+"_Presenter", {});
		var divDescription = new DomNode('div',this.id+"_Description", {});

		divDate.domElement.innerHTML = 'Date: <span style="color:grey;">'+this.desc.date+'</span>';
		divContributor.domElement.innerHTML = 'Contributor: <span style="color:grey;">'+this.desc.contributor+'</span>';
		divLanguage.domElement.innerHTML = 'Language: <span style="color:grey;">'+this.desc.language+'</span>';
		divViews.domElement.innerHTML = 'Views: <span style="color:grey;">'+this.desc.views+'</span>';			
		divTitle.domElement.innerHTML = 'Title: <span style="color:grey;">'+this.desc.title+'</span>';
		divSubject.domElement.innerHTML = 'Subject: <span style="color:grey;">'+this.desc.subject+'</span>';
		divSeries.domElement.innerHTML = 'Series: <a href="/engage/ui/index.html?series='+this.desc.serie+'">'+this.desc.serie+'</a>';
		divPresenter.domElement.innerHTML = 'Presenter: <a href="/engage/ui/index.html?q='+this.desc.presenter+'">'+this.desc.presenter+'</a>';
		divDescription.domElement.innerHTML = 'Description: <span style="color:grey;">'+this.desc.description+'</span>';

		//---------------------------//			
		var divLeft = new DomNode('div',this.id+"_Left" ,{float:'left', padding: '1em 1.4em'});			

		divLeft.addNode(divTitle);
		divLeft.addNode(divPresenter);
		divLeft.addNode(divSeries);			
		divLeft.addNode(divDate);		
		divLeft.addNode(divViews);
		
		//---------------------------//
		var divRight = new DomNode('div',this.id ,{float:'right', marginRight: '300px', padding: '1em 1.4em'});		

		divRight.addNode(divContributor);
		divRight.addNode(divSubject);
		divRight.addNode(divLanguage);
		divRight.addNode(divDescription);
			
			
		this.divRoot.addNode(divLeft);	
		this.divRoot.addNode(divRight);	
	}
	
});

new paella.plugins.DescriptionPlugin();