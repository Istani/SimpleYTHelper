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
  $tmp_newvideo['link']="https://www.youtube.com/watch?v=".$videos_yt[$v]["videoid"];
  $tmp_newvideo['title']=$videos_yt[$v]["title"];
  $tmp_newvideo['description']=$videos_yt[$v]["description"];
  $tmp_newvideo['publishedat']=strtotime($videos_yt[$v]["publishedat"]);
  $tmp_newvideo['thumbnail']=$videos_yt[$v]['thumbnail'];
  // Was braaucht man noch?
  
  $videos_status=$database->sql_select("videos_status", "*", "videoid='".$videos_yt[$v]["videoid"]."' LIMIT 1",true);
  if ($videos_status[0]['privacystatus']=="public") {
    $video_list[]=$tmp_newvideo;
    break;
  }
  unset($tmp_newvideo);
}

if (isset($video_list)) {
  for ($v=0;$v<count($video_list);$v++) {
    echo $v.'.';
    debug_log($video_list[$v]);
    echo '<br>';
  }
}

// Do Magic 2
/*
$wpadress = "http://127.0.0.1/wordpress/xmlrpc.php";
$rpc = new xmlrpc_client($wpadress, true);
$resp = $client->call('system.listMethods', array());
debug_log($resp);
$params = array(
1,
'admin',
'P@ssW0rd',
10
);
$resp = $rpc->call(
'wp.getPages',
$params
);
debug_log($resp);
*/
// Save Token
echo date("d.m.Y - H:i:s")." - ".$_SESSION['user']['email'].': '.$cronjob_id." updated!<br>";
$tt["cooldown"]=1*60*60; // Test
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);
unset($tt);
?>
