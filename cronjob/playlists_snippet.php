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
$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  
  // Youtube Channel Statistics
  $req_count=50;
  if ($tt["token"] == "null") {
    $listResponse = $youtube->playlists->listPlaylists('snippet', array('mine' => 'true', "maxResults" => $req_count));
  } else {
    $listResponse = $youtube->playlists->listPlaylists('snippet', array('mine' => 'true', "maxResults" => $req_count));
  }
  
  $data4sql= $listResponse["items"];
  $tt["token"]=$listResponse["nextPageToken"];
  
  // SQL Channel Statistics
  $check_table=$database->show_tables();
  if(!in_array($_tmp_tabellename, $check_table)) {
    $felder=null;
    $felder["channelid"]="VARCHAR(50)";
    $felder["paylistid"]="VARCHAR(50)";
    $felder["last_seen"]="INT(20)";
    $felder["first_seen"]="INT(20)";
    $felder["last_cronjob"]="INT(20)";
    $felder["last_token"]="INT(20)";
    $felder["ignore"]="INT(1)";
    $database->create_table($_tmp_tabellename, $felder, "channelid, paylistid");
    unset($felder);
  }
  
  for($i=0;$i<count($data4sql);$i++) {
    $row4sql= $data4sql[$i]["snippet"];
    $json=json_encode($row4sql);
    $tmp_row4sql = json_decode($json, true);
    $tmp_row4sql["thumbnail"]= protected_settings( $row4sql["modelData"]["thumbnails"]["default"]["url"]);
    $tmp_row4sql["paylistid"]=$data4sql[$i]['id'];
    $row4sql=null;
    $row4sql=$tmp_row4sql;
    
    unset($row4sql["channelTitle"]);
    unset($row4sql["defaultlanguage"]);
    
    foreach ($row4sql as $key=>$value){
      $new_feld[$key]="TEXT";
      $database->add_columns($_tmp_tabellename, $new_feld);
      unset($new_feld);
      $newData[$key]=$value;
    }
    
    //$newData['first_seen']=strtotime($newData["publishedat"]); // Naja ist nicht wirklcih First_seen, aber ist besser so
    $newData["last_seen"]=time();
    $database->sql_insert_update($_tmp_tabellename, $newData);
    $old=$database->sql_select($_tmp_tabellename,"*","channelid='".$newData["channelId"]."' AND paylistid='".$newData["paylistid"]."'",true);
    $old[0]['first_seen']=strtotime($old[0]["publishedat"]);
    $database->sql_insert_update($_tmp_tabellename, $old[0]);
    unset($newData);
    unset($old);
  }
  $tt["cooldown"]=300;
}
// Save Token
echo date("d.m.Y - H:i:s")." - ".$tmp_token['channel_id'].': '.$_tmp_tabellename." updated!<br>";
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);
unset($tt);
?>
