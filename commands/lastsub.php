<?php
	// Getting SUB count & last name
	
	// incs
	require 'inc/php_inc.php';
	
	// default
	$subcount=0;
	$subname="Nobody";
	
	 $client = new Google_Client();
	 $client->setDeveloperKey($DEV_KEY);
	 $client->setScopes('https: //www.googleapis.com/auth/youtube.readonly');
	 $youtube = new Google_Service_YouTube($client);
	
	
	$listResponse = $youtube->channels->listChannels('statistics', array('id' => $KANALID));
	$subcount=$listResponse[0]["modelData"]["statistics"]["subscriberCount"];
	
	
	$subresult=$youtube->subscriptions->listSubscriptions("subscriberSnippet", array(/*'channelId' => $KANALID,/*/"mySubscribers" => "true" ));
	 
	 echo "<pre>";
	 echo var_dump($subresult);
	 echo "</pre>";
	 
	 
	 echo "#".$subcount." - ".$subname;
?>