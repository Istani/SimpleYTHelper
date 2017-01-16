<?php
require 'inc/php_inc.php';
// TODO: Token laden muss umgestellt werden auf MySQL

function Temp_TokenToMysql($database) {
  // Check Files for Token Check
  $handle = opendir('token');
  while (false !== ($entry = readdir($handle))) {
    if ($entry!=str_replace(".access","",$entry)) {
      $channel=str_replace(".access","",$entry);
      if ($channel!="bot.json") {
        $accessToken=load_accesstoken($channel);
        $refreshToken=load_refreshtoken($channel);
        
        if (gettype($accessToken)!="string") {
          $accessToken=json_encode($accessToken, true);
        }
        if (gettype($accessToken)=="string") {
          echo '- '.$channel.' -<br>';
          $accessToken=json_decode($accessToken, true);
          $accessToken['refresh_token']=$refreshToken;
          if (session_to_database($database, $accessToken)>0) {
            unlink('token/'.$channel.".access");
            unlink('token/'.$channel.".refresh");
          }
        }
      }
    }
  }
}
Temp_TokenToMysql($database);

$_tmp_tabellename="authtoken";
$check_table=$database->show_tables();
if(!in_array($_tmp_tabellename, $check_table)) {
  die("ERROR!");
}
$_tmp_tabellename="channel_token";
$check_table=$database->show_tables();
if(!in_array($_tmp_tabellename, $check_table)) {
  $tmp_yt_tokens=$database->sql_select("authtoken","*","true ORDER BY last_seen LIMIT 1",false);
  $felder=null;
  $felder["token_id"]="INT(20)";
  $felder["channel_id"]="VARCHAR(50)";
  $felder["last_cron"]="INT(20)";
  $database->create_table($_tmp_tabellename, $felder, "token_id, channel_id");
  unset($felder);
} else {
  $tmp_yt_tokens=$database->sql_select("authtoken LEFT JOIN channel_token ON authtoken.id=channel_token.token_id","authtoken.*, channel_token.channel_id","true ORDER BY channel_token.last_cron LIMIT 1",false);
}
$accessToken = json_encode($tmp_yt_tokens[0]);
$_tmp_tabellename="authtoken";

// Google Verbindung
$client = new Google_Client();
$client->setClientId($OAUTH2_CLIENT_ID);
$client->setClientSecret($OAUTH2_CLIENT_SECRET);
$client->setDeveloperKey($DEV_KEY);
$client->setScopes('https: //www.googleapis.com/auth/youtube');
$client->setAccessToken($accessToken);

if ($client->isAccessTokenExpired()) {
  $client->refreshToken($tmp_yt_tokens[0]['refresh_token']);
  $tmp_insert_token["token"]=$client->getAccessToken();
  $tmp_insert_token["token"]['id']=$tmp_yt_tokens[0]['id'];
  session_to_database($database, $tmp_insert_token);
}
$tmp_yt_tokens=$database->sql_select("authtoken LEFT JOIN channel_token ON authtoken.id=channel_token.token_id","authtoken.*, channel_token.channel_id","true ORDER BY channel_token.last_cron LIMIT 1",false);
$_SESSION['token'] = $tmp_yt_tokens[0];

$youtube = new Google_Service_YouTube($client);

// SQL Load Token
$_tmp_tabellename="bot_token";
$check_table=$database->show_tables();
if(!in_array($_tmp_tabellename, $check_table)) {
  $felder=null;
  $felder["yt_token"]="VARCHAR(255)";
  $felder["id"]="VARCHAR(255)";
  $felder["token"]="TEXT";
  $felder["last_used"]="TEXT";
  $felder["cooldown"]="TEXT";
  $database->create_table($_tmp_tabellename, $felder, "yt_token, id");
  unset($felder);
}
$tmp_tokens=$database->sql_select($_tmp_tabellename,"*","yt_token=".$tmp_yt_tokens[0]['id'],true);
foreach ($tmp_tokens as $tmp_key => $tmp_value)  {
  foreach($tmp_value as $t2key => $t2value) {
    $token[$tmp_value["id"]][$t2key] = $t2value;
  }
  if ( $token[$tmp_value["id"]]["cooldown"] == 0) {
    $token[$tmp_value["id"]]["cooldown"] = 300;
  }
}
function init_token($name) {
  $_tmp_token["id"]=$name;
  $_tmp_token["token"]="null";
  $_tmp_token["last_used"]=0;
  $_tmp_token["cooldown"]=300;
  $_tmp_token['yt_token']=0;
  return $_tmp_token;
}

if (isset($tmp_yt_tokens[0]['channel_id'])) {
	echo date("d.m.Y - H:i:s")." - ".$tmp_yt_tokens[0]['channel_id'].'<br><br>';
}

include("cronjob/load_channels.php");
if (!isset($tmp_yt_tokens[0]['channel_id'])) {
  die("CHANNEL ID KANN NICHT GEFUNDEN WERDEN!");
}

include("cronjob/channels_contentDetails.php");
include("cronjob/channels_statistics.php");

include("cronjob/subscriptions_subscriberSnippet.php");
include("cronjob/playlistItems_snippet_uploaded.php");

include("cronjob/videos_statistics.php");
include("cronjob/videos_status.php");
//include("cronjob/videos_contentDetails.php");

include("cronjob/channels_livestreamchat.php");
include("cronjob/livestream_chat.php");
//include("cronjob/videos_liveStreamingDetails.php");

?>
