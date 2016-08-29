<?php
	// Getting SUB count & last name
	
	// incs
	require 'inc/php_inc.php';
	require 'inc/google_connect.php';
	
	// default
	$subcount=0;
	$subname="Nobody";
	
	$listResponse = $youtube->channels->listChannels('statistics', array('id' => $KANALID));
	$subcount=$listResponse[0]["modelData"]["statistics"]["subscriberCount"];
	 
	 echo "#".$subcount." - ".$subname;
?>