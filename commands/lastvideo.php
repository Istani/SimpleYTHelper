<?php
require 'inc/php_inc.php';

// default
$vidtitle = 0;
$vidlink = "Nobody";

$check_table=$database->show_tables();

$_tmp_tabellename="videos_status";
if(in_array($_tmp_tabellename, $check_table)) {
  $db_stats = $database->sql_select($_tmp_tabellename." INNER JOIN videos_snippet ON videos_snippet.videoID=videos_status.videoId", "videos_snippet.*", "videos_snippet.ignore='0' AND videos_status.privacystatus ='public' ORDER BY videos_snippet.publishedat DESC LIMIT 1", true);
  $vidtitle=$db_stats[0]["title"];
  $vidlink="https://www.youtube.com/watch?v=".$db_stats[0]["videoid"];
}

echo $vidtitle . "\n\r" . $vidlink;
?>
