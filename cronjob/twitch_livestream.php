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
  $felder["twitch_id"]="VARCHAR(50)";
  $database->create_table($_tmp_tabellename, $felder, "twitch_id");
  unset($felder);
}

$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  
  $params = array('user_id' => $_SESSION['user']['twitch_user']);
  
  $response = $twitch->fetch('https://api.twitch.tv/helix/streams',$params);
  
  
  
  if (isset($response['result']['data'][0])) {
    $tmp_details=$response['result']['data'][0];
    unset($tmp_details['community_ids']);
    
    $tmp_details=$SYTHS->multiarray2array($tmp_details, "twitch");
    foreach ($tmp_details as $key=>$value){
      $new_feld[$key]="TEXT";
      $database->add_columns($_tmp_tabellename, $new_feld);
      unset($new_feld);
      $newData[$key]=$value;
    }
    $database->sql_insert_update($_tmp_tabellename, $newData);
    
    if ($_SESSION['user']['twitch_user']=="") {
      $_SESSION['user']['twitch_user']=$newData['twitch_id'];
      $database->sql_insert_update("user", $_SESSION['user']);
    }
    unset($newData);
  } else {
    $database->sql_delete($_tmp_tabellename, "twitch_user_id='".$_SESSION['user']['twitch_user']."'");
  }
  
  debug_log($tmp_details);
  $tt["cooldown"]=60;
}
// Save Token
echo date("d.m.Y - H:i:s")." - ".$_SESSION['user']['email'].': '.$_tmp_tabellename." updated!<br>";
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if (!isset($tt["token"])) {$tt["token"]="";}
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);
unset($tt);
?>
