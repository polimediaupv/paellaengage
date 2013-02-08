/*
	Copyright 2013 Universitat Politècnica de València Licensed under the
	Educational Community License, Version 2.0 (the "License"); you may
	not use this file except in compliance with the License. You may
	obtain a copy of the License at

http://www.osedu.org/licenses/ECL-2.0

	Unless required by applicable law or agreed to in writing,
	software distributed under the License is distributed on an "AS IS"
	BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
	or implied. See the License for the specific language governing
	permissions and limitations under the License.
*/
var mheditor = {
	layout:{
		editor:{height:'250px',zIndex:1000},
		zoombar:{height:'27px'},
		moviecontainer:{height:'157px',top:'48px'},
		rule:{height:'15px'}
	},

	events:{
		seek:'mheditor:seek',
		commitseek:'mheditor:commitseek',
		trimchanged:'mheditor:trimchanged'
	},

	tools:{
		playbackControl:'tools:playbackControl',
		trimLeft:'tools:trimLeft',
		trimRight:'tools:trimRight'
	},
	
	utils: {
		getData:function(id,onSuccess) {
			var config = paellaPlayer.config;
			var parameters = {id:id,command:'getProperties'};
			var proxyUrl = (config.proxyLoader.enabled) ? config.proxyLoader.url:'';
			new paella.Ajax(config.trimming.url,parameters,function(result) {
				if (typeof(result)=="string") {
					result = JSON.parse(result);
				}
				onSuccess(result);
			},proxyUrl);
		},

		setTrim:function(id,start,end,onSuccess) {
			var trim = new paella.utils.TrimData(paella.player.config)
			var id = paella.utils.parameters.get('id');
			if (end==0) {
				end = paella.player.videoContainer.duration();
			}
			trim.save(id,start,end,"unchanged",function() {
				onSuccess();
			});
		},
		
		setVisible:function(id,onSuccess) {
			var trim = new paella.utils.TrimData(paella.player.config)
			var id = paella.utils.parameters.get('id');
			trim.save(id,-1,-1,"true",function() {
				onSuccess();
			});
		},
		
		setHidden:function(id,onSuccess) {
			var trim = new paella.utils.TrimData(paella.player.config)
			var id = paella.utils.parameters.get('id');
			trim.save(id,-1,-1,"false",function() {
				onSuccess();
			});
		}
	}
};

var paellaEditor = mheditor;

paellaEditor.messages = {
	saveChanges:'Save changes',
	autopublishVideo:'Publish automatically',
	publishVideo:'Publish this video',
	hideVideo:'Hide this video',
	closeEditor:'Close editor',
	trimLeftTool:'Trim left tool',
	selectTool:'Select tool',
	trimRightTool:'Trim right'
}

mheditor.UIButton = Class.create(DomNode,{
	isToggle:false,
	active:false,
	image:null,

	initialize:function(id,style,action,imageName,isToggle,active,tip) {
		this.parent('div',id,style);
		var image = new Image();
		var thisClass = this;
		this.active = active;
		if (tip) this.domElement.setAttribute('title',tip);
		$(image).bind('load',function(event) {
			thisClass.image = image;
			thisClass.setupImage(image,thisClass);
		});
		image.src = 'resources/images/' + imageName;
		$(this.domElement).bind('click',function() { action(thisClass); });
		this.isToggle = isToggle;
	},
	
	hide:function() {
		$(this.domElement).hide();
	},
	
	show:function() {
		$(this.domElement).show();
	},
	
	setupImage:function(image,button) {
		$(button.domElement).bind('mouseover',function(event) { button.onMouseOver(); });
		$(button.domElement).bind('mouseout',function(event) { button.onMouseOut(); })
		$(button.domElement).bind('mouseup',function(event) { button.onMouseUp(); });
		$(button.domElement).bind('mousedown',function(event) { button.onMouseDown(); event.stopPropagation(); });
		var width = image.width;
		var height = image.height;
		var buttonWidth = width/3;
		button.domElement.style.backgroundImage = 'url(' + image.src + ')';
		button.domElement.style.width = buttonWidth + 'px';
		button.domElement.style.height = height + 'px';
		
		if (button.isToggle && button.active) {
			var width = this.image.width;
			var height = this.image.height;
			var buttonWidth = width/3;
			this.domElement.style.backgroundPosition = '-' + (2*buttonWidth) + 'px 0px';
		}
	},

	setActive:function(active) {
		this.active = active;
		if (this.active) {
			var width = this.image.width;
			var height = this.image.height;
			var buttonWidth = width/3;
			this.domElement.style.backgroundPosition = '-' + (2*buttonWidth) + 'px 0px';
		}
		else {
			this.domElement.style.backgroundPosition = '0px 0px';
		}
	},

	onMouseOver:function() {
		var width = this.image.width;
		var height = this.image.height;
		var buttonWidth = width/3;
		
		this.domElement.style.backgroundPosition = '-' + buttonWidth + 'px 0px'; 
	},
	
	onMouseOut:function() {
		if (this.isToggle && this.active) {
			var width = this.image.width;
			var height = this.image.height;
			var buttonWidth = width/3;
			this.domElement.style.backgroundPosition = '-' + (2*buttonWidth) + 'px 0px';
			
		}
		else {
			this.domElement.style.backgroundPosition = '0px 0px';
		}
	},
	
	onMouseDown:function() {
		var width = this.image.width;
		var height = this.image.height;
		var buttonWidth = width/3;
		this.domElement.style.backgroundPosition = '-' + (2*buttonWidth) + 'px 0px';
	},
	
	onMouseUp:function() {
		var width = this.image.width;
		var height = this.image.height;
		var buttonWidth = width/3;
		this.domElement.style.backgroundPosition = '-' + buttonWidth + 'px 0px';
		
		if (this.isToggle) {
			this.active = !this.active;
			if (this.active) {
				this.domElement.style.backgroundPosition = '-' + (2*buttonWidth) + 'px 0px';
			}
		}
	}
});

mheditor.UIHSlider = Class.create(DomNode,{
	size:0,
	currentValue:0,
	range:{min:-100,max:100},
	buttonId:'',

	SliderButton: Class.create(mheditor.UIButton,{
		slider:null,
		mouseDownPosition:0,
		initPositionedOffset:0,

		initialize:function(id,slider,onChange) {
			this.slider = slider;
			var style = {position:'relative',left:'0px',top:'0px'};
			var thisClass = this;
			this.parent(id,style,function(event) {},'slider_button.png');
			$(this.domElement).bind('mousedown',function(event) { paella.utils.mouseManager.down(thisClass,event); event.stopPropagation(); });
			$(this.domElement).bind('mousemove',function(event) { paella.utils.mouseManager.move(event); event.stopPropagation(); });
		},

		down:function(event,x,y) {
			this.mouseDownPosition = x;
			this.initPositionedOffset = $(this.domElement).position().left;
		},

		move:function(event,x,y) {
			var offsetX = x - this.mouseDownPosition;
			var left = this.initPositionedOffset + offsetX;
			var currentValue;
			var range = this.slider.range;
			if (left>0 && left<(this.slider.size-$(this.domElement).width())) {
				this.domElement.style.left = left + 'px';		
				var maxValue = this.slider.size-$(this.domElement).width();
				currentValue = left;
				var rangeValue = range.max - range.min;
				currentValue = (currentValue * rangeValue / maxValue) + range.min;
			}
			else if (left<0) {
				currentValue = range.min;
			}
			else if (left>=(this.slider.size-$(this.domElement).width())) {
				currentValue = range.max;
			}

			if (this.slider.onChange) {
				this.slider.currentValue = currentValue;
				this.slider.onChange(currentValue);
			}
		}
	}),

	initialize:function(id,value,minValue,maxValue,size,style,onChange) {
		this.size = size;
		this.currentValue = value;
		this.range.min = minValue;
		this.range.max = maxValue;
		this.onChange = onChange;
		style.width = size + 'px';
		this.parent('div',id,style);
		var sliderStyle = {backgroundImage:'url(resources/images/slider_left.png)',height:'25px',width:'5px',float:'left'};
		this.addNode(new DomNode('div',id + '_leftSlider',sliderStyle));
		sliderStyle.backgroundImage = 'url(resources/images/slider_bkg.png)';
		sliderStyle.width = (size - 10) + 'px';
		this.addNode(new DomNode('div',id + '_centerSlider',sliderStyle));
		sliderStyle.backgroundImage = 'url(resources/images/slider_right.png)';
		sliderStyle.width = '5px';
		this.addNode(new DomNode('div',id + '_rightSlider',sliderStyle));
		this.buttonId = id + '_button';
		this.addNode(new this.SliderButton(this.buttonId,this));
		this.updateButtonPosition();
		var thisClass = this;
		$(this.domElement).bind('mousedown',function(event) { paella.utils.mouseManager.down(thisClass,event); event.stopPropagation(); });
		$(this.domElement).bind('mousemove',function(event) { paella.utils.mouseManager.move(event); event.stopPropagation(); });
		$(this.domElement).bind('mouseup',function(event) { paella.utils.mouseManager.up(event); });
	},

	down:function(event,x,y) {
		var button = this.button();
		var buttonWidth = $(button.domElement).width();
		var buttonLeft = $(button.domElement).offset().left;
		var offset = x - buttonLeft;
		button.domElement.style.left = ($(button.domElement).offset().left + offset) + 'px';
		button.down(event,x,y);
	},

	move:function(event,x,y) {
		this.button().move(event,x,y);
	},
	
	up:function(event,x,y) {
		this.button().move(event,x,y);
	},

	setValue:function(value) {
		this.currentValue = value;
		this.updateButtonPosition();
	},
	
	updateButtonPosition:function() {
		var maxLeft = this.size - $(this.button().domElement).width();
		var rangeValue = this.range.max - this.range.min;
		var currentRangeValue = this.currentValue - this.range.min;
		var positionLeft = currentRangeValue * maxLeft / rangeValue;
		this.button().domElement.style.left = positionLeft + 'px';
	},
	
	button:function() {
		return this.getNode(this.buttonId);
	},

	onChange:function(newValue) {
		paella.debug.log('new slider value: ' + newValue);
	}
});

mheditor.UIComboBox = Class.create(DomNode,{
	containerId:'',
	fieldId:'',
	selectedValue:null,
	options:null,
	onChange:null,
	
	initialize:function(id,options,selectedValue,style,onChange) {
		this.containerId = id + "_container";
		this.parent('div',this.containerId,style);
		this.fieldId = id;
		this.selectedValue = selectedValue;
		this.options = options;
		this.onChange = onChange;
	
		this.rebuildField();
	},
	
	setValue:function(newValue) {
		this.selectedValue = newValue;
		this.rebuildField();
	},
	
	rebuildField:function() {
		var thisClass = this;
		var container = this.domElement
		if (container) {
			container.innerHTML = "";	
			var selectField = document.createElement("select");
			selectField.id = this.fieldId;
		
			for(var key in this.options) {
				if (this.options.hasOwnProperty(key)) {
					var optionText = this.options[key];
					var option = document.createElement("option");
					option.setAttribute("value", key);
					option.innerHTML = optionText;
					if (key==this.selectedValue) {
						option.setAttribute("selected","selected");
					}
					selectField.appendChild(option);
				}
			}
		
			container.appendChild(selectField);
			$(selectField).bind('change',function(event) {
				if (thisClass.onChange && $(thisClass.fieldId)) {
					thisClass.onChange($('#' + thisClass.fieldId).val());
				}
			});
		}
	}
});

mheditor.Toolbar = Class.create(DomNode,{
	style:{},
	editorContainer:null,
	playButtonId:'',
	pauseButtonId:'',
	previousButtonId:'',
	nextButtonId:'',
	trimStartButtonId:'',
	trimEndButtonId:'',
	selectToolButtonId:'',
	saveChangesButtonId:'',
	closeEditorButtonId:'',
	
	publishCBox:null,
	
	//publishButtonId:'',
	//hideButtonId:'';
	playbackControlsContainer:null,

	initialize:function(id,editorContainer) {
		this.editorContainer = editorContainer;
		this.parent('div',id,this.style);
		this.domElement.className = "paellaEditor_toolbar";
		this.playButtonId = id + '_play_button';
		this.pauseButtonId = id + '_pause_button';
		this.previousButtonId = id + '_prev_button';
		this.nextButtonId = id + '_next_button';
		this.trimStartButtonId = id + '_trim_start_button';
		this.trimEndButtonId = id + '_trim_end_button';
		this.selectToolButtonId = id + '_select_tool_button';
		this.saveChangesButtonId = id + '_save_changes_button';
		this.closeEditorButtonId = id + '_close_editor_button';
		
		var publishCBoxId = id + '_cbox';
		
		//this.publishButtonId = id + '_publish_button';
		//this.hideButtonId = id + '_hide_button';
		
		var thisClass = this;

		this.playbackControlsContainer = this.addNode(new DomNode('div',id + '_playback_controls',{position:'relative',width:'120px',marginLeft:'auto',marginRight:'auto',height:'100%'}));
		this.playbackControlsContainer.addNode(new mheditor.UIButton(this.previousButtonId,{position:'absolute',left:'0px',top:'5px'},function(button) { $(document).trigger(paella.events.previous);}, 'prevButton.png'));
		this.playbackControlsContainer.addNode(new mheditor.UIButton(this.playButtonId,{position:'absolute',left:'40px',top:'5px'},function(button) { $(document).trigger(paella.events.play); },'playButton.png'));
		this.playbackControlsContainer.addNode(new mheditor.UIButton(this.pauseButtonId,{position:'absolute',left:'40px',top:'5px',display:'none'},function(button) { $(document).trigger(paella.events.pause); },'pauseButton.png'));
		this.playbackControlsContainer.addNode(new mheditor.UIButton(this.nextButtonId,{position:'absolute',left:'80px',top:'5px'},function(button) { $(document).trigger(paella.events.next);}, 'nextButton.png'));

		this.addNode(new mheditor.UIButton(this.trimStartButtonId,{position:'absolute',left:'100px',top:'5px'},function(button) { thisClass.trimStartTool(); },'trimStartToolButton.png',true,false,paellaEditor.messages.trimLeftTool));
		this.addNode(new mheditor.UIButton(this.trimEndButtonId,{position:'absolute',left:'140px',top:'5px'},function(button) { thisClass.trimEndTool(); },'trimEndToolButton.png',true,false,paellaEditor.messages.trimRightTool));
		this.addNode(new mheditor.UIButton(this.selectToolButtonId,{position:'absolute',left:'180px',top:'5px'},function(button) { thisClass.selectTool(); },'selectToolButton.png',true,true,paellaEditor.messages.selectTool));

		this.addNode(new mheditor.UIButton(this.closeEditorButtonId,{position:'absolute',right:'10px',top:'5px'},function(button) { thisClass.onCloseEditor(); },'closeEditor.png',false,true,paellaEditor.messages.closeEditor));		
		this.addNode(new mheditor.UIButton(this.saveChangesButtonId,{position:'absolute',right:'300px',top:'5px'},function(button) { thisClass.onSaveChanges(); },'saveChangesButton.png',false,true,paellaEditor.messages.saveChanges));
		var options = {"undefined":paellaEditor.messages.autopublishVideo,"true":paellaEditor.messages.publishVideo,"false":paellaEditor.messages.hideVideo};
		this.publishCBox = this.addNode(new mheditor.UIComboBox(publishCBoxId,options,'false',{position:'absolute',right:'60px',top:'15px'},function(newValue){
			thisClass.onComboBoxValueChanged(newValue);
		}));
		$(document).bind(paella.events.play,function(event) { thisClass.onPlay(); });
		$(document).bind(paella.events.pause,function(event) { thisClass.onPause(); });
		$(document).bind(paella.events.showEditor,function(event) {
			paella.debug.log("Loading cbox info");
			var trim = new paella.utils.TrimData(paella.player.config);
			trim.load(paella.utils.parameters.get('id'),function(data) {
				thisClass.onLoadTrimData(data);
			});
		});
	},

	onComboBoxValueChanged:function(newValue) {
		var trim = new paella.utils.TrimData(paella.player.config);
		trim.save(paella.utils.parameters.get('id'),-1,-1,newValue,function() {
			paella.debug.log("trim saved");
		});
	},

	onLoadTrimData:function(data) {
		paella.debug.log("Información de trim actual: ");
		paella.debug.log(data);
		var combo = this.publishCBox;
		if (combo) {
			if (data.published=="undefined") combo.setValue("undefined");
			else if (data.published) combo.setValue("true");
			else combo.setValue("false");
		}
	},

	onSaveChanges:function() {
		var id = paella.utils.parameters.get('id');
		var trimming = paella.player.videoContainer.trimming;
		paellaEditor.utils.setTrim(id,trimming.start,trimming.end,function(response) {
			$(document).trigger(paella.events.hideEditor);
		});
	},
	
	onCloseEditor:function() {
		$(document).trigger(paella.events.hideEditor);
	},

	trimStartButton:function() {
		return this.getNode(this.trimStartButtonId);
	},
	
	trimEndButton:function() {
		return this.getNode(this.trimEndButtonId);
	},
	
	selectToolButton:function() {
		return this.getNode(this.selectToolButtonId);
	},
	
	previousButton:function() {
		return this.playbackControlsContainer.getNode(this.previousButtonId);
	},

	playButton:function() {
		return this.playbackControlsContainer.getNode(this.playButtonId);
	},

	pauseButton:function() {
		return this.playbackControlsContainer.getNode(this.pauseButtonId);
	},

	nextButton:function() {
		return this.playbackControlsContainer.getNode(this.nextButtonId);
	},
	
	saveChangesButton:function() {
		return this.getNode(this.saveChangesButtonId);
	},
	
	closeEditorButton:function() {
		return this.getNode(this.closeEditorButtonId);
	},
		
	onPlay:function() {
		$(this.playButton().domElement).hide();
		$(this.pauseButton().domElement).show();
	},
	
	onPause:function() {
		$(this.playButton().domElement).show();
		$(this.pauseButton().domElement).hide();
	},
	
	trimStartTool:function() {
		var trimStartButton = this.trimStartButton();
		var trimEndButton = this.trimEndButton();
		var selectToolButton = this.selectToolButton();
		trimStartButton.setActive(true);
		trimEndButton.setActive(false);
		selectToolButton.setActive(false);
		this.editorContainer.timeline().setTool(mheditor.tools.trimLeft);
	},
	
	trimEndTool:function() {
		var trimStartButton = this.trimStartButton();
		var trimEndButton = this.trimEndButton();
		var selectToolButton = this.selectToolButton();
		trimStartButton.setActive(false);
		trimEndButton.setActive(true);
		selectToolButton.setActive(false);
		this.editorContainer.timeline().setTool(mheditor.tools.trimRight);
	},
	
	selectTool:function() {
		var trimStartButton = this.trimStartButton();
		var trimEndButton = this.trimEndButton();
		var selectToolButton = this.selectToolButton();
		trimStartButton.setActive(false);
		trimEndButton.setActive(false);
		selectToolButton.setActive(true);
		this.editorContainer.timeline().setTool(mheditor.tools.playbackControl);
	}
});

mheditor.MovieFrameSet = Class.create(DomNode,{
	thumbnailId:'',

	initialize:function(startTime,endTime,movieDuration,imageUrl) {
		this.thumbmailId = 'frameSet_thumbnail_' + endTime;
		
		var style = {};
		var framesetDuration = endTime - startTime;
		var percentDuration = framesetDuration * 100 / movieDuration;
		style.width = percentDuration + '%';
		style.height = '100%';
		style.float = 'left';
		//style.backgroundImage = 'url(' + imageUrl + ')';
		//style.backgroundImage = 'url(resources/images/movie_frame_background.png)';
		style.position = 'relative';
		
		this.parent('div','frameSet_' + endTime,style);
		this.domElement.className = "paellaEditor_frameSetItem";
		
	//	var image = new Image();
	//	var thisClass = this;
	//	image.observe('load',function(event) {
	//		var thumb = thisClass.addNode(new DomNode('img',thisClass.thumbnailId,{position:'absolute',width:image.width + 'px',overflow:'hidden',border:'solid 1px black',left:'0px',top:'28px'}));
	//		thumb.domElement.setAttribute('height',94);
	//		thumb.domElement.setAttribute('src',image.src);
	//	});
	//	image.src = imageUrl;
	}
});

mheditor.TrimBar = Class.create(DomNode,{
	timeline:null,
	
	initialize:function(id,timeline) {
		this.timeline = timeline;
		var style = {};
		this.parent('div',id,style);
		var image = new Image();
		var thisClass = this;
	},

	onTrimChanged:function(newTrim) {
		this.setPosition(newTrim);
	},

	setPosition:function(percent) {
		this.domElement.style.left = percent + '%';
	}
});

mheditor.TrimBarLeft = Class.create(mheditor.TrimBar,{
	previousTool:mheditor.tools.playbackControl,

	initialize:function(id,timeline) {
		this.parent(id,timeline);
		var thisClass = this;
		this.domElement.className = "paellaEditor_trimBar_left";
		$(document).bind(mheditor.events.trimchanged,function(event,params) { if (params.type=='left') thisClass.onTrimChanged(params.percent); });
		$(this.domElement).bind('mousedown',function(event) {
			thisClass.previousTool = thisClass.timeline.currentTool;
			thisClass.timeline.currentTool = mheditor.tools.trimLeft;
		});
		$(this.domElement).bind('mouseup',function(event) {
			thisClass.timeline.currentTool = thisClass.previousTool;
		});
	}
});

mheditor.TrimBarRight = Class.create(mheditor.TrimBar,{
	initialize:function(id,timeline) {
		this.parent(id,timeline);
		var thisClass = this;
		this.domElement.className = "paellaEditor_trimBar_right";
		$(document).bind(mheditor.events.trimchanged,function(event,params) { if (params.type=='right') thisClass.onTrimChanged(params.percent); });
		$(this.domElement).bind('mousedown',function(event) {
			thisClass.previousTool = thisClass.timeline.currentTool;
			thisClass.timeline.currentTool = mheditor.tools.trimRight;
		});
		$(this.domElement).bind('mouseup',function(event) {
			thisClass.timeline.currentTool = thisClass.previousTool;
		});
	}
});


mheditor.MovieContainer = Class.create(DomNode,{
	style:{},
	movieDuration:0,
	frameList:null,
	timeline:null,
	trimbarLeftId:'',
	trimbarRightId:'',
	enabledFrameId:'',

	initialize:function(id,zoom,timeline) {
		this.timeline = timeline;
		this.trimbarLeftId = id + '_trimbar_left';
		this.trimbarRightId = id + '_trimbar_right';
		this.enabledFrameId = id + '_enabled';
		this.style = {width:zoom + "%"};
		this.parent('div',id,this.style);
		this.domElement.className = 'paellaEditor_frameDisabled';
		this.addNode(new mheditor.TrimBarLeft(this.trimbarLeftId,timeline));
		this.addNode(new mheditor.TrimBarRight(this.trimbarRightId,timeline));
		var enabledFrames = this.addNode(new DomNode('div',this.enabledFrameId,{left:'0%',right:'100%'}));
		enabledFrames.domElement.className = 'paellaEditor_frameEnabled';
		var movieBackground = this.addNode(new DomNode('div',id + '_movie_background',{position:'absolute',left:'0px',top:'0px',width:'100%',height:'100%'}));
//		movieBackground.domElement.setStyle(this.style);
		
		var thisClass = this;
		$(this.domElement).bind('mousedown',function(event) { paella.utils.mouseManager.down(thisClass,event); event.stopPropagation(); });
		$(this.domElement).bind('mousemove',function(event) { paella.utils.mouseManager.move(event); });
		$(this.domElement).bind('mouseup',function(event) { paella.utils.mouseManager.up(event); });
		$(document).bind(mheditor.events.trimchanged,function(event,params) { thisClass.onTrimChanged(params); });
	},
	
	trimbarLeft:function() {
		return this.getNode(this.trimbarLeftId);
	},
	
	trimbarRight:function() {
		return this.getNode(this.trimbarRightId);
	},
	
	darkRight:function() {
		return this.getNode(this.darkRightId);
	},
	
	enabledFrame:function() {
		return this.getNode(this.enabledFrameId);
	},

	refreshTrimmingBarsPosition:function() {
		var videoContainer = this.timeline.videoContainer;
		var zoom = this.timeline.zoom;
		var duration = videoContainer.duration();
		var start = videoContainer.trimming.start;
		var end = videoContainer.trimming.end;
		if (end==0) {
			end = duration;
		}
		start = start * 100 / duration;
		end = end * 100 / duration;
		
		$(this.enabledFrame().domElement).css({left:start + '%',right:100 - end + '%'});
		
		this.trimbarLeft().setPosition(start);
		this.trimbarRight().setPosition(end);
	},
	
	onTrimChanged:function(params) {
		if (params.type=='left') {
			$(this.enabledFrame().domElement).css({left:params.percent + '%'});
		}
		else if (params.type=='right') {
			$(this.enabledFrame().domElement).css({right:100 - params.percent + '%'});
		}
	},
	
	down:function(event,x,y) {
		this.move(event,x,y);
	},
	
	move:function(event,x,y) {
		var scrollLeft = this.timeline.domElement.scrollLeft;
		var barSize = $(this.domElement).width();
		var currentPosition = x + scrollLeft;
		var newPercent = currentPosition * 100 / barSize;
		newPercent = (newPercent>100) ? 100:newPercent;
		$(document).trigger(mheditor.events.seek,{percent:newPercent});
		if (this.timeline.currentTool==mheditor.tools.trimLeft) {
			$(document).trigger(mheditor.events.trimchanged,{type:'left',percent:newPercent});
		}
		else if (this.timeline.currentTool==mheditor.tools.trimRight) {
			$(document).trigger(mheditor.events.trimchanged,{type:'right',percent:newPercent});
		}
	},
	
	up:function(event,x,y) {
		var scrollLeft = this.timeline.domElement.scrollLeft;
		var barSize = $(this.domElement).width();
		var currentPosition = x + scrollLeft;
		var newPercent = currentPosition * 100 / barSize;
		newPercent = (newPercent>100) ? 100:newPercent;
		$(document).trigger(mheditor.events.commitseek,{percent:newPercent});
	},

	setZoom:function(zoom) {
		this.domElement.style.width = zoom + '%';
	},

	setDuration:function(duration) {
		this.duration = duration;
	},

	initFrames:function(frameList) {
	/*	if (this.frameList==null) {
			this.frameList = frameList;
			var currentFrame = null;
			var nextFrame = null;
			for (var frameIndex in this.frameList) { //var i=0;i<this.frameList.length-1;++i) {
				nextFrame = this.frameList[frameIndex];
				if (currentFrame!=null) {
					this.addNode(new mheditor.MovieFrameSet(currentFrame.time,nextFrame.time,this.duration,currentFrame.url));					
				}
				currentFrame = nextFrame;
			}
			this.addNode(new mheditor.MovieFrameSet(currentFrame.time,this.duration,this.duration,currentFrame.url));
		}*/
	}
});

mheditor.RuleContainer = Class.create(DomNode,{
	style:{},
	movieDuration:0,
	timeline:null,

	initialize:function(id,timeline) {
		this.parent('div',id,this.style);
		this.domElement.className = "paellaEditor_ruleContainer";
		$(this.domElement).css({width:timeline.zoom + '%'});
		this.timeline = timeline;
	},
	
	setZoom:function(zoom) {
		this.domElement.style.width = zoom + '%';
		this.redraw();
	},
	
	redraw:function() {
		if (this.movieDuration==0) this.movieDuration = this.timeline.videoContainer.duration(true);
		var movieDuration = this.movieDuration;
		var zoom = this.timeline.zoom;
		// if ruleSize==0, get the timeline width using the document window width
		var ruleSize = $(this.domElement).width();
		if (ruleSize==0) {
			var windowSize = $('body').width();
			ruleSize = windowSize * zoom / 100;
		}
		var markSize = 80;
		var numberOfMarks = ruleSize / (markSize+1); // + 1 => border-left of each mark
		var domElement = this.domElement;
		
		domElement.innerHTML = '';
		var markDuration = movieDuration / numberOfMarks;
		for (var i=0;i<numberOfMarks-1;++i) {
			var mark = document.createElement('div');
			var className = "paellaEditor_playbackMarkItem_odd";
			if (i%2) className = "paellaEditor_playbackMarkItem_even";
			var time = i * markDuration;
			mark.innerHTML = this.secondsToHours(time);
			$(mark).css({width:markSize + 'px'});
			mark.className = className;
			domElement.appendChild(mark);
		}
	},
	
	secondsToHours:function(sec_numb) {
		var hours   = Math.floor(sec_numb / 3600);
		var minutes = Math.floor((sec_numb - (hours * 3600)) / 60);
		var seconds = sec_numb - (hours * 3600) - (minutes * 60);
		
		//if (hours   < 10) {hours   = "0"+hours;}
		if (minutes < 10) {minutes = "0"+minutes;}
		if (seconds < 10) {seconds = "0"+seconds;}
		return hours + ':' + minutes + ':' + Math.floor(seconds);
	}
});

mheditor.PlaybackMark = Class.create(DomNode,{
	timeline:null,

	initialize:function(id,timeline) {
		this.timeline = timeline;
		var style = {}
		this.parent('div',id,style);
		this.domElement.className = "paellaEditor_playbackMarkContainer";
		var playbackMark = this.addNode(new DomNode('div',id + '_offset',style));
		playbackMark.domElement.className = "paellaEditor_playbackMark";
		var thisClass = this;
		$(document).bind(paella.events.timeupdate,function(event,params) { thisClass.onTimeUpdate(params); });
		$(document).bind(mheditor.events.seek,function(event,params) { thisClass.onSeek(params); });

		$(playbackMark.domElement).bind('mousedown',function(event) { paella.debug.log('down'); paella.utils.mouseManager.down(thisClass.timeline.movieContainer(),event); event.stopPropagation(); });
		$(playbackMark.domElement).bind('mousemove',function(event) { paella.utils.mouseManager.move(event); });
		$(playbackMark.domElement).bind('mouseup',function(event) { paella.utils.mouseManager.up(event); });
	},

	onTimeUpdate:function(memo) {
		var currentTime = memo.currentTime;
		var masterVideo = this.timeline.videoContainer.masterVideo();
		var duration = masterVideo.domElement.duration;
		
		var currentPercent = currentTime * this.timeline.zoom / duration;
		
		this.domElement.style.left = currentPercent + '%';
		
		var scrollLeft = this.timeline.domElement.scrollLeft;
		var scrollRight = this.timeline.domElement.scrollLeft + $(this.timeline.domElement).width();
		var playbackPosition = $(this.domElement).offset().left;

		if (scrollLeft>playbackPosition || playbackPosition>scrollRight) {
			this.timeline.domElement.scrollLeft = playbackPosition;
		}
	},
	
	onSeek:function(memo) {
		if (this.timeline.currentTool==mheditor.tools.playbackControl) {
			var currentPercent = memo.percent;
			var zoomPercent = currentPercent * this.timeline.zoom / 100;
			this.domElement.style.left = zoomPercent + '%';	
		}
		//	else if (this.currentTool==mheditor.tools...) {} si hace falta, claro
	}
});

mheditor.Timeline = Class.create(DomNode,{
	style:{},
	editorContainer:null,
	zoom:500,
	zoomLimit:{min:25,max:5000},
	editorContainer:null,
	videoContainer:null,
	movieContainerId:'',
	trimmedMovieContainerId:'',
	ruleContainerId:'',
	playbackMarkId:'',
	currentTool:mheditor.tools.playbackControl,

	initialize:function(id,editorContainer) {
		this.editorContainer = editorContainer;
		this.movieContainerId = id + '_movieContainer';
		this.trimmedMovieContainerId = id + '_movieContainer';
		this.ruleContainerId = id + '_rule';
		this.playbackMarkId = id + '_playback';
		this.parent('div',id,this.style);
		this.domElement.className = "paellaEditor_timeline";
		this.videoContainer = paella.player.videoContainer;
		var movieContainer = this.addNode(new mheditor.MovieContainer(this.movieContainerId,this.zoom,this));
		this.addNode(new mheditor.RuleContainer(this.ruleContainerId,this));
		this.addNode(new mheditor.PlaybackMark(this.playbackMarkId,this));
		var thisClass = this;
		$(document).bind(mheditor.events.commitseek,function(event,params) { thisClass.onCommitSeek(params); });
	},
	
	onCommitSeek:function(memo) {
		if (this.currentTool==mheditor.tools.playbackControl) {
			$(document).trigger(paella.events.seekTo,{ newPositionPercent:memo.percent });
		}
	//	else if (this.currentTool==mheditor.tools...) {}
	},

	buildInterface:function() {
		var movieContainer = this.movieContainer();
		var videoContainer = this.videoContainer;
		var videoData = this.editorContainer.paellaPlayer.videoData;
		movieContainer.setZoom(this.zoom);
		movieContainer.setDuration(videoContainer.duration());
		movieContainer.initFrames(videoData.frames);
		movieContainer.refreshTrimmingBarsPosition();
		var thisClass = this;
		new Timer(function() {
		    thisClass.ruleContainer().redraw();
		},100);
	},
	
	movieContainer:function() {
		return this.getNode(this.movieContainerId);
	},
	
	ruleContainer:function() {
		return this.getNode(this.ruleContainerId);
	},

	setZoom:function(percent) {
		if (percent>this.zoomLimit.min && percent<this.zoomLimit.max) {
			this.zoom = percent;
			this.movieContainer().setZoom(this.zoom);
			this.ruleContainer().setZoom(this.zoom);
		}
	},
	
	zoomIn:function() {
		this.setZoom(this.zoom + 50);
	},
	
	zoomOut:function() {
		this.setZoom(this.zoom - 50);
	},
	
	setTool:function(tool) {
		this.currentTool = tool;
		
		if (this.currentTool==mheditor.tools.trimLeft) {
			this.domElement.style.cursor = "url(resources/images/trim_left_cursor.gif), default";
		}
		else if (this.currentTool==mheditor.tools.trimRight) {
			this.domElement.style.cursor = "url(resources/images/trim_right_cursor.gif), default";
		}
		else {
			this.domElement.style.cursor = "default";
		}
	},
	
	resize:function() {
		this.ruleContainer().redraw();
	}
});

mheditor.Zoombar = Class.create(DomNode,{
	style:{},
	timeline:null,
	editorContainer:null,
	sliderId:'',

	initialize:function(id,editorContainer) {
		this.editorContainer = editorContainer;
		this.timeline = editorContainer.timeline();
		this.parent('div',id,this.style);
		this.domElement.className = "paellaEditor_zoomBar";
		var thisClass = this;
		var zoomCurrent = this.timeline.zoom;
		var zoomMin = this.timeline.zoomLimit.min;
		var zoomMax = this.timeline.zoomLimit.max;
		this.sliderId = id +'_zoomSlider';
		this.addNode(new mheditor.UIButton(id + '_zoomOutButton',{position:'absolute',left:'20px',top:'1px'}, function(event) { thisClass.zoomOut(); },'zoomOut.png'));
		this.addNode(new mheditor.UIHSlider(id + '_zoomSlider',zoomCurrent,zoomMin,zoomMax,200,{position:'absolute',left:'55px',top:'1px'},function(zoomValue) { thisClass.zoomValueChanged(zoomValue); }));
		this.addNode(new mheditor.UIButton(id + '_zoomInButton',{position:'absolute',left:'260px',top:'1px'},function(event) { thisClass.zoomIn(); },'zoomIn.png'));
	},
	
	slider:function() {
		return this.getNode(this.sliderId);
	},
	
	zoomIn:function() {
		this.timeline.zoomIn();
		this.slider().setValue(this.timeline.zoom);
	},
	
	zoomOut:function() {
		this.timeline.zoomOut();
		this.slider().setValue(this.timeline.zoom);
	},
	
	zoomValueChanged:function(newValue) {
		this.timeline.setZoom(newValue);
	}
});

mheditor.EditorContainer = Class.create(DomNode,{
	toolbarId:'',
	timelineId:'',
	zoombarId:'',
	style:{},
	paellaPlayer:null,

	initialize:function(id,paellaPlayer) {
		this.paellaPlayer = paellaPlayer;
		this.parent('div',id,this.style);
		this.domElement.className = 'paellaEditorContainer';
		this.toolbarId = id + '_toolbar';
		this.timelineId = id + '_timeline';
		this.zoombarId = id + '_zoombar';
		$(this.domElement).css(this.style);
		this.addNode(new mheditor.Toolbar(this.toolbarId,this));
		this.addNode(new mheditor.Timeline(this.timelineId,this));
		this.addNode(new mheditor.Zoombar(this.zoombarId,this));
		
		var thisClass = this;
		$(document).bind(mheditor.events.trimchanged,function(event,params) { thisClass.onTrimChanged(params); });
	},
	
	toolbar:function() {
		return this.getNode(this.toolbarId);
	},
	
	timeline:function() {
		return this.getNode(this.timelineId);
	},

	zoombar:function() {
		return this.getNode(this.zoombar);
	},
	
	refreshInterface:function() {
		this.timeline().buildInterface();
	},
	
	onTrimChanged:function(params) {
		var currentTrimming = paella.player.videoContainer.trimming;
		var duration = paella.player.videoContainer.duration(true);
		var trimmingValue = params.percent * duration / 100;
		if (params.type=='left') {
			paella.player.videoContainer.setTrimmingStart(trimmingValue);
		}
		else if (params.type=='right') {
			paella.player.videoContainer.setTrimmingEnd(trimmingValue);
		}
	},
	
	resize:function() {
		this.timeline().resize();
	}
});

paella.utils.PaellaEditor = Class.create(DomNode,{
	editorContainerId:null,
	paellaPlayer:null,
	isTrimmingEnabled:false,

	initialize:function(id,paellaPlayer) {
		this.translate();
		this.paellaPlayer = paellaPlayer;
		this.parent('div',id,{position:'fixed',left:'0px',right:'0px',bottom:'0px',height:mheditor.layout.editor.height,zIndex:mheditor.layout.editor.zIndex});
		this.editorContainerId = id + '_editor';
		$(this.domElement).hide();
		var thisClass = this;
		this.addNode(new mheditor.EditorContainer(this.editorContainerId,this.paellaPlayer));
		$(document).bind(paella.events.showEditor,function(event) { thisClass.enterEditMode(); });
		$(document).bind(paella.events.hideEditor,function(event) { thisClass.exitEditMode(); });
	},
	
	translate:function() {
		var lang = navigator.language || window.navigator.userLanguage;
		paella.initCallback.translateEditorMessages(lang,paellaEditor.messages);
	},

	editorContainer:function() {
		return this.getNode(this.editorContainerId);
	},

	enterEditMode:function() {
		this.isTrimmingEnabled = paella.player.videoContainer.trimming.enabled;
		if (this.isTrimmingEnabled) {
			paella.player.videoContainer.disableTrimming();			
		}
		this.editorContainer().refreshInterface();
		var finalHeight = mheditor.layout.editor.height;
		this.domElement.style.height = '0px';
		$(this.domElement).animate({height:finalHeight},300)
		$(this.domElement).show();
		document.body.style.backgroundImage = 'url(resources/images/editor_video_bkg.png)';
	},

	exitEditMode:function() {
		$(this.domElement).hide();
		paella.player.videoContainer.enableTrimming();
		document.body.style.backgroundImage = '';
	},
	
	resize:function() {
		this.editorContainer().resize();
	}
});

var EditControl = Class.create(DomNode,{
	buttonId:'',

	initialize:function(id) {
		this.buttonId = id + '_button';
		var style = {position:'fixed',top:'0px',right:'0px'};
		this.parent('div',id,style);
		this.domElement.className = 'editControlContainer';
		var editButton = this;
		this.addNode(new Button(this.buttonId,'editButton',function(event) {
			editButton.toggleEditor();
		},false));
	},

	toggleEditor:function() {
		$(document).trigger(paella.events.showEditor);
	},

	getButton:function() {
		return this.getNode(this.buttonId);
	}
});

