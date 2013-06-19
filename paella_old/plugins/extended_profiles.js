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
		this.profilesContainer.addNode(new Button(id + '_extended_profiles_profile1','extendedProfilesProfile1',function(event) { thisClass.profile1Click(); }));
		this.profilesContainer.addNode(new Button(id + '_extended_profiles_profile2','extendedProfilesProfile2',function(event) { thisClass.profile2Click(); }));
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
	
	profile1Click:function() {
		$(this.profilesContainer.domElement).hide();
		this.button.toggle();
		paella.extended.setMainProfile();
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
	
	profile2Click:function() {
		$(this.profilesContainer.domElement).hide();
		this.button.toggle();
		paella.extended.setProfile('profile2');
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

