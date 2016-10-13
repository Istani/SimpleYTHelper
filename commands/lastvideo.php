<?php

// Getting SUB count & last name
require 'inc/php_inc.php';

$database=new db("sqlite","");
$database->connect_db("data/".$KANALID.".sqlite3");

// default
$vidtitle = 0;
$vidlink = "Nobody";

$check_table=$database->show_tables();

$_tmp_tabellename="videos_status";
if(in_array($_tmp_tabellename, $check_table)) {
  $db_stats = $database->sql_select($_tmp_tabellename." INNER JOIN videos_snippet ON videos_snippet.videoID=videos_status.videoId", "videos_snippet.*", "videos_snippet.ignore='0' AND videos_status.privacyStatus ='public' ORDER BY videos_snippet.publishedAt DESC LIMIT 1", true);
  $vidtitle=$db_stats[0]["title"];
  $vidlink="https://www.youtube.com/watch?v=".$db_stats[0]["videoId"];
}

echo $vidtitle . "\n\r" . $vidlink;
?>
