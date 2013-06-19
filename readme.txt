Configuration:
Inside a Matterhorn server
- You must to specify the REST server URLs in config/config.json:
	restServer.
		url: the URL of your matterhorn REST server, example: http://yourmatterhonrserver.com/search/
		seriesXML: example, series.xml
		seriesJson: example, series.json
		episodeXML: example, episode.xml
		episodeJson: example, episode.json
	
Outside a Matterhorn server
- Also, you must to enable the php proxy to perform AJAX requests from Javascript to your matterhorn server
	proxyLoader.
		enabled: true or false
		url: by default, loadurl.php
		
Using the player:
Pass the identifier of the video in the parameter "id"

	http://myplayerserver.com/player/index.html?id=e67098e6-0043-4ac1-83b7-2ccbb5f0ca8b


