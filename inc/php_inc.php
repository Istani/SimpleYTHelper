<?php

/* php settings */
ini_set('display_errors', 1);
set_time_limit(0);
@session_start();

/* mysql settings */
$mysql['host'] = "127.0.0.1";
$mysql['user'] = "";
$mysql['pass'] = "";
$mysql['base'] = "";

/* google api */
$DEV_KEY = "";
$OAUTH2_CLIENT_ID = '';
$OAUTH2_CLIENT_SECRET = '';

// Istani
$KANALID = "UCoL8PZGa__nCk_OgZeenRtw";

// Defender833
$KANALID = "UC5DOhI70dI3PnLPMkUsosgw";


require_once 'google_api/vendor/autoload.php';

/* eigene scripte */
require_once 'functions/db.php';
require_once 'functions/func_token.php';
//$database = new db("mysql", $mysql['host'], $mysql['user'], $mysql['pass']);
//$database->connect_db($mysql['base']);
// load private settings
include("private_settings.php");
?>
