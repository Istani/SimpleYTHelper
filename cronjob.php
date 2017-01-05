<?php
require 'inc/php_inc.php';
// TODO: Token laden muss umgestellt werden auf MySQL
$accessToken = load_accesstoken($KANALID);
session_to_database($database, $accessToken);

// Google Verbindung
$client = new Google_Client();
$client->setClientId($OAUTH2_CLIENT_ID);
$client->setClientSecret($OAUTH2_CLIENT_SECRET);
$client->setDeveloperKey($DEV_KEY);
$client->setScopes('https: //www.googleapis.com/auth/youtube');
$client->setAccessToken($accessToken);

if ($client->isAccessTokenExpired()) {
  $client->refreshToken(load_refreshtoken($KANALID));
  $_SESSION["token"]=$client->getAccessToken();
  $token=json_encode($_SESSION["token"]);
  save_accesstoken($KANALID, $token);
}

$youtube = new Google_Service_YouTube($client);

// SQL Load Token
$_tmp_tabellename="bot_token";
$check_table=$database->show_tables();
if(!in_array($_tmp_tabellename, $check_table)) {
  $felder=null;
  $felder["id"]="TEXT";
  $felder["token"]="TEXT";
  $felder["last_used"]="TEXT";
  $felder["interval"]="TEXT";
  $database->create_table($_tmp_tabellename, $felder, "id");
  unset($felder);
}
$tmp_tokens=$database->sql_select($_tmp_tabellename,"*","",true);
foreach ($tmp_tokens as $tmp_key => $tmp_value)  {
  foreach($tmp_value as $t2key => $t2value) {
    $token[$tmp_value["id"]][$t2key] = $t2value;
  }
  if ( $token[$tmp_value["id"]]["interval"] == 0) {
    $token[$tmp_value["id"]]["interval"] = 300;
  }
}
function init_token($name) {
  $_tmp_token["id"]=$name;
  $_tmp_token["token"]="null";
  $_tmp_token["last_used"]=0;
  $_tmp_token["interval"]=300;
  return $_tmp_token;
}

//include("cronjob/load_channels.php");

include("cronjob/channels_contentDetails.php");
include("cronjob/channels_statistics.php");

include("cronjob/subscriptions_subscriberSnippet.php");

include("cronjob/playlistItems_snippet_uploaded.php");
include("cronjob/videos_statistics.php");
include("cronjob/videos_status.php");

include("cronjob/channels_livestreamchat.php");
include("cronjob/livestream_chat.php");


//include("cronjob/videos_contentDetails.php");
//include("cronjob/videos_liveStreamingDetails.php");
?>
