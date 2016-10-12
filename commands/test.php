<?php

// Getting SUB count & last name
require 'inc/php_inc.php';

$database=new db("sqlite","");
$database->connect_db("data/".$KANALID.".sqlite3");

// default
$vidtitle = 0;
$vidlink = "Nobody";

$check_table=$database->show_tables();

$_tmp_tabellename="videos_liveStreamingDetails";
if(in_array($_tmp_tabellename, $check_table)) {
  $db_stats = $database->sql_select($_tmp_tabellename, "*", "videoID NOT NULL ORDER BY actualStartTime DESC", true);
  $vidtitle="";
  $vidlink="";
  for ($i=0;$i<1;$i++){
  echo	var_dump($db_stats[$i]);
  }
}

echo $vidtitle . "\n\r" . $vidlink;
?>