paella.plugins.RepeatButtonPlugin = Class.create(paella.PlaybackControlPlugin,{
	buttonId:'',
	button:null,
	
	getRootNode:function(id) {
		this.buttonId = id + '_repeat_button';
		var thisClass = this;
		this.button = new Button(this.buttonId,'repeatButton',function(event) { thisClass.repeatButtonClick() });
		return this.button;
	},
	
	getWidth:function() {
		return 50;
	},
	
	setLeftPosition:function(left) {
		this.button.domElement.style.left = left + 'px';
		this.button.domElement.style.position = 'absolute';
	},
	
	repeatButtonClick:function() {
		var currentTime = paella.player.videoContainer.currentTime();
		var start = paella.player.videoContainer.trimStart();
		var end = paella.player.videoContainer.trimEnd();
		var duration = paella.player.videoContainer.duration();
		if (paella.player.videoContainer.trimEnabled()) {
			duration = end - start;			
		}
		currentTime = currentTime - start - 30;
		var seekTo = currentTime * 100 / duration;
		$(document).trigger(paella.events.seekTo,{newPositionPercent:seekTo});
	},
	
	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},

	getIndex:function() {
		return 2;
	},
	
	getName:function() {
		return "RepeatButtonPlugin";
	},
	
	getMinWindowSize:function() {
		return 750;
	}
});

new paella.plugins.RepeatButtonPlugin();