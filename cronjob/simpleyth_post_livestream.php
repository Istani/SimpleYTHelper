<?php
$cronjob_id=basename(__FILE__, '.php');
$do_job=check_settings($database, $cronjob_id);

if ($do_job==false) {
  return;
} else {
  $token[$cronjob_id]=load_cronjobtoken($database, $cronjob_id, $_SESSION['user']['email']);
}
$tt=$token[$cronjob_id];
// Der hat keine Eigene Tablle

if (isset($video_list)) {
  unset($video_list);
}
// YT
$videos_yt=$database->sql_select("youtube_livestream", "*", "youtube_snippet_channelid='".$_SESSION['user']['youtube_user']."' AND youtube_snippet_actualendtime IS NULL ORDER BY youtube_snippet_actualstarttime DESC LIMIT 1",false);
if (count($videos_yt)==0) {
  $tt['token']="";
} else {
  if ($videos_yt[0]["simple_lastupdate"]<time()-30*60) {
    $videos_yt[0]['youtube_snippet_actualendtime']="ERROR";
    $database->sql_insert_update("youtube_livestream", $videos_yt[0]);
    $tt['token']="ERROR";
  }
  if ($tt['token']=='null') {
    // Do Magic 2
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
            
            debug_log($add_post);
            unset($add_post);
          }
        }
      }
    }
  }
  $tt['token']=$videos_yt[0]['youtube_id'];
}
// NOTE: Ggf weitere Dienste
debug_log($tt);

// Save Token
echo date("d.m.Y - H:i:s")." - ".$_SESSION['user']['email'].': '.$cronjob_id." updated!<br>";
//$tt["cooldown"]=1*60*60; // Test
$tt["cooldown"]=60; // Test
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);
unset($tt);
//die();
?>
