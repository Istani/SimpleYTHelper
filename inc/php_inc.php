<?php
	/* php settings */
	ini_set('display_errors', 1);
	@session_start();
	
	/* mysql settings */
	$mysql['host']="127.0.0.1";
	$mysql['user']="";
	$mysql['pass']="";
	$mysql['base']="";
	
	/* google api */
	$DEV_KEY="";
	$OAUTH2_CLIENT_ID = '';
	$OAUTH2_CLIENT_SECRET = '';
	$KANALID="UC5DOhI70dI3PnLPMkUsosgw";
	$KANALID="UCoL8PZGa__nCk_OgZeenRtw";
	
	require_once 'google_api/src/Google/autoload.php';
	
	/* eigene scripte */
	require_once 'functions/db.php';
	//$database = new db("mysql", $mysql['host'], $mysql['user'], $mysql['pass']); 
	//$database->connect_db($mysql['base']);

	// load private settings
	include("../private_settings.php");
?>