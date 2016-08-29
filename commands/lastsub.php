<?php
	// Getting SUB count & last name
	
	// incs
	require 'inc/php_inc.php';
	
	// default
	$subcount=0;
	$subname="Nobody";
	
	 $client = new Google_Client();
	 $client->setDeveloperKey($DEV_KEY);
	 //$client->setClientId($OAUTH2_CLIENT_ID);
	 //$client->setClientSecret($OAUTH2_CLIENT_SECRET);
	 $client->setScopes('https://www.googleapis.com/auth/youtube');
	 $youtube = new Google_Service_YouTube($client);
	$listResponse = $youtube->channels->listChannels('statistics', array('id' =>$KANALID ,));
	print($listResponse);
	 
	 echo "#".$subcount." - ".$subname;
?>