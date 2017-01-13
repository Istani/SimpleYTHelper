<?php
require 'inc/php_inc.php';

//Load from Data TABLE: channels_liveStreamChat
$_tmp_tabellename=strtolower("channels_liveStreamChat");
$db_stats = $database->sql_select($_tmp_tabellename, "*", "channel_id='".$_SESSION['token']['channel_id']."'", true);

$BroadcastId=$db_stats[0]["broadcastId"];
$ChatId=$db_stats[0]["chatId"];

if ($BroadcastId!="null" && $BroadcastId!="") {
  echo "http://youtube.com/Defender833/live";
  
} else {
  echo "Kein Livestream gefunden!";
}
?>
