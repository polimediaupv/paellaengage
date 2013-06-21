	
paella.plugins.events.googleAnalytics = {
	track:'ga:track'
};

paella.plugins.GoogleAnalitycs = Class.create(paella.EventDrivenPlugin,{
	_gaq:null,

	getEvents:function() {
		return [paella.events.loadComplete,	
			paella.events.play,	
			paella.events.pause,	
			paella.events.endVideo,		
			paella.plugins.events.googleAnalytics.track];
	},
	
	onEvent:function(eventType, params) {		
		switch (eventType) {
			case paella.events.loadComplete:
				this.loadComplete();
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
	
	loadComplete:function() {
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
