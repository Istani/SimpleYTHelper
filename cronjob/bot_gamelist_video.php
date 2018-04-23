<?php
// http://api.steampowered.com/ISteamApps/GetAppList/v0001/
$cronjob_id=basename(__FILE__, '.php');
$do_job=check_settings($database, $cronjob_id);

if ($do_job==false) {
  return;
  die();
} else {
  $token[$cronjob_id]=load_cronjobtoken($database, $cronjob_id, $_SESSION['user']['email']);
}
$_tmp_tabellename=strtolower($cronjob_id);

$check_table=$database->show_tables();
if(in_array("bot_gamelist", $check_table)) {
  if(!in_array($_tmp_tabellename, $check_table)) {
    $felder=null;
    $felder["name"]="VARCHAR(255) NOT NULL";
    $felder["channel"]="VARCHAR(255) NOT NULL";
    $felder["count_video"]="VARCHAR(255) NOT NULL";
    $database->create_table($_tmp_tabellename, $felder, "name, channel");
    unset($felder);
  }
  if (isset($new_data)) {
    unset($new_data);
  }
  
  $tt=$token[$_tmp_tabellename];
  if ($tt["last_used"]+$tt["cooldown"]<time()) {
    $games=$database->sql_select("bot_gamelist","name","description NOT LIKE ''");
    
    for ($count_games=0;$count_games<count($games);$count_games++) {
      $this_game=$games[$count_games];
      if ($this_game['name']!="") {
        // TODO: Bei mehreren Video Quellen erweitern!
        $possible_videos=$database->sql_select("youtube_videos","youtube_snippet_channelid, COUNT(youtube_id) AS simpleyth_count","youtube_snippet_title LIKE '".$this_game['name']." |%' GROUP BY youtube_snippet_channelid");
        for ($count_videos=0;$count_videos<count($possible_videos);$count_videos++) {
          $this_channel=$possible_videos[$count_videos];
          if ($this_channel['youtube_snippet_channelid']!="") {
            $new_data['name']=$this_game['name'];
            $new_data['channel']=$this_channel['youtube_snippet_channelid'];
            $new_data['count_video']=$this_channel['simpleyth_count'];
            $database->sql_insert_update($_tmp_tabellename, $new_data);
            debug_log($new_data);
            unset($new_data);
          }
        }
      }
    }
  }
}
$tt["cooldown"]=1*60*60*24;
// Save Token
echo date("d.m.Y - H:i:s")." - ".$_tmp_tabellename." updated!<br>";
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if($tt["token"]==""){$tt["token"]="null";}
if ($_SESSION['user']['email']!="") {
  $database->sql_insert_update("bot_token",$tt);
}
$token[strtolower("bot_chatspam")]=$tt;
unset($tt);
?>
