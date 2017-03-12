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


// Cronjob Channel for Token
$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  
  $listResponse = $youtube->channels->listChannels('id', array('mine' => 'true',));
  $check_table=$database->show_tables();
  if(!in_array($_tmp_tabellename, $check_table)) {
    $felder=null;
    $felder["user"]="VARCHAR(20)";
    $felder["channel_id"]="VARCHAR(50)";
    $felder["last_cron"]="INT(20)";
    $database->create_table($_tmp_tabellename, $felder, "user, channel_id");
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
    $newData["user"]=$_SESSION['user']['email'];
    $newData["last_cron"]=0;
    if (isset($_SESSION['user']['youtube_user'])) {
      if ($_SESSION['user']['youtube_user']==$newData['channel_id']) {
        $newData["last_cron"]=time();
      }
    }
    $database->sql_insert_update($_tmp_tabellename, $newData);
    
    if ($_SESSION['user']['youtube_user']=="") {
      $_SESSION['user']['youtube_user']=$newData['channel_id'];
      $database->sql_insert_update("user", $_SESSION['user']);
    }
    unset($newData);
  }
  $tt["cooldown"]="60";
}
// Save Token
echo date("d.m.Y - H:i:s").' : '.$_tmp_tabellename." updated!<br>";
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);
unset($tt);

?>
