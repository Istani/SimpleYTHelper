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

$check_table=$database->show_tables();
if(!in_array($_tmp_tabellename, $check_table)) {
  $felder=null;
  $felder["youtube_link"]="VARCHAR(255)";
  $felder["youtube_text"]="TEXT";
  $felder["last_update"]="BIGINT(20) NOT NULL DEFAULT '0'";
  $database->create_table($_tmp_tabellename, $felder, "youtube_link");
  unset($felder);
}

$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  /* Starte neuen Scan */
  if ($tt["cooldown"]>60*2) {
    $add_post['service']="Discord";
    $add_post['host']="225369387001970690";
    $add_post['room']="225371711619465216";
    $add_post['id']=time();
    $add_post['time']=time();
    $add_post['user']="-1";
    $add_post['message']="!scan_youtube_communitytab ".$tmp_token['channel_id'];
    $add_post['process']=0;
    $add_post['php_process']=0;
    $database->sql_insert_update("bot_chatlog", $add_post);
    debug_log($add_post);
    unset($add_post);
  }
  $tt["cooldown"]=60*15;
  
  /* Überprüfe vorhande Daten */
  $yt_com=$database->sql_select($_tmp_tabellename,"*","youtube_link LIKE 'https://www.youtube.com/channel/".$tmp_token['channel_id']."%' AND last_update=0 LIMIT 1",false);
  if (isset($yt_com[0])) {
    $tt["cooldown"]=60; // Geringere Cooldown weil es ggf mehr zu posten geben könnte...
    $yt_com['0']['last_update']=time();
    $database->sql_insert_update($_tmp_tabellename, $yt_com['0']);
    
    $game_data=$database->sql_select("bot_chathosts", "*", "owner='".$_SESSION['user']['twitch_user']."' or owner='".$_SESSION['user']['youtube_user']."' or owner='".$_SESSION['user']['discord_user']."'", false);
    for ($count_game_data=0;$count_game_data<count($game_data);$count_game_data++) {
      $this_channel=$game_data[$count_game_data];
      $add_post['room']='';
      if ($this_channel['service']=="Discord") {
        $add_post['room']=$this_channel['channel_community'];
        $t_user=$_SESSION['user']['discord_user'];
      }
      
      if ($add_post['room']!='') {
        $add_post['service']=$this_channel['service'];
        $add_post['host']=$this_channel['host'];
        $add_post['id']=$post_time++;
        $add_post['time']=time();
        $add_post['user']=$t_user;
        $add_post['message']="!yt community";
        $add_post['process']=0;
        $database->sql_insert_update("bot_chatlog", $add_post);
        debug_log($add_post);
      }
      unset($add_post);
    }
  }
  
}

// Save Token
echo date("d.m.Y - H:i:s")." - ".$tmp_token['channel_id'].': '.$_tmp_tabellename." updated!<br>";
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if (!isset($tt["token"])) {$tt["token"]="";}
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);
unset($tt);
?>
