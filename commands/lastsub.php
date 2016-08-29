<?php
	// Getting SUB count & last name
	
	// incs
	include("extern/inc_extern.php");
	include("intern/int_settings.php");
	
	// default
	$subcount=0;
	$subname="Nobody";
	
	 $client = new Google_Client();
	 $client->setDeveloperKey( $settings["google"]["devkey"]);
	 $youtube = new Google_Service_YouTube($client);
	$listResponse = $youtube->channels->listChannels('statistics', array('id' => $settings["youtube"]["channleid"],));
	print($listResponse);
	 
	 echo "#".$subcount." - ".$subname;
?>