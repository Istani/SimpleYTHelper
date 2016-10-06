<?php
// Benötigte Daten
$_tmp_tabellename="channels_contentDetails";
if(in_array($_tmp_tabellename, $check_table)) {
  $db_stats = $database->sql_select($_tmp_tabellename, "*", "id='".$KANALID."'", true);
  $uploadsListId=$db_stats[0]["uploads"];
}

// Cronjob
$_tmp_tabellename="videos_snippet";
if (!isset($token[$_tmp_tabellename])) {
  $token[$_tmp_tabellename] = init_token($_tmp_tabellename);
}
$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["interval"]<time()) {
  
  // Youtube
  $req_count=50;
  if ($tt["token"] == "null") {
    $listResponse = $youtube->playlistItems->listPlaylistItems("snippet", array('playlistId' => $uploadsListId, "maxResults" => $req_count));
  } else {
    $listResponse = $youtube->playlistItems->listPlaylistItems("snippet", array('playlistId' => $uploadsListId, "maxResults" => $req_count, "pageToken" => $tt["token"]));
  }
  
  
  $data4sql= $listResponse["items"];
  $tt["token"]=$listResponse["nextPageToken"];
  
  // SQL
  $check_table=$database->show_tables();
  if(!in_array($_tmp_tabellename, $check_table)) {
    $felder=null;
    $felder["videoId"]="TEXT";
    $felder["last_seen"]="TEXT";
    $database->create_table($_tmp_tabellename, $felder, "videoId");
    unset($felder);
  }
  $new_feld["first_seen"]="TEXT";
  $new_feld["last_statisticsupdate"]="TEXT";
  $new_feld["ignore"]="TEXT";
  $database->add_columns($_tmp_tabellename, $new_feld);
  unset($new_feld);
  
  for($i=0;$i<count($data4sql);$i++) {
    $row4sql= $data4sql[$i]["snippet"];
    $json=json_encode($row4sql);
    $tmp_row4sql = json_decode($json, true);
    $tmp_row4sql["thumbnail"]= protected_settings( $row4sql["modelData"]["thumbnails"]["default"]["url"]);
    $tmp_row4sql["videoId"]= protected_settings( $row4sql["modelData"]["resourceId"]["videoId"]);
    $row4sql=null;
    $row4sql=$tmp_row4sql;
    
    unset($row4sql["channelId"]);
    unset($row4sql["channelTitle"]);
    unset($row4sql["playlistId"]);
    unset($row4sql["position"]);
    
    foreach ($row4sql as $key=>$value){
      $new_feld[$key]="TEXT";
      $database->add_columns($_tmp_tabellename, $new_feld);
      unset($new_feld);
      $newData[$key]=$value;
    }
    $newData["last_seen"]=time();
    $database->sql_insert_update($_tmp_tabellename, $newData);
    unset($newData);
  }
  // Update
  $empty_data=$database->sql_select($_tmp_tabellename, "videoId","first_seen IS NULL", false);
  foreach ($empty_data as $k=>$v){
    $newData=$v;
    $newData["first_seen"]=time();
    $newData["last_statisticsupdate"]=0;
    $newData["ignore"]=0;
    $database->sql_insert_update($_tmp_tabellename, $newData);
  }
  unset($newData);
  
  
  echo $_tmp_tabellename." updated!<br>";
  $tt["last_used"]=time();
}
// Save Token
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);

?>
