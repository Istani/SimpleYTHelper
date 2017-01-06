<?php
// Cronjob
$_tmp_tabellename=strtolower("videos_contentDetails");
if (!isset($token[$_tmp_tabellename])) {
  $token[$_tmp_tabellename] = init_token($_tmp_tabellename);
}
$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  
  // Youtube
  $req_count=50;
  if ($tt["token"] == "null") {
    //$listResponse = $youtube->playlistItems->listPlaylistItems("snippet", array('playlistId' => $uploadsListId, "maxResults" => $req_count));
    $listRequests = $database->sql_select("videos_snippet","videoId", "ignore=0 ORDER BY last_contentDetailsupdate LIMIT ".$req_count, true);
  } else {
    //$listResponse = $youtube->playlistItems->listPlaylistItems("snippet", array('playlistId' => $uploadsListId, "maxResults" => $req_count, "pageToken" => $tt["token"]));
    $listRequests = $database->sql_select("videos_snippet","videoId", "ignore=0 ORDER BY last_contentDetailsupdate LIMIT ".$req_count, true);
  }
  
  //$data4sql= $listResponse["items"];
  $data4sql= $listRequests;
  $tt["token"]="null";
  
  // SQL
  $check_table=$database->show_tables();
  if(!in_array($_tmp_tabellename, $check_table)) {
    $felder=null;
    $felder["videoId"]="TEXT";
    $felder["last_seen"]="TEXT";
    $database->create_table($_tmp_tabellename, $felder, "");
    unset($felder);
  }
  $new_feld["first_seen"]="TEXT";
  $new_feld["ignore"]="TEXT";
  $database->add_columns($_tmp_tabellename, $new_feld);
  unset($new_feld);
  
  for($i=0;$i<count($data4sql);$i++) {
    $listResponse = $youtube->videos->listVideos("contentDetails", array('id' => $data4sql[$i]["videoId"]));
    $row4sql=$listResponse["items"][0]["contentDetails"];
    
    $json=json_encode($row4sql);
    $tmp_row4sql = json_decode($json, true);
    $tmp_row4sql["videoId"]= protected_settings($data4sql[$i]["videoId"]);
    $row4sql=null;
    $row4sql=$tmp_row4sql;
    
    foreach ($row4sql as $key=>$value){
      $new_feld[$key]="TEXT";
      $database->add_columns($_tmp_tabellename, $new_feld);
      unset($new_feld);
      $newData[$key]=$value;
    }
    $newData["last_seen"]=time();
    $database->sql_insert_update($_tmp_tabellename, $newData);
    unset($newData);
    
    $newData["videoId"]=$row4sql["videoId"];
    $newData["last_contentDetailsupdate"]=time();
    $database->sql_insert_update("videos_snippet", $newData);
    unset($newData);
  }
  // Update
  $empty_data=$database->sql_select($_tmp_tabellename, "videoId","first_seen IS NULL", false);
  foreach ($empty_data as $k=>$v){
    $newData=$v;
    $newData["first_seen"]=time();
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
