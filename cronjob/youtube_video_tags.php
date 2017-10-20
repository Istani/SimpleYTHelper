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

if(!in_array($_tmp_tabellename, $check_table)) {
  $tagstab=null;
  $tagstab["videoid"]="VARCHAR(50)";
  $tagstab["tag"]="VARCHAR(255)";
  $database->create_table($_tmp_tabellename, $tagstab, "videoid, tag");
}

if (!isset($token[$_tmp_tabellename])) {
  $token[$_tmp_tabellename] = init_token($_tmp_tabellename);
}
$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  $req_count=50;
  $listRequests = $database->sql_select("videos_snippet","videoid", "`channelid`='".$_SESSION['user']['youtube_user']."' AND `ignore`=0 ORDER BY last_tagsupdate LIMIT ".$req_count, true);
  $data4sql= $listRequests;
  
  if (count($data4sql)>0) {
    $client = new OAuth2\Client($OAUTH2_CLIENT_ID, $OAUTH2_CLIENT_SECRET);
    $client->setAccessToken($tmp_token['access_token']);
    $client->setAccessTokenType(1); //ACCESS_TOKEN_BEARER
  }
  
  for($i=0;$i<count($data4sql);$i++) {
    unset($tagstab);
    $database->sql_delete($_tmp_tabellename, "videoid='".$data4sql[$i]["videoid"]."'");
    
    $params = array('part' => "snippet", 'id'=> $data4sql[$i]["videoid"]);
    $response = $client->fetch('https://www.googleapis.com/youtube/v3/videos', $params);
    $tags4video=$response['result']['items'][0]['snippet']['tags'];
    
    for($count_tags=0;$count_tags<count($tags4video);$count_tags++) {
      $tag_data=null;
      $tag_data['videoid']=$data4sql[$i]["videoid"];
      $tag_data['tag']=$tags4video[$count_tags];
      $database->sql_insert_update($_tmp_tabellename, $tag_data);
      unset($tag_data);
    }
    
    $newData["videoid"]=$data4sql[$i]["videoid"];
    $newData["last_tagsupdate"]=time();
    $database->sql_insert_update("videos_snippet", $newData);
    unset($newData);
  }
  
  $tt["cooldown"]=60;
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
