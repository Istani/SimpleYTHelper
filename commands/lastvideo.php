<?php
require 'inc/php_inc.php';

// default
$vidtitle = "Kein Video gefunden!";
$vidlink = "";

$check_table=$database->show_tables();

$_tmp_tabellename="youtube_videos";
if(in_array($_tmp_tabellename, $check_table)) {
  $db_stats = $database->sql_select($_tmp_tabellename, "*", "youtube_status_privacystatus ='public' AND youtube_status_uploadstatus LIKE 'processed' AND youtube_snippet_channelid='".$_SESSION['user']['youtube_user']."' ORDER BY simple_publishtimestamp DESC LIMIT 1", false);
  if (isset($db_stats[0])) {
    $vidtitle=$db_stats[0]["youtube_snippet_title"];
    $vidlink="https://www.youtube.com/watch?v=".$db_stats[0]["youtube_id"];
  }
}

echo $vidtitle . "\n\r" . $vidlink;
?>
