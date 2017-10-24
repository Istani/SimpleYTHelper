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
  $felder["youtube_id"]="VARCHAR(50)";
  $database->create_table($_tmp_tabellename, $felder, "youtube_id");
  unset($felder);
}

if(!in_array($_tmp_tabellename.'_tags', $check_table)) {
  $tagstab=null;
  $tagstab["youtube_id"]="VARCHAR(50)";
  $tagstab["tag"]="VARCHAR(255)";
  $database->create_table($_tmp_tabellename.'_tags', $tagstab, "youtube_id, tag");
}

$db_stats = $database->sql_select("channels_contentdetails", "*", "channel_id='".$_SESSION['user']['youtube_user']."'", true);
$uploadsListId=$db_stats[0]["uploads"];

$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  
  $client = new OAuth2\Client($OAUTH2_CLIENT_ID, $OAUTH2_CLIENT_SECRET);
  $params = array('part' => "snippet");
  $client->setAccessToken($tmp_token['access_token']);
  $client->setAccessTokenType(1); //ACCESS_TOKEN_BEARER
  //contentDetails
  //player
  //topicDetails
  //fileDetails
  //processingDetails
  //suggestions
  //localizations
  $part="id, liveStreamingDetails, snippet, statistics, status";
  //$params = array('part' => $part, 'id'=> "rdoyNKvhSOM");
  $params = array('part' => $part, 'id'=> $tt["token"]);
  $response = $client->fetch('https://www.googleapis.com/youtube/v3/videos', $params);
  
  
  
  $tmp_video_details=$response['result']['items'][0];
  debug_log($response);
  die();
  unset($tmp_video_details['kind']);
  unset($tmp_video_details['etag']);
  unset($tmp_video_details['snippet']['thumbnails']['medium']);
  unset($tmp_video_details['snippet']['thumbnails']['high']);
  unset($tmp_video_details['snippet']['thumbnails']['standard']);
  unset($tmp_video_details['snippet']['thumbnails']['maxres']);
  unset($tmp_video_details['snippet']['channelTitle']);
  $tmp_video_tags=$tmp_video_details['snippet']['tags'];
  unset($tmp_video_details['snippet']['tags']);
  unset($tmp_video_details['snippet']['localized']);
  $tmp_video_details=$SYTHS->multiarray2array($tmp_video_details, "youtube");
  
  
  
  debug_log($tmp_video_details);
  foreach ($tmp_video_details as $key=>$value){
    $new_feld[$key]="TEXT";
    $database->add_columns($_tmp_tabellename, $new_feld);
    unset($new_feld);
    $newData[$key]=$value;
  }
  $database->sql_insert_update($_tmp_tabellename, $newData);
  unset($newData);
  
  for($count_tags=0;$count_tags<count($tmp_video_tags);$count_tags++) {
    $tag_data=null;
    $tag_data['youtube_id']=$tmp_video_details["youtube_id"];
    $tag_data['tag']=$tmp_video_tags[$count_tags];
    $database->sql_insert_update($_tmp_tabellename.'_tags', $tag_data);
    unset($tag_data);
  }
  
  unset($tmp_video_details);
  unset($tmp_video_tags);
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
