paella.polimedia = {}

paella.polimedia.AccessControl = Class.create(paella.AccessControl,{
	checkAccess:function(onSuccess) {
		this.permissions.canRead = true;
		this.permissions.canContribute = false;
		this.permissions.canWrite = false;
		this.permissions.loadError = false;
		this.permissions.isAnonymous = true;
		onSuccess(this.permissions);
	}
});

paella.polimedia.VideoLoader = Class.create(paella.VideoLoader,{
	/*
	streams:[],		// {sources:{mp4:{src:"videourl.mp4",type:"video/mp4"},ogg:{src:"videourl.ogv",type:"video/ogg"},webm:{src:"videourl.webm",type:"video/webm"}}}
	frameList:[],	// frameList[timeInstant] = { id:"frame_id", mimetype:"image/jpg", time:timeInstant, url:"image_url"}
	*/
	
	
	loadVideo:function(videoId,onSuccess) {
		this.loadStatus = true;
		this.frameList = [];
		this.streams = [];
		
		this.streams.push({
				sources:{mp4:{src:"rtmp://polimedia.upv.es/vod/link/cursos/03020-Curso_Excel_2003-Jaime_Busquets/M09/B01/polimedia_muxed.mp4",type:"video/mp4"}},
	//			sources:{mp4:{src:"http://polimedia.upv.es/iphone/cursos/03020-Curso_Excel_2003-Jaime_Busquets/M09/B01/hd/polimedia_muxed.mp4",type:"video/mp4"}}
			}
		);
		
		this.frameList[0] = {id:"frame_1",mimetype:"image/jpg",time:0,url:"https://polimedia.upv.es/visor/serviciosplayer.asp?id=39f62a9a-4cf5-bd4e-92f3-cb34e4792a85&operacion=SEQUENCE&frame=0"};
		this.frameList[10] = {id:"frame_2",mimetype:"image/jpg",time:10,url:"https://polimedia.upv.es/visor/serviciosplayer.asp?id=39f62a9a-4cf5-bd4e-92f3-cb34e4792a85&operacion=SEQUENCE&frame=10"};
		this.frameList[27] = {id:"frame_3",mimetype:"image/jpg",time:27,url:"https://polimedia.upv.es/visor/serviciosplayer.asp?id=39f62a9a-4cf5-bd4e-92f3-cb34e4792a85&operacion=SEQUENCE&frame=27"};
		this.frameList[55] = {id:"frame_4",mimetype:"image/jpg",time:55,url:"https://polimedia.upv.es/visor/serviciosplayer.asp?id=39f62a9a-4cf5-bd4e-92f3-cb34e4792a85&operacion=SEQUENCE&frame=55"};
		this.frameList[64] = {id:"frame_5",mimetype:"image/jpg",time:64,url:"https://polimedia.upv.es/visor/serviciosplayer.asp?id=39f62a9a-4cf5-bd4e-92f3-cb34e4792a85&operacion=SEQUENCE&frame=64"};
		
		onSuccess();
	}
});
