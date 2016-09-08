<?php
	// Getting SUB count & last name
	
	// incs
	require 'inc/php_inc.php';
	
	// default
	$subcount=0;
	$subname="Nobody";
	
	 $client = new Google_Client();
	 $client->setClientId($OAUTH2_CLIENT_ID);
	$client->setClientSecret($OAUTH2_CLIENT_SECRET);
	 $client->setDeveloperKey($DEV_KEY);
	 $client->setScopes('https: //www.googleapis.com/auth/youtube.readonly');
	 
	 $accessToken = load_accesstoken($KANALID);
	 $client->setAccessToken($accessToken);
	 if ($client->isAccessTokenExpired()) {
	 	$client->refreshToken(load_refreshtoken($KANALID));
	 	save_accesstoken($KANALID, $client->getAccessToken()); }
	 $youtube = new Google_Service_YouTube($client);
	
	
	$listResponse = $youtube->channels->listChannels('statistics', array('id' => $KANALID));
	$subcount=$listResponse[0]["modelData"]["statistics"]["subscriberCount"];
	
	if (!file_exists("token/".$KANALID.".BotSubscriber.refresh")) {
		save_refreshtoken($KANALID.".BotSubscriber", "null");
}
	 $refToken= load_refreshtoken($KANALID.".BotSubscriber");
	 
	 if($refToken=="null") {
	 	$subresult=$youtube->subscriptions->listSubscriptions("subscriberSnippet", array(/*'channelId' => $KANALID,*/"mySubscribers" => "true", "maxResults" => 1 , "order" => "relevance" ));
	 } else {
	$subresult=$youtube->subscriptions->listSubscriptions("subscriberSnippet", array(/*'channelId' => $KANALID,*/"mySubscribers" => "true", "maxResults" => 1 , "order" => "relevance", "pageToken" => $refToken ));
	 }
	 //debug_log($subresult);
	 
	 $subname = $subresult["items"][0]["subscriberSnippet"]["title"];
	 
	 save_refreshtoken($KANALID.".BotSubscriber", $subresult["nextPageToken"]);
	 
	 echo "#".$subcount." - ".$subname;
?>