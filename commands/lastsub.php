<?php
require 'inc/php_inc.php';

// default
$subcount = 0;
$subname = "Nobody";

$check_table=$database->show_tables();

$_tmp_tabellename="youtube_channels";
if(in_array($_tmp_tabellename, $check_table)) {
  $db_stats = $database->sql_select($_tmp_tabellename, "*", "youtube_id='".$_SESSION['user']['youtube_user']."'", true);
  $subcount=$db_stats[0]["youtube_statistics_subscribercount"];
}

$_tmp_tabellename=strtolower("youtube_subscriber");
if(in_array($_tmp_tabellename, $check_table)) {
  $db_subs = $database->sql_select($_tmp_tabellename, "*", "youtube_channelid='".$_SESSION['user']['youtube_user']."' ORDER BY youtube_snippet_publishedat DESC LIMIT 1",true);
  $subname=$db_subs[0]["youtube_subscribersnippet_title"];
}
echo "#" . $subcount . " - " . $subname;
?>
