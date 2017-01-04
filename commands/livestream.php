<?php
require 'inc/php_inc.php';

$accessToken = load_accesstoken($KANALID);


// Google Verbindung
$client = new Google_Client();
$client->setClientId($OAUTH2_CLIENT_ID);
$client->setClientSecret($OAUTH2_CLIENT_SECRET);
$client->setDeveloperKey($DEV_KEY);
$client->setScopes('https: //www.googleapis.com/auth/youtube');

$client->setAccessToken($accessToken);

$youtube = new Google_Service_YouTube($client);


//Load from Data TABLE: channels_liveStreamChat
$_tmp_tabellename="channels_liveStreamChat";
$db_stats = $database->sql_select($_tmp_tabellename, "*", "id='".$KANALID."'", true);

$BroadcastId=$db_stats[0]["broadcastId"];
$ChatId=$db_stats[0]["chatId"];

if ($BroadcastId!="null") {
  echo "http://youtube.com/Defender833/live";
  
} else {
  echo "Kein Livestream gefunden!";
}
?>
