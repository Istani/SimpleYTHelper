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
$videos_yt=$database->sql_select("videos_snippet", "*", "channelid='".$_SESSION['user']['youtube_user']."' AND publishedat>".$tt['token']." ORDER BY publishedat",true);
for ($v=0;$v<count($videos_yt);$v++) {
  $tmp_newvideo['id']=$videos_yt[$v]["videoid"];
  $tmp_newvideo['link']="https://www.youtube.com/watch?v=".$videos_yt[$v]["videoid"];
  $tmp_newvideo['title']=$videos_yt[$v]["title"];
  $tmp_newvideo['description']=$videos_yt[$v]["description"];
  $tmp_newvideo['publishedat']=strtotime($videos_yt[$v]["publishedat"]);
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
    echo $v.'.';
    debug_log($video_list[$v]);
    echo '<br>';
  }
}

// Do Magic 2
//require_once '../API/wordpress/class-IXR.php';
$wpadress = "http://www.defender833.de/xmlrpc.php";
$wpadress = "http://31.172.95.10/wordpress/xmlrpc.php";
$rpc = new IXR_Client($wpadress);
/* Get Methods */
$result = $rpc->query('system.listMethods');
if ($result) {
  debug_log($rpc->getResponse());
} else {
  echo 'Error [' . $rpc->getErrorCode() . ']: ' . $rpc->getErrorMessage().'<br>';
}

/* Do a Posting */
$content = array(
  'post_type' => 'post',
  'post_status' => 'pending',
  'post_title' => $video_list[0]['title'],
  'post_content' => $video_list[0]['description'],
  'terms' => array('category' => array( 0 ) ),
  'comment_status' => 'closed',
);
/*
$params = array(
1,
'sascha.u.kaufmann@googlemail.com',
'1234',
$content
);
$result = $rpc->query('wp.newPost', $params);

if ($result) {
// Jo alles gut
debug_log($rpc->getResponse());
} else {
echo 'Error [' . $rpc->getErrorCode() . ']: ' . $rpc->getErrorMessage().'<br>';
}
*/

// Save Token
echo date("d.m.Y - H:i:s")." - ".$_SESSION['user']['email'].': '.$cronjob_id." updated!<br>";
$tt["cooldown"]=1*60*60; // Test
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);
unset($tt);
//die();
?>
