<?php
require 'inc/php_inc.php';

// default
$vidtitle = "";
$vidlink = "";

if ($_GET["param"]=="") {
  include("lastvideo.php");
} else {
  $check_table=$database->show_tables();
  
  $_tmp_tabellename="youtube_videos";
  if(in_array($_tmp_tabellename, $check_table)) {
    $db_stats = $database->sql_select($_tmp_tabellename, "*", "youtube_id='".$_GET['param']."' ORDER BY youtube_snippet_publishedat DESC LIMIT 1", false);
    if (isset($db_stats[0])) {
      $vidtitle=$db_stats[0]["youtube_snippet_title"];
      $vidlink="https://www.youtube.com/watch?v=".$db_stats[0]["youtube_id"];
      echo $vidtitle . "\n\r" . $vidlink;
    } else {
      echo "Video mit dieser ID nicht gefunden!\n\r";
      //$vidlink="https://www.youtube.com/watch?v=".$_GET["param"];
      include("lastvideo.php");
    }
  }
}
?>
