paella.plugins.CommentsPlugin  = Class.create(paella.TabBarPlugin,{
	id:null,
	divRoot:null,
	divPublishComment:null,
	divComments:null,
	divLoading:null,
	isPublishAllowed: true,
	isPublishByAnonymousAllowed: true,
	publishCommentTextArea:null,
	publishCommentButtons:null,
	canPublishAComment: false,
	btnAddCommentToInstant: null,
	currentTime: 0,
	proxyUrl:'',
	useJsonp:false,
        commentsTree: [],
	

	getIndex:function() {
		return 100;
	},
	
	getTabName:function() {
		return paella.dictionary.translate("Comments");
	},

        initialize:function() {
                this.parent();
                var thisClass = this;

		this.divPublishComment = new DomNode('div','CommentPlugin_Publish' ,{display:'block'});
		this.divLoading = new DomNode('div','CommentPlugin_Loading' ,{display:'none'});		
		this.divComments = new DomNode('div','CommentPlugin_Comments' ,{display:'none'});

                $(document).bind(paella.events.loadComplete,function(event,params) {
                        thisClass.reloadComments();
                });
        },
	
	getRootNode:function(id) {
		var thisClass = this;
		this.useJsonp = paella.player.config.proxyLoader.usejsonp;
		if (paella.player.config.proxyLoader && paella.player.config.proxyLoader.enabled) {
			this.proxyUrl = paella.player.config.proxyLoader.url;
		}		
		this.id = 'CommentPlugin';
		this.divRoot = new DomNode('div',this.id ,{display:'block'});
	
		this.divPublishComment.domElement.id = this.id+"_Publish";
		this.divLoading.domElement.id = this.id+"_Loading";
		this.divComments.domElement.id = this.id+"_Comments";
		
		this.divRoot.addNode(this.divPublishComment);
		this.divRoot.addNode(this.divLoading);
		this.divRoot.addNode(this.divComments);

		if ( ((paella.matterhorn.me.username == "anonymous") && (this.isPublishByAnonymousAllowed == true)) || (paella.matterhorn.me.username != "anonymous") ){
			if (this.isPublishAllowed == true){
				this.canPublishAComment = true;
				this.createPublishComment();
				$(document).bind(paella.events.timeUpdate, function(event, params){
					thisClass.currentTime = params.currentTime;
                                        var currentTime = params.currentTime;
                                        if (paella.player.videoContainer.trimEnabled()){
                                          currentTime = params.currentTime - paella.player.videoContainer.trimming.start;
                                        }
					thisClass.btnAddCommentToInstant.domElement.innerHTML = paella.dictionary.translate("Publish at {0}").replace(/\{0\}/g, paella.utils.timeParse.secondsToTime(currentTime));
					
				});
			}
		}
		
		return this.divRoot;
	},
	
	setLoadingComments:function(b) {
		if ((this.divLoading) && (this.divComments)){
		if (b == true){
			this.divLoading.domElement.style.display="block";
			this.divComments.domElement.style.display="none";
		}
		else{
			this.divLoading.domElement.style.display="none";
			this.divComments.domElement.style.display="block";
		}
		}
	},
	
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// Publish functions
	///////////////////////////////////////////////////////////////////////////////////////////////////
	createPublishComment:function() {
		var thisClass = this;
		var rootID = this.divPublishComment.identifier+"_entry";
		var divEntry = new DomNode('div', rootID, {display:'block'});
		divEntry.domElement.className="comments_entry";
		
		var divSilhouette = new DomNode('img',rootID+"_silhouette" ,{display:'inline-block'});
		divSilhouette.domElement.src="plugins/silhouette32.png";
		divSilhouette.domElement.className = "comments_entry_silhouette";
		divEntry.addNode(divSilhouette);
		
		var divTextAreaContainer = new DomNode('div',rootID+"_textarea_container" ,{display:'inline-block'});
		divTextAreaContainer.domElement.className = "comments_entry_container";
		divTextAreaContainer.domElement.onclick = function(){thisClass.onClickTextAreaContainer(divTextAreaContainer)};		
		divEntry.addNode(divTextAreaContainer);
		
		this.publishCommentTextArea = new DomNode('textarea',rootID+"_textarea" ,{display:'block'});
		divTextAreaContainer.addNode(this.publishCommentTextArea);

		this.publishCommentButtons = new DomNode('div',rootID+"_buttons_area" ,{display:'none'});
		divTextAreaContainer.domElement.className = "comments_entry_container";
		divTextAreaContainer.addNode(this.publishCommentButtons);



		var btnAddComment = new DomNode('button',rootID+"_btnAddComment" ,{display:'float', float:'right'});
		btnAddComment.domElement.onclick = function(){thisClass.addComment();};
		
                btnAddComment.domElement.innerHTML = paella.dictionary.translate("Publish");

		this.publishCommentButtons.addNode(btnAddComment);
		
		this.btnAddCommentToInstant = new DomNode('button',rootID+"_btnAddCommentAt" ,{display:'float', float:'right'});
		
		this.btnAddCommentToInstant.domElement.innerHTML = paella.dictionary.translate("Publish at {0}").replace(/\{0\}/g,'??:??:??');
		this.btnAddCommentToInstant.domElement.onclick = function(){thisClass.addCommentAtTime();};
		this.publishCommentButtons.addNode(this.btnAddCommentToInstant);
		
		divTextAreaContainer.domElement.commentsTextArea = this.publishCommentTextArea;
		divTextAreaContainer.domElement.commentsBtnAddComment = btnAddComment;
		divTextAreaContainer.domElement.commentsBtnAddCommentToInstant = this.btnAddCommentToInstant;
		
				
		this.divPublishComment.addNode(divEntry);
	},
	
	onClickTextAreaContainer:function(textAreaContainerElement){ 
		this.publishCommentTextArea.domElement.style.height="60px";
		this.publishCommentButtons.domElement.style.display="block";
	},
	
	addCommentAtTime:function(){
		var thisClass = this;
		var txtValue = this.publishCommentTextArea.domElement.value;
		txtValue = txtValue.replace(/<>/g, "< >");  //TODO: Hacer este replace bien!
		
		var commentValue = paella.matterhorn.me.username + "<>" + txtValue + "<>scrubber";
		var inTime = Math.floor(thisClass.currentTime);
		
		this.publishCommentTextArea.domElement.value = "";
		
		var restEndpoint = paella.player.config.restServer.url + "annotation"; 		
		new paella.Ajax(restEndpoint,{episode:paella.matterhorn.episode.id, type:"comment", in:inTime, out:0, value:commentValue}, function(response) {
			thisClass.reloadComments();
		}, thisClass.proxyUrl, thisClass.useJsonp, 'PUT'); 	
	},
	
	addComment:function(){
		var thisClass = this;
		var txtValue = this.publishCommentTextArea.domElement.value;
		txtValue = txtValue.replace(/<>/g, "< >");  //TODO: Hacer este replace bien!
		
		var commentValue = paella.matterhorn.me.username + "<>" + txtValue + "<>normal";
	
		this.publishCommentTextArea.domElement.value = "";
		
		var restEndpoint = paella.player.config.restServer.url + "annotation"; 		
		new paella.Ajax(restEndpoint,{episode:paella.matterhorn.episode.id, type:"comment", in:0, out:0, value:commentValue}, function(response) {
			thisClass.reloadComments();
		}, thisClass.proxyUrl, thisClass.useJsonp, 'PUT'); 
	},

	addReply:function(annotationID, domNodeId){
		var thisClass = this;
                
                var textArea = document.getElementById(domNodeId);

		var txtValue = textArea.value;
		txtValue = txtValue.replace(/<>/g, "< >");  //TODO: Hacer este replace bien!
		
		var commentValue = paella.matterhorn.me.username + "<>" + txtValue + "<>reply<>"+annotationID;
	
		textArea.value = "";
		
		var restEndpoint = paella.player.config.restServer.url + "annotation"; 		
		new paella.Ajax(restEndpoint,{episode:paella.matterhorn.episode.id, type:"comment", in:0, out:0, value:commentValue}, function(response) {
			thisClass.reloadComments();
		}, thisClass.proxyUrl, thisClass.useJsonp, 'PUT'); 
	},
		
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// Comments Listing Functions
	///////////////////////////////////////////////////////////////////////////////////////////////////
	reloadComments:function() {
		var thisClass = this;
		this.useJsonp = paella.player.config.proxyLoader.usejsonp;
		if (paella.player.config.proxyLoader && paella.player.config.proxyLoader.enabled) {
			this.proxyUrl = paella.player.config.proxyLoader.url;
		}
		thisClass.setLoadingComments(true);
		this.divComments.domElement.innerHTML = "";
                thisClass.commentsTree = [];
				
				
		var restEndpoint = paella.player.config.restServer.url + "annotation/annotations.json"; 		
		new paella.Ajax(restEndpoint,{episode:paella.matterhorn.episode.id, type:"comment", limit:1000}, function(response) {
			if (typeof(response)=="string") {
				try {
					response = JSON.parse(response);
				}
				catch(e) {
					response=null;
				}
			}
			if (response  && response.annotations) {
				if (response.annotations.total == 1) {
					response.annotations.annotation = [response.annotations.annotation]
				}
				if (response.annotations.total > 0) {
					response.annotations.annotation.sort(function(a,b){
						var aD = paella.utils.timeParse.matterhornTextDateToDate(a.created);
						var bD = paella.utils.timeParse.matterhornTextDateToDate(b.created);				
						return bD.getTime()-aD.getTime();
					});

                                        var tempDict = {};

                                        // obtain normal and scrubs comments        
					for (var i =0; i < response.annotations.annotation.length; ++i ){
						var annotation = response.annotations.annotation[i];
						
                                                var valuesArray = annotation.value.split("<>");
                                                var valueUser = valuesArray[0];
                                                var valueType = valuesArray[2];
                                                var valueText = valuesArray[1];
                                                valueText = valueText.replace(/\n/g,"<br/>");
                                                
                                                if (valueType !== "reply") { 
                                                  var comment = {};
                                                  comment["id"] = annotation.annotationId;


                                                  comment["user"] = valueUser;
                                                  comment["type"] = valueType;
                                                  comment["text"] = valueText;
                                                  comment["userId"] = annotation.userId;
                                                  comment["created"] = annotation.created;
                                                  comment["inpoint"] = annotation.inpoint;
                                                  comment["replies"] = [];
                                                  
                                                  thisClass.commentsTree.push(comment);
                                                  tempDict[comment["id"]] = thisClass.commentsTree.length - 1; 

                                                }
					}

                                        // obtain replies comments
					for (var i =0; i < response.annotations.annotation.length; ++i ){
						var annotation = response.annotations.annotation[i];

                                                var valuesArray = annotation.value.split("<>");
                                                var valueUser = valuesArray[0];
                                                var valueType = valuesArray[2];
                                                var valueText = valuesArray[1];
                                                var valueParentId = valuesArray[3],
                                                valueText = valueText.replace(/\n/g,"<br/>");
                                                
                                                if (valueType === "reply") { 
                                                  var comment = {};
                                                  comment["id"] = annotation.annotationId;


                                                  comment["user"] = valueUser;
                                                  comment["type"] = valueType;
                                                  comment["text"] = valueText;
                                                  comment["userId"] = annotation.userId;
                                                  comment["created"] = annotation.created;
                                                  
                                                  var index = tempDict[valueParentId];

                                                  thisClass.commentsTree[index]["replies"].push(comment);
                                                }
					}

                                        thisClass.displayComments();
				}
			}
			thisClass.setLoadingComments(false);
			
		}, thisClass.proxyUrl, thisClass.useJsonp);	
		
	},
			
	displayComments:function() {
          var thisClass = this;
          for (var i =0; i < thisClass.commentsTree.length; ++i ){
            var comment = thisClass.commentsTree[i];
            var e = thisClass.createACommentEntry(comment);
            thisClass.divComments.addNode(e);
          } 

        },

	createACommentEntry:function(comment) {
		var thisClass = this;
		var rootID = this.divPublishComment.identifier+"_entry_"+comment["id"];
		
		var divEntry = new DomNode('div',rootID ,{display:'block'});
		divEntry.domElement.className="comments_entry";

		var divSilhouette = new DomNode('img',rootID+"_silhouette" ,{display:'inline-block'});
		divSilhouette.domElement.src="plugins/silhouette32.png";
		divSilhouette.domElement.className = "comments_entry_silhouette";
		divEntry.addNode(divSilhouette);
		
				
		var divCommentContainer = new DomNode('div',rootID+"_comment_container" ,{display:'inline-block'});
		divCommentContainer.domElement.className = "comments_entry_container";
		divEntry.addNode(divCommentContainer);
				

		var divCommentMetadata = new DomNode('div',rootID+"_comment_metadata" ,{display:'block'});
		divCommentContainer.addNode(divCommentMetadata);
		var datePublish = "";
		if (comment["created"]) {
			var dateToday=new Date()
			var dateComment = paella.utils.timeParse.matterhornTextDateToDate(comment["created"]);			
			datePublish = paella.utils.timeParse.secondsToText((dateToday.getTime()-dateComment.getTime())/1000);
		}		
		
		
		var headLine = "<span class='comments_entry_username'>" + comment["userId"] + "</span>";
		if (comment["type"] === "scrubber"){
                        var publishTime = comment["inpoint"];
                        if (paella.player.videoContainer.trimEnabled()){
                            publishTime = comment.inpoint - paella.player.videoContainer.trimming.start;
                        }
			headLine += "<span class='comments_entry_timed'> " + paella.utils.timeParse.secondsToTime(publishTime) + "</span>";
		}
		headLine += "<span class='comments_entry_datepublish'>" + datePublish + "</span>";
 
		divCommentMetadata.domElement.innerHTML = headLine;
		
		var divCommentValue = new DomNode('div',rootID+"_comment_value" ,{display:'block'});
		divCommentValue.domElement.className = "comments_entry_comment";
		divCommentContainer.addNode(divCommentValue);		
		
		divCommentValue.domElement.innerHTML = comment["text"];

		var divCommentReply = new DomNode('div',rootID+"_comment_reply" ,{display:'block'});
		divCommentContainer.addNode(divCommentReply);
		
		if (this.canPublishAComment == true) {
			var btnRplyComment = new DomNode('button',rootID+"_comment_reply_button" ,{display:'block'});
	
			btnRplyComment.domElement.onclick = function(){
				var e = thisClass.createAReplyEntry(comment["id"]);
				this.style.display="none";
				this.parentElement.parentElement.appendChild(e.domElement);
			};
	
			btnRplyComment.domElement.innerHTML = paella.dictionary.translate("Reply");
			divCommentReply.addNode(btnRplyComment);
		}

                
                
                for (var i =0; i < comment["replies"].length; ++i ){
                  var e = thisClass.createACommentReplyEntry(comment["id"], comment["replies"][i]);
                  divCommentContainer.addNode(e);
                }

				
		return divEntry;
	},

	createACommentReplyEntry:function(parentID, comment) {
		var thisClass = this;
		var rootID = this.divPublishComment.identifier+"_entry_" + parentID + "_reply_" + comment["id"];

		var divEntry = new DomNode('div',rootID ,{display:'block'});
		divEntry.domElement.className="comments_entry";

		var divSilhouette = new DomNode('img',rootID+"_silhouette" ,{display:'inline-block'});
		divSilhouette.domElement.src="plugins/silhouette32.png";
		divSilhouette.domElement.className = "comments_entry_silhouette";
		divEntry.addNode(divSilhouette);
		
				
		var divCommentContainer = new DomNode('div',rootID+"_comment_container" ,{display:'inline-block'});
		divCommentContainer.domElement.className = "comments_entry_container";
		divEntry.addNode(divCommentContainer);
				

		var divCommentMetadata = new DomNode('div',rootID+"_comment_metadata" ,{display:'block'});
		divCommentContainer.addNode(divCommentMetadata);
		var datePublish = "";
		if (comment["created"]) {
			var dateToday=new Date()
			var dateComment = paella.utils.timeParse.matterhornTextDateToDate(comment["created"]);			
			datePublish = paella.utils.timeParse.secondsToText((dateToday.getTime()-dateComment.getTime())/1000);
		}		
		
		
		var headLine = "<span class='comments_entry_username'>" + comment["userId"] + "</span>";
		headLine += "<span class='comments_entry_datepublish'>" + datePublish + "</span>";
 
		divCommentMetadata.domElement.innerHTML = headLine;
		
		var divCommentValue = new DomNode('div',rootID+"_comment_value" ,{display:'block'});
		divCommentValue.domElement.className = "comments_entry_comment";
		divCommentContainer.addNode(divCommentValue);		
		
		divCommentValue.domElement.innerHTML = comment["text"];
		
				
		return divEntry;
	},
	
	
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// Reply Functions
	///////////////////////////////////////////////////////////////////////////////////////////////////	
	createAReplyEntry:function(annotationID) {
		var thisClass = this;
		paella.debug.log("----> " + annotationID)
		var rootID = this.divPublishComment.identifier+"_entry_" + annotationID + "_reply";
		var divEntry = new DomNode('div',rootID+"_entry" ,{display:'block'});
		divEntry.domElement.className="comments_entry";
		
		
		var divSilhouette = new DomNode('img',rootID+"_silhouette" ,{display:'inline-block'});
		divSilhouette.domElement.src="plugins/silhouette32.png";
		divSilhouette.domElement.className = "comments_entry_silhouette";
		divEntry.addNode(divSilhouette);
		
		
		var divCommentContainer = new DomNode('div',rootID+"_reply_container" ,{display:'inline-block'});
		divCommentContainer.domElement.className = "comments_entry_container comments_reply_container";
		divEntry.addNode(divCommentContainer);
		
		var textArea = new DomNode('textarea',rootID+"_textarea" ,{display:'block'});
		divCommentContainer.addNode(textArea);

		this.publishCommentButtons = new DomNode('div',rootID+"_buttons_area" ,{display:'block'});
		//divCommentContainer.domElement.className = "comments_entry_container";
		divCommentContainer.addNode(this.publishCommentButtons);


		var btnAddComment = new DomNode('button',rootID+"_btnAddComment" ,{display:'float', float:'right'});
		btnAddComment.domElement.onclick = function(){thisClass.addReply(annotationID, textArea.domElement.id);};
		btnAddComment.domElement.innerHTML = paella.dictionary.translate("Reply");
		this.publishCommentButtons.addNode(btnAddComment);		
		
		
		return divEntry;
	}
});

/*
episode:6d03cdbb-14ff-4738-b5da-7039bd0c2fb0
type:comment
in:0
value:admin<>un reply<>reply<>2352
out:0
*/
new paella.plugins.CommentsPlugin();
