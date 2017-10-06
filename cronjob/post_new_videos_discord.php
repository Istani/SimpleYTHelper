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

// Get My Videos Since last Try?!?
if ($tt["token"]=="null" or is_null($tt['token'])) {
  $tt['token']=0;
}
if (isset($video_list)) {
  unset($video_list);
}
$videos_yt=$database->sql_select("videos_snippet", "*", "channelid='".$_SESSION['user']['youtube_user']."' AND first_seen>".$tt['token']." ORDER BY first_seen",true);
for ($v=0;$v<count($videos_yt);$v++) {
  $tmp_newvideo['id']=$videos_yt[$v]["videoid"];
  $tmp_newvideo['link']="https://www.youtube.com/watch?v=".$videos_yt[$v]["videoid"];
  $tmp_newvideo['title']=$videos_yt[$v]["title"];
  $tmp_newvideo['description']=$videos_yt[$v]["description"];
  $tmp_newvideo['first_seen']=strtotime($videos_yt[$v]["first_seen"]);
  $tmp_newvideo['thumbnail']=$videos_yt[$v]['thumbnail'];
  // Was braucht man noch?
  
  $videos_status=$database->sql_select("videos_status", "*", "videoid='".$videos_yt[$v]["videoid"]."' LIMIT 1",true);
  if ($videos_status[0]['privacystatus']=="public") {
    $video_list[]=$tmp_newvideo;
    break;
  }
  unset($tmp_newvideo);
}

if (isset($video_list)) {
  for ($v=0;$v<count($video_list);$v++) {
    // Falls irgendwann mehrere video quellen verwendet werden
  }
}

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
        $add_post['message']="!yt video ".$video_list[0]['id'];
        $add_post['process']=0;
        //$database->sql_insert_update("bot_chatlog", $add_post);
        unset($add_post);
        
        //$tt['token']=$video_list[0]['first_seen'];
      }
    }
  }
}

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
