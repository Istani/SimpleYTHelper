<?php
	// Getting SUB count & last name
	
	// incs
	require 'inc/php_inc.php';
	//require 'inc/google_connect.php';
	
	// default
	$subcount=0;
	$subname="Nobody";
	
	 $client = new Google_Client();
	 $client->setDeveloperKey($DEV_KEY);
	 //$client->setClientId($OAUTH2_CLIENT_ID);
	 //$client->setClientSecret($OAUTH2_CLIENT_SECRET);
	 $client->setScopes('https://www.googleapis.com/auth/youtube');
	 $youtube = new Google_Service_YouTube($client);
	
	
	$listResponse = $youtube->channels->listChannels('statistics', array('id' => $KANALID));
	$subcount=$listResponse[0]["modelData"]["statistics"]["subscriberCount"];
	
	/* 
	$subresult=$youtube->subscriptions->listSubscriptions("id", array('forChannelId' => $KANALID, "mySubscribers" => "true" ));
	 
	 echo "<pre>";
	 echo var_dump($subresult);
	 echo "</pre>";
	 */
	 
	 echo "#".$subcount." - ".$subname;
?>