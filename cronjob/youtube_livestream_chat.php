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
  $req_max=2000;
  // Check Livstream Chat ID
  $liveStream=$database->sql_select("youtube_livestream","*","youtube_snippet_channelid='".$_SESSION['user']['youtube_user']."' AND (youtube_snippet_actualendtime IS NULL OR youtube_snippet_actualendtime='')  ORDER BY 	youtube_snippet_actualstarttime DESC LIMIT 1", true);
  $chatId=$liveStream[0]['youtube_snippet_livechatid'];
  
  $client = new OAuth2\Client($OAUTH2_CLIENT_ID, $OAUTH2_CLIENT_SECRET);
  $client->setAccessToken($tmp_token['access_token']);
  $client->setAccessTokenType(1); //ACCESS_TOKEN_BEARER
  
  if (($tt['token']!="" && $tt['token']!=null && $tt['token']!='null')) {
    $params = array(
      'part' => 'snippet, authorDetails',
      'liveChatId'=>$chatId,
      'maxResults'=>$req_max,
      'pageToken'=>$tt['token']
    );
  } else {
    $params = array(
      'part' => 'snippet, authorDetails',
      'liveChatId'=>$chatId,
      'maxResults'=>$req_max,
    );
  }
  
  $response = $client->fetch('https://www.googleapis.com/youtube/v3/liveChat/messages', $params);
  
  if (isset($response['result']['nextPageToken'])) {
    $tt["token"]=$response['result']['nextPageToken'];
  } else {
    $tt["token"]="";
  }
  if (isset($response['result']["pollingIntervalMillis"])) {
    $tt["cooldown"]=$response['result']["pollingIntervalMillis"]/1000+1;
  } else {
    $tt["cooldown"]=5;
    $tt["token"]="";
  }
  
  if (!isset($response['result']['items'])) {
    $details_max=0;
  } else {
    $details_max=count($response['result']['items']);
  }
  for ($cnt_details=0;$cnt_details<$details_max;$cnt_details++) {
    $tmp_details=$response['result']['items'][$cnt_details];
    unset($tmp_details['kind']);
    unset($tmp_details['etag']);
    
    unset($tmp_details['snippet']['type']);
    unset($tmp_details['snippet']['hasDisplayContent']);
    unset($tmp_details['snippet']['textMessageDetails']);
    unset($tmp_details['snippet']['authorChannelId']);
    
    $tmp_details=$SYTHS->multiarray2array($tmp_details, "youtube");
    debug_log($tmp_details);
    
    $tmp_details['simpleyth_host']=$_SESSION['user']['youtube_user'];
    $tmp_details['simpleyth_ignore']=0;
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
  //$tt["cooldown"]=60*10;
  // NOTE: Livstream Chat Cooldown wird weiter oben festgelegt!
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
