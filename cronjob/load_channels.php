<?php
// Cronjob Channel for Token
$_tmp_tabellename=strtolower("channel_token");
if (!isset($token[$_tmp_tabellename])) {
  $token[$_tmp_tabellename] = init_token($_tmp_tabellename);
}
$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  
  $listResponse = $youtube->channels->listChannels('id', array('mine' => 'true',));
  $check_table=$database->show_tables();
  if(!in_array($_tmp_tabellename, $check_table)) {
    $felder=null;
    $felder["token_id"]="INT(20)";
    $felder["channel_id"]="VARCHAR(50)";
    $database->create_table($_tmp_tabellename, $felder, "");
    unset($felder);
  }
  if (isset($data4sql)) {
    unset($data4sql);
  }
  foreach ($listResponse["items"] as $listItem) {
    $data4sql['channel_id']=$listItem["id"];
    foreach ($data4sql as $key=>$value){
      $new_feld[$key]="TEXT";
      $database->add_columns($_tmp_tabellename, $new_feld);
      unset($new_feld);
      $newData[$key]=$value;
    }
    $newData["token_id"]=$_SESSION['token']['id'];
    $database->sql_insert_update($_tmp_tabellename, $newData);
    unset($newData);
  }
  echo $_tmp_tabellename." updated!<br>";
  $tt["last_used"]=time();
  $tt["yt_token"]=$_SESSION['token']['id'];
}
// Save Token
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);

?>
