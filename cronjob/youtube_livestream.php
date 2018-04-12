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
  $felder["youtube_id"]="VARCHAR(255)";
  $database->create_table($_tmp_tabellename, $felder, "youtube_id");
  unset($felder);
}

$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  $req_max=50;
  $client = new OAuth2\Client($OAUTH2_CLIENT_ID, $OAUTH2_CLIENT_SECRET);
  $client->setAccessToken($tmp_token['access_token']);
  $client->setAccessTokenType(1); //ACCESS_TOKEN_BEARER
  
  $params = array(
    'part' => "id",
    'channelId'=>$_SESSION['user']['youtube_user'],
    'eventType'=>'live',
    'type'=>'video'
  );
  $response = $client->fetch('https://www.googleapis.com/youtube/v3/search', $params);
  if (isset($response['result']["items"][0])) {
    $BroadcastId=$response['result']["items"][0]["id"]["videoId"];
  } else {
    $BroadcastId="";
  }
  unset($response);
  
  $params = array(
    'part' => "snippet",
    'id'=>$BroadcastId
  );
  $response = $client->fetch('https://www.googleapis.com/youtube/v3/liveBroadcasts', $params);
  
  if (isset($response['result']['nextPageToken'])) {
    $tt["token"]=$response['result']['nextPageToken'];
  } else {
    $tt["token"]="";
  }
  if (isset($response['result']['items'])) {
    $details_max=count($response['result']['items']);
  } else {
    $details_max=0;
  }
  if ($details_max==0) {
    $tt["token"]="";
    $database->sql_delete($_tmp_tabellename, "youtube_snippet_actualendtime NOT LIKE ''");
  }
  for ($cnt_details=0;$cnt_details<$details_max;$cnt_details++) {
    $tmp_details=$response['result']['items'][$cnt_details];
    unset($tmp_details['kind']);
    unset($tmp_details['etag']);
    
    unset($tmp_details['snippet']['thumbnails']['medium']);
    unset($tmp_details['snippet']['thumbnails']['high']);
    unset($tmp_details['snippet']['thumbnails']['standard']);
    unset($tmp_details['snippet']['thumbnails']['maxres']);
    
    unset($tmp_details['snippet']['isDefaultBroadcast']);
    
    
    $tmp_details=$SYTHS->multiarray2array($tmp_details, "youtube");
    $tmp_details['simple_lastUpdate']=time();
    debug_log($tmp_details);
    
    foreach ($tmp_details as $key=>$value){
      $new_feld[$key]="TEXT";
      $database->add_columns($_tmp_tabellename, $new_feld);
      unset($new_feld);
      $newData[$key]=$value;
    }
    $database->sql_insert_update($_tmp_tabellename, $newData);
    unset($newData);
    unset($tmp_details);
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
