<?php
// Cronjob Channel Statistics
$_tmp_tabellename=strtolower("channels_liveStreamChat");
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
  
  // Youtube Channel Statistics
  if ($tt["token"] == "null") {
    $listResponse = $youtube-> search->listSearch('id', array('channelId'=>$_SESSION['token']['channel_id'], 'eventType'=>'live', 'type'=>'video'));
  } else {
    $listResponse = $youtube-> search->listSearch('id', array('channelId'=>$_SESSION['token']['channel_id'], 'eventType'=>'live', 'type'=>'video', "pageToken" => $tt["token"] ));
  }
  $tt["token"]=$listResponse["nextPageToken"];
  if (isset($listResponse["items"][0])) {
    $BroadcastId=$listResponse["items"][0]["id"]["videoId"];
    
    $listResponse = $youtube->liveBroadcasts->listLiveBroadcasts('snippet',array('id'=>$BroadcastId));
    $ChatId=$listResponse["items"][0]["snippet"]["liveChatId"];
  }
  $new_feld["broadcastId"]="TEXT";
  $database->add_columns($_tmp_tabellename, $new_feld);
  unset($new_feld);
  $new_feld["chatId"]="TEXT";
  $database->add_columns($_tmp_tabellename, $new_feld);
  unset($new_feld);
  
  $newData["channel_id"]=$_SESSION['token']['channel_id'];
  $newData["last_seen"]=time();
  $newData["broadcastId"]=$BroadcastId;
  $newData["chatId"]=$ChatId;
  $database->sql_insert_update($_tmp_tabellename, $newData);
  unset($newData);
  
  echo $_tmp_tabellename." updated!<br>";
  $tt["last_used"]=time();
  $tt["yt_token"]=$_SESSION['token']['id'];
}
// Save Token
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);

?>
