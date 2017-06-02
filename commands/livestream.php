<?php
require 'inc/php_inc.php';

//Load from Data TABLE: channels_liveStreamChat
$_tmp_tabellename=strtolower("channels_liveStreamChat");
$db_stats = $database->sql_select($_tmp_tabellename, "*", "channel_id='".$_SESSION['user']['youtube_user']."'", true);

$BroadcastId=$db_stats[0]["broadcastid"];
$ChatId=$db_stats[0]["chatid"];

if ($BroadcastId!="null" && $BroadcastId!="") {
  echo "http://gaming.youtube.com/channel/".$_SESSION['user']['youtube_user']."/live";
} else {
  echo "Kein Livestream gefunden!";
}
?>
