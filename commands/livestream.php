<?php
require 'inc/php_inc.php';

//Load from Data TABLE: channels_liveStreamChat
$_tmp_tabellename=strtolower("youtube_livestream");
$videos_yt=$database->sql_select("youtube_livestream", "*", "youtube_snippet_channelid='".$_SESSION['user']['youtube_user']."' AND youtube_snippet_actualendtime IS NULL ORDER BY youtube_snippet_actualstarttime DESC LIMIT 1",false);

if (count($videos_yt)>=0) {
  echo "http://gaming.youtube.com/channel/".$_SESSION['user']['youtube_user']."/live";
} else {
  echo "Kein Livestream gefunden!";
}
?>
