<?php
require 'inc/php_inc.php';

// default
$vidtitle = "";
$vidlink = "";

if ($_GET["param"]=="") {
  echo "Es wird eine Video ID als Parameter erwartet!\n\r";
  include("lastvideo.php");
} else {
  
  $check_table=$database->show_tables();
  
  $check_table=$database->show_tables();
  
  $_tmp_tabellename="videos_snippet";
  if(in_array($_tmp_tabellename, $check_table)) {
    $db_stats = $database->sql_select("videos_snippet", "*", "videos_snippet.ignore='0' AND videoid='".$_GET['param']."' ORDER BY publishedat DESC LIMIT 1", false);
    if (isset($db_stats[0])) {
      $vidtitle=$db_stats[0]["title"];
      $vidlink="https://www.youtube.com/watch?v=".$db_stats[0]["videoid"];
    } else {
      $vidtitle="Video mit dieser ID nicht gefunden!";
      $vidlink="https://www.youtube.com/watch?v=".$_GET["param"];
    }
  }
  echo $vidtitle . "\n\r" . $vidlink;
}
?>
