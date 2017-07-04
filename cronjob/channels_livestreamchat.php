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
$tt=$token[$_tmp_tabellename];

$BroadcastId=null;
$ChatId=null;

if ($tt["last_used"]+$tt["cooldown"]<time()) {
  // SQL Channel Statistics
  $check_table=$database->show_tables();
  if(!in_array($_tmp_tabellename, $check_table)) {
    $felder=null;
    $felder["channel_id"]="VARCHAR(50)";
    $felder["last_seen"]="TEXT";
    $database->create_table($_tmp_tabellename, $felder, "channel_id");
    unset($felder);
  }
  
  $tab_name_livestream="channels_liveStreamChat";
  $db_stats = $database->sql_select($tab_name_livestream, "*", "channel_id='".$_SESSION['user']['youtube_user']."'", true);
  $BroadcastId_old=$db_stats[0]["broadcastid"];
  $ChatId_old=$db_stats[0]["chatid"];
  
  // Youtube Channel Statistics
  if ($tt["token"] == "null") {
    $listResponse = $youtube-> search->listSearch('id', array('channelId'=>$_SESSION['user']['youtube_user'], 'eventType'=>'live', 'type'=>'video'));
  } else {
    $listResponse = $youtube-> search->listSearch('id', array('channelId'=>$_SESSION['user']['youtube_user'], 'eventType'=>'live', 'type'=>'video', "pageToken" => $tt["token"] ));
  }
  $tt["token"]=$listResponse["nextPageToken"];
  if (isset($listResponse["items"][0])) {
    $BroadcastId=$listResponse["items"][0]["id"]["videoId"];
    
    $listResponse = $youtube->liveBroadcasts->listLiveBroadcasts('snippet',array('id'=>$BroadcastId));
    $ChatId=$listResponse["items"][0]["snippet"]["liveChatId"];
    
    if ($ChatId!=$ChatId_old && $ChatId!="") {
      // Ein neuer Livestream!
      $my_rechte=$SYTHS->may_post_videos_on($_SESSION['user']['email']);
      foreach ($my_rechte as $t_service => $the_hosts) {
        foreach ($the_hosts as $t_host => $t_channel) {
          if ($t_channel!="0") {
            // Posten versuchen
            $t_user="";
            if ($t_service=="Discord") {
              $t_user=$_SESSION['user']['discord_user'];
            }
            
            // Poste
            if ($t_user!="") {
              $add_post['service']=$t_service;
              $add_post['host']=$t_host;
              $add_post['room']=$t_channel;
              $add_post['id']=time();
              $add_post['time']=time();
              $add_post['user']=$t_user;
              $add_post['message']="!yt livestream";
              $add_post['process']=0;
              $database->sql_insert_update("bot_chatlog", $add_post);
              unset($add_post);
            }
          }
        }
      }
      
      // NOTE: Starts a new RPG-Zone Maybee?
      if ($_SESSION['user']['email']=='Admin') {
        $add_post['id']=time();
        $add_post['time']=time();
        $add_post['user']='-1';
        $add_post['message']="!secrect start"; // TODO: Muss später geändert werden
        $add_post['process']=0;
        
        $add_post['service']='YouTube';
        $add_post['host']=$_SESSION['user']['youtube_user'];
        $add_post['room']=$ChatId;
        $database->sql_insert_update("bot_chatlog", $add_post);
        
        $discord_server=$database->sql_select("bot_chathosts", "*", "owner='".$_SESSION['user']['discord_user']."'",true);
        $add_post['service']='Discord';
        $add_post['host']=$discord_server[0]['host'];
        $add_post['room']=$discord_server[0]['channel_rpgmain'];
        $database->sql_insert_update("bot_chatlog", $add_post);
        
        
        unset($add_post);
      }
    }
  } else {
    $BroadcastId="";
    $ChatId="";
  }
  $new_feld["broadcastId"]="TEXT";
  $database->add_columns($_tmp_tabellename, $new_feld);
  unset($new_feld);
  $new_feld["chatId"]="TEXT";
  $database->add_columns($_tmp_tabellename, $new_feld);
  unset($new_feld);
  
  $newData["channel_id"]=$_SESSION['user']['youtube_user'];
  $newData["last_seen"]=time();
  $newData["broadcastId"]=$BroadcastId;
  $newData["chatId"]=$ChatId;
  $database->sql_insert_update($_tmp_tabellename, $newData);
  unset($newData);
  $tt["cooldown"]=60;
}
// Save Token
echo date("d.m.Y - H:i:s")." - ".$tmp_token['channel_id'].': '.$_tmp_tabellename." updated!<br>";
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);
unset($tt);

?>
