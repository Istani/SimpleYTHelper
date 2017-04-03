<?php
require 'inc/php_inc.php';

// default
$vidtitle = "Kein Video gefunden!";
$vidlink = "";

$check_table=$database->show_tables();

$_tmp_tabellename="videos_status";
if(in_array($_tmp_tabellename, $check_table)) {
  $db_stats = $database->sql_select($_tmp_tabellename." INNER JOIN videos_snippet ON videos_snippet.videoid=videos_status.videoid", "videos_snippet.*", "videos_snippet.ignore='0' AND videos_status.privacystatus ='public' AND channelid='".$_SESSION['user']['youtube_user']."' ORDER BY videos_snippet.first_seen DESC LIMIT 1", false);
  if (isset($db_stats[0])) {
    $vidtitle=$db_stats[0]["title"];
    $vidlink="https://www.youtube.com/watch?v=".$db_stats[0]["videoid"];
  }
}

echo $vidtitle . "\n\r" . $vidlink;
?>
