<?php
// Cronjob Channel Statistics
$_tmp_tabellename="channels_liveStreamChat";
if (!isset($token[$_tmp_tabellename])) {
  $token[$_tmp_tabellename] = init_token($_tmp_tabellename);
}
$tt=$token[$_tmp_tabellename];

$BroadcastId=null;
$ChatId=null;

if ($tt["last_used"]+$tt["interval"]<time()) {
  // SQL Channel Statistics
  $check_table=$database->show_tables();
  if(!in_array($_tmp_tabellename, $check_table)) {
    $felder=null;
    $felder["id"]="TEXT";
    $felder["last_seen"]="TEXT";
    $database->create_table($_tmp_tabellename, $felder, "id");
    unset($felder);
  }
  
  // Youtube Channel Statistics
  if ($tt["token"] == "null") {
    $listResponse = $youtube-> search->listSearch('id', array('channelId'=>$KANALID, 'eventType'=>'live', 'type'=>'video'));
  } else {
    $listResponse = $youtube-> search->listSearch('id', array('channelId'=>$KANALID, 'eventType'=>'live', 'type'=>'video', "pageToken" => $tt["token"] ));
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
  
  $newData["id"]=$KANALID;
  $newData["last_seen"]=time();
  $newData["broadcastId"]=$BroadcastId;
  $newData["chatId"]=$ChatId;
  $database->sql_insert_update($_tmp_tabellename, $newData);
  unset($newData);
  
  echo $_tmp_tabellename." updated!<br>";
  $tt["last_used"]=time();
}
// Save Token
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);

?>