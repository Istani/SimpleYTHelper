<?php
$cronjob_id=basename(__FILE__, '.php');
$do_job=check_settings($database, $cronjob_id);

if ($do_job==false) {
  return;
  die();
} else {
  $token[$cronjob_id]=load_cronjobtoken($database, $cronjob_id, $_SESSION['user']['email']);
}
$_tmp_tabellename=strtolower($cronjob_id);


if (!isset($token[$_tmp_tabellename])) {
  $token[$_tmp_tabellename] = init_token($_tmp_tabellename);
}
$tt=$token[strtolower($_tmp_tabellename)];

if ($tt["last_used"]+$tt["cooldown"]<time()) {
  $oldest_date=$SYTHS->get_timestamp('tag',true, -32);
  //$database->sql_delete("bot_chatlog", "`time`<".$oldest_date." AND `process`=1");
  $database->sql_delete("bot_chatstats", "`date`<".$oldest_date."");
  $database->sql_delete("bot_chathosts", "`last_seen`<".$oldest_date."000");
  $database->sql_delete("bot_chatuser", "`last_seen`<".$oldest_date."000");
  
  // Zumindest Einmalig benötigt
  $check_table=$database->show_tables();
  if(!in_array("channel_token", $check_table)) {
    // Warten mal früher benutzet Tabellen...
    $database->sql_droptable("bot_chat_stats");
    $database->sql_droptable("channel_token");
    $database->sql_droptable("channels_contentdetails");
    $database->sql_droptable("channels_livestreamchat");
    $database->sql_droptable("channels_statistics");
    $database->sql_droptable("ergebnisse");
    $database->sql_droptable("livestream_chat");
    $database->sql_droptable("playlistitems_id");
    $database->sql_droptable("playlists_snippet");
    $database->sql_droptable("rpg_check");
    $database->sql_droptable("rpg_player");
    $database->sql_droptable("rpg_player_attack");
    $database->sql_droptable("rpg_settings");
    $database->sql_droptable("rss_news");
    $database->sql_droptable("rss_news_source");
    $database->sql_droptable("simpleyth_rss_automation");
    $database->sql_droptable("simpleyth_rss_posts");
    $database->sql_droptable("simpleyth_rss_source");
    $database->sql_droptable("subscriptions_subscribersnippet");
    $database->sql_droptable("temp_test");
    $database->sql_droptable("temp_test_tags");
    $database->sql_droptable("umfragen");
    $database->sql_droptable("user_voted");
    $database->sql_droptable("videos_contentdetails");
    $database->sql_droptable("videos_livestreamingdetails");
    $database->sql_droptable("videos_snippet");
    $database->sql_droptable("videos_snippet_tags");
    $database->sql_droptable("videos_statistics");
    $database->sql_droptable("videos_status");
    $database->sql_droptable("youtube_video_tags");
    unset($felder);
  }
  $tt["cooldown"]=1*60*60;
}
// Save Token
echo date("d.m.Y - H:i:s")." - ".$_tmp_tabellename." updated!<br>";
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if($tt["token"]==""){$tt["token"]="null";}
if ($_SESSION['user']['email']!="") {
  $database->sql_insert_update("bot_token",$tt);
}
$token[strtolower($cronjob_id)]=$tt;
unset($tt);
?>
