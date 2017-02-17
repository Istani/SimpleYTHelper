<?php

/* php settings */
ini_set('display_errors', 1);
set_time_limit(0);
@session_start();
header("content-type: text/html; charset=iso-8859-1");

/* mysql settings */
$mysql['host'] = "127.0.0.1";
$mysql['user'] = "";
$mysql['pass'] = "";
$mysql['base'] = "";

/* google api */
$DEV_KEY = "";
$OAUTH2_CLIENT_ID = '';
$OAUTH2_CLIENT_SECRET = '';

/* Discord Oauth API */
$Discord_CLIENT_ID     = '';
$Discord_CLIENT_SECRET = '';

/* Noch wichtig für CRONJOB und BOT Commands */
// Istani
$KANALID = "UCoL8PZGa__nCk_OgZeenRtw";
// Defender833
$KANALID = "UC5DOhI70dI3PnLPMkUsosgw";


require_once 'API/google/vendor/autoload.php';

require_once 'API/OAuth2/src/OAuth2/Client.php';
require_once 'API/OAuth2/src/OAuth2/GrantType/IGrantType.php';
require_once 'API/OAuth2/src/OAuth2/GrantType/AuthorizationCode.php';

/* eigene scripte */
require_once 'functions/db.php';
require_once 'functions/func_token.php';
require_once 'functions/func_command.php';
// load private settings - Überschreibt die hier vorher definierten mysql und oauth vars
include("private_settings.php");

$database = new db("mysql", $mysql['host'], $mysql['user'], $mysql['pass']);
$database->connect_db($mysql['base']);

require_once 'inc/forms_check.php';
?>
