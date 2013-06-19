paella.plugins.SocialPlugin = Class.create(paella.PlaybackPopUpPlugin,{
	socialContainer:null,
	container:null,
	button:null,
	rightPosition:0,


	initialize:function() {
		this.parent();
		if (paella.utils.language()=='es') {
			var esDict = {
				'Custom size:': 'Tamaño personalizado:',
				'Choose your embed size. Copy the text and paste it in your html page.': 'Elija el tamaño del video a embeber. Copie el texto y péguelo en su página html.',
				'Width:':'Ancho:',
				'Height:':'Alto:'				
			};
			paella.dictionary.addDictionary(esDict);
		}		
	},


	getRootNode:function(id) {
		var thisClass = this;
		this.button = new Button(id + '_social_button','showSocialButton',function(event) { thisClass.showSocialPress(); },true);
		return this.button;
	},
	
	getWidth:function() {
		return 45;
	},
	
	getMinWindowSize:function() {
		return 500;
	},
	
	setRightPosition:function(position) {
		this.button.domElement.style.right = position + 'px';
		this.rightPosition = position;
	},
	
	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},
	
	getIndex:function() {
		return 102;
	},
	
	getName:function() {
		return "SocialPlugin";
	},

	getPopUpContent:function(id) {
		var thisClass = this;
		this.socialContainer = new DomNode('div',id + '_social_container',{display:'none'});
		this.socialContainer.addNode(new Button(id + '_social_facebook_button','socialButtonFacebook',function(event) { thisClass.facebookPress(); }));
		this.socialContainer.addNode(new Button(id + '_social_twitter_button','socialButtonTwitter',function(event) { thisClass.twitterPress(); }));
		this.socialContainer.addNode(new Button(id + '_social_embed_button','socialButtonEmbed',function(event) { thisClass.embedPress(); }));
		this.socialContainer.domElement.style.right = this.rightPosition + 'px';
		return this.socialContainer;
	},

	showSocialButton:function() {
		return this.button;
	},
	
	showSocialPress:function() {
		if (this.showSocialButton().isToggled()) {
			$(this.socialContainer.domElement).show();
		}
		else {
			$(this.socialContainer.domElement).hide();
		}
	},
	
	facebookPress:function() {
		var url = this.getVideoUrl()
		window.open('http://www.facebook.com/sharer.php?u=' + url);
	},
	
	twitterPress:function() {
		var url = this.getVideoUrl();
		window.open('http://twitter.com/home?status=' + url);
	},

	embedPress:function() {
		var host = document.location.protocol + "//" +document.location.host;
		var pathname = document.location.pathname;
		
		var p = pathname.split("/");
		if (p.length > 0){p[p.length-1] = "embed.html";}
		var url = host+p.join("/")+"?id="+paella.matterhorn.episode.id
//		var paused = paella.player.videoContainer.paused();
//		$(document).trigger(paella.events.pause);
		
		var divSelectSize="<div style='display:inline-block;'> " +
			"    <input class='embedSizeButton' style='width:110px; height:73px;' value='620x349' />" +
			"    <input class='embedSizeButton' style='width:100px; height:65px;' value='540x304' />" +
			"    <input class='embedSizeButton' style='width:90px;  height:58px;' value='460x259' />" +
			"    <input class='embedSizeButton' style='width:80px;  height:50px;' value='380x214' />" +
			"    <input class='embedSizeButton' style='width:70px;  height:42px;' value='300x169' />" +
			"</div><div style='display:inline-block; vertical-align:bottom; margin-left:10px;'>"+
			"    <div>"+paella.dictionary.translate("Custom size:")+"</div>" +
			"    <div>"+paella.dictionary.translate("Width:")+" <input id='social_embed_width-input' class='embedSizeInput' maxlength='4' type='text' name='Costum width min 300px' alt='Costum width min 300px' title='Costum width min 300px' value=''></div>" +
			"    <div>"+paella.dictionary.translate("Height:")+" <input id='social_embed_height-input' class='embedSizeInput' maxlength='4' type='text' name='Costum width min 300px' alt='Costum width min 300px' title='Costum width min 300px' value=''></div>" +
			"</div>";
		
		
		var divEmbed = "<div style='text-align:left; font-size:14px; color:black;'><div id=''>"+divSelectSize+"</div> <div id=''>"+paella.dictionary.translate("Choose your embed size. Copy the text and paste it in your html page.")+"</div> <div id=''><textarea id='social_embed-textarea' class='social_embed-textarea' rows='4' cols='1' style='font-size:12px; width:95%; overflow:auto; margin-top:5px; color:black;'></textarea></div>  </div>";
		
		
		
		
		paella.messageBox.showMessage(divEmbed, {
			closeButton:true,
			width:'750px',
			height:'200px',
			onClose:function() {
			//	if (paused == false) {$(document).trigger(paella.events.play);}
			}
		});
		var w_e = $('#social_embed_width-input')[0];
		var h_e = $('#social_embed_height-input')[0];
		w_e.onkeyup = function(event){
			var width = parseInt(w_e.value);
			var height = parseInt(h_e.value);
			if (isNaN(width)){
				w_e.value="";
			}
			else{
				if (width<300){
					$("#social_embed-textarea")[0].value = "Embed width too low. The minimum value is a width of 300.";
				}
				else{
					if (isNaN(height)){
						height = (width/(16/9)).toFixed();
						h_e.value = height;
					} 				
					$("#social_embed-textarea")[0].value = '<iframe src="'+url+'" style="border:0px #FFFFFF none;" name="Paella Player" scrolling="no" frameborder="0" marginheight="0px" marginwidth="0px" width="'+width+'" height="'+height+'"></iframe>';
				}
			}
		};
		var embs = $(".embedSizeButton");
		for (var i=0; i< embs.length; i=i+1){
			var e = embs[i];
			e.onclick=function(event){
				var value = event.toElement.value;
				if (value) {
					var size = value.split("x");
					
					w_e.value = size[0];
					h_e.value = size[1];
					$("#social_embed-textarea")[0].value = '<iframe src="'+url+'" style="border:0px #FFFFFF none;" name="Paella Player" scrolling="no" frameborder="0" marginheight="0px" marginwidth="0px" width="'+size[0]+'" height="'+size[1]+'"></iframe>';
				}
			};
		}
	},
	
	getVideoUrl:function() {
		var url = document.location.href;
		return url;
	}	
});

new paella.plugins.SocialPlugin();