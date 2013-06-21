paella.plugins.FullscreenPlugin = Class.create(paella.PlaybackPopUpPlugin,{
	button:null,

	getRootNode:function(id) {
		var thisClass = this;
		this.button = new Button(id + '_fullscreen_button','fullscreenButton',function(event) { thisClass.switchFullscreen(); }, false);
		return this.button;
	},

	getWidth:function() {
		return 45;
	},
	
	setRightPosition:function(position) {
		this.button.domElement.style.right = position + 'px';
	},

	getPopUpContent:function(id) {
		return null;
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
		fs.style.width = '100%';
		fs.style.height = '100%';
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
			else if (fs.mozRequestFullScreen){
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
		var enabled = (paella.extended==null);
		if (window!=window.top) {enabled = false;}

		onSuccess(enabled);
	},
	
	getIndex:function() {
		return 103;
	},
	
	getName:function() {
		return "FullScreenButtonPlugin";
	}
});

new paella.plugins.FullscreenPlugin();