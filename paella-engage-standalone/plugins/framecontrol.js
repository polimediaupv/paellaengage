var FrameThumbnail = Class.create(DomNode,{
	isCurrentFrame:null,
	frameData:null,
	nextFrameData:null,
	frameContainer:null,

	initialize:function(frameData,frameContainer) {
		paella.debug.log('create frame thumbnail');
		this.parent('img',frameData.id,{float:'left'});
		this.domElement.className = 'frameThumbnail';
		this.domElement.setAttribute('src',frameData.url);
		this.domElement.setAttribute('height','40');
		this.domElement.setAttribute('width','60');
		this.frameContainer = frameContainer;
		this.frameData = frameData;
		var thisClass = this;
		$(this.domElement).bind('click',function(event) {
                  thisClass.frameContainer.seekToTime(thisClass.frameData.time)
                });
		$(document).bind(paella.events.setTrim,function(event,params) {
			thisClass.checkVisibility(params.trimEnabled,params.trimStart,params.trimEnd);
		});
		$(this.domElement).bind('mouseover',function(event) {
					var frame;
					
					frame = thisClass.frameContainer.frameHiRes[thisClass.frameData.time];
					if (frame === undefined){
						frame = thisClass.frameContainer.frames[thisClass.frameData.time];						
					}
					if (frame != undefined){
						var url = frame.url;
						thisClass.frameContainer.showHiResFrame(url);
					}
                });
		$(this.domElement).bind('mouseout',function(event) {
                  thisClass.frameContainer.removeHiResFrame();
                });
	},
	
	setNextFrameData:function(nextFrameData) {
		this.nextFrameData = nextFrameData;
	},
	
	setCurrent:function(current) {
		this.isCurrentFrame = current;

		if (current) {
			this.domElement.className = 'enabledFrameThumbnail';
		}
		else {
			this.domElement.className = 'frameThumbnail';
		}
	},
	
	checkVisibility:function(trimEnabled,trimStart,trimEnd) {
		if (!trimEnabled) {
			$(this.domElement).show();
		}
		else if (this.frameData.time<trimStart) {
			if (this.nextFrameData && this.nextFrameData.time>trimStart) {
				$(this.domElement).show();
			}
			else {
				$(this.domElement).hide();				
			}
		}
		else if (this.frameData.time>trimEnd) {
			$(this.domElement).hide();
		}
		else {
			$(this.domElement).show();
		}
	}
});

var FramesControl = Class.create(DomNode,{
	frames:{},
	frameHiRes:{},
	currentFrame:null,
        hiResFrame:null,

	initialize:function(id) {
		this.parent('div',id,{position:'absolute',left:'0px',right:'0px',bottom:'37px',display:'block'});
		this.domElement.className = 'frameListContainer';
		this.hide();
		var thisClass = this;
		$(document).bind(paella.events.loadComplete,function(event,params) {
			thisClass.setFrames(params.frames);
			thisClass.obtainHiResFrames();
		});
		$(document).bind(paella.events.timeupdate,function(event,params) { thisClass.onTimeUpdate(params) });
		$(document).bind(paella.events.controlBarWillHide,function(event) { thisClass.hide(); });
	},
	
	seekToTime:function(time) {
		$(document).trigger(paella.events.seekToTime,{time:time + 1});
	},
	
	isVisible:function() {
		return $(this.domElement).is(':visible');
	},
	
	show:function() {
		$(this.domElement).show();
	},
	
	hide:function() {
		$(this.domElement).hide();
	},

	setFrames:function(frames) {
		this.frames = frames;
		var previousFrame = null;
		for(var frame in frames) {
			var frameThumbnail = new FrameThumbnail(frames[frame],this);
			this.addNode(frameThumbnail);
			frameThumbnail.setNextFrameData(previousFrame);
			previousFrame = frame;
		}
	},
	
	highlightCurrentFrame:function(currentTime) {
		var frame = this.getCurrentFrame(currentTime);
		if (this.currentFrame!=frame) {
			if (this.currentFrame!=null) {
				var lastFrame = this.getNode(this.currentFrame.id);
				lastFrame.setCurrent(false);
			}
			this.currentFrame = frame;
			var frameThumbnail = this.getNode(this.currentFrame.id);
			frameThumbnail.setCurrent(true);
		}
	},
	
	getCurrentFrame:function(currentTime) {
		return this.frames[this.getCurrentFrameIndex(currentTime)];
	},
	
	getCurrentFrameIndex:function(currentTime) {
		var currentFrameIndex = 0;
		for (var i=0;i<currentTime;++i) {
			if (this.frames[i]) {
				currentFrameIndex = this.frames[i].time;
			}
		}
		return currentFrameIndex;
	},
	
	onTimeUpdate:function(memo) {
		if (this.isVisible()) {
			this.highlightCurrentFrame(memo.currentTime);
		}
	},

	obtainHiResFrames:function() {
		var unorderedFrames = {}
		var attachments = paella.matterhorn.episode.mediapackage.attachments.attachment; 
		var lastFrameTime = 0;
		for (var attachment in attachments) {
			attachment = attachments[attachment];
			if (attachment.type=="presentation/segment+preview+hires") {
				var url = attachment.url;
				var time = 0;
				if (/time=T(\d+):(\d+):(\d+)/.test(attachment.ref)) {
					time = parseInt(RegExp.$1)*60*60 + parseInt(RegExp.$2)*60 + parseInt(RegExp.$3);
				}
				unorderedFrames[time] = {time:time,url:url,mimetype:attachment.mimetype,id:attachment.id};
				if (time>lastFrameTime) lastFrameTime = time;
			}
		}

		for (var i=0;i<=lastFrameTime;++i) {
			if (unorderedFrames[i]) {
				this.frameHiRes[i] = unorderedFrames[i];
			}
		}
	},

	showHiResFrame:function(url) {
		var frameRoot = document.createElement("div"); 
		var frame = document.createElement("div"); 
		var hiResImage = document.createElement('img'); 
        hiResImage.className = 'frameHiRes';
        hiResImage.setAttribute('src',url);
        hiResImage.setAttribute('style', 'width: 100%;');
          	
		$(frame).append(hiResImage);
		$(frameRoot).append(frame);

        frameRoot.setAttribute('style', 'display: table;');
        frame.setAttribute('style', 'display: table-cell; vertical-align:middle;');
		overlayContainer = paella.player.videoContainer.overlayContainer;
		
		var streams = paella.initDelegate.initParams.videoLoader.streams;
		if (streams.length == 1){
			overlayContainer.addElement(frameRoot, overlayContainer.getMasterRect());
		}
		else if (streams.length >= 2){
			overlayContainer.addElement(frameRoot, overlayContainer.getSlaveRect());
		}
		overlayContainer.enableBackgroundMode();
		this.hiResFrame = frameRoot;
	},

	removeHiResFrame:function() {
		overlayContainer = paella.player.videoContainer.overlayContainer;
		overlayContainer.removeElement(this.hiResFrame);
		overlayContainer.disableBackgroundMode();
	}
});

paella.plugins.FrameControlPlugin = Class.create(paella.PlaybackPopUpPlugin,{
	framesControl:null,
	container:null,
	button:null,

	getTabName:function() {
		return "Diapositivas";
	},
	
	getRootNode:function(id) {
		var thisClass = this;
		this.container = new DomNode('div',id + '_frameControl_container');
		this.button = this.container.addNode(new Button(id + '_frameControl_button','showFramesButton',function(event) { thisClass.showFramesPress(); },true));
		return this.container;
	},
	
	getWidth:function() {
		return 45;
	},
	
	setRightPosition:function(position) {
		this.button.domElement.style.right = position + 'px';
	},
	
	getPopUpContent:function(id) {
		var thisClass = this;
		this.framesControl = new FramesControl(id + '_frameContol_frames');
		$(document).bind(paella.events.seekToTime,function(event){
			if (thisClass.showFramesButton().isToggled()) {
				thisClass.showFramesButton().toggleIcon();
			}
		});

		return this.framesControl;
	},

	showFramesButton:function() {
		return this.button;
	},
	
	showFramesPress:function() {
		if (this.showFramesButton().isToggled()) {
			this.framesControl.show();
		}
		else {
			this.framesControl.hide();
		}
	},
	
	checkEnabled:function(onSuccess) {
			onSuccess(true);
	},
	
	getIndex:function() {
		return 100;
	},
	
	getName:function() {
		return "FrameControlPlugin";
	},
	
	getMinWindowSize:function() {
		return 600;
	}

});

new paella.plugins.FrameControlPlugin();
