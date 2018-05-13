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
  $felder["twitch_from_id"]="VARCHAR(50)";
  $felder["twitch_to_id"]="VARCHAR(50)";
  $database->create_table($_tmp_tabellename, $felder, "twitch_from_id, twitch_to_id");
  unset($felder);
}

$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  
  /* REFRESH TOKEN */
  $params=array(
    "refresh_token"=>$tmp_token["refresh_token"]
  );
  $Twitch_TOKEN_ENDPOINT         = 'https://id.twitch.tv/oauth2/token';
  $response = $twitch->getAccessToken($Twitch_TOKEN_ENDPOINT, 'RefreshToken', $params);
  $response=$response['result'];
  $response['user']=$_SESSION['user']['email'];
  $response['service']="Twitch";
  $response['scope']=implode("+",$response['scope']);
  authtoken_save($database, $response);
  
  if ($tt['token']!="" && $tt["token"]!="null") {
    $response = $twitch->fetch('https://api.twitch.tv/helix/users/follows?to_id='.$_SESSION['user']['twitch_user'].'&after='.$tt['token']);
  } else {
    $response = $twitch->fetch('https://api.twitch.tv/helix/users/follows?to_id='.$_SESSION['user']['twitch_user']);
  }
  /*
  $params="?client_id=".$twitch_CLIENT_ID;
  $response = $twitch->fetch('https://api.twitch.tv/kraken/channels/'.$_SESSION['user']['twitch_user'].'/follows'.$params);
  
  $response = $twitch->fetch("https://api.twitch.tv/kraken/channel".$params);
  debug_log($response);
  die();
  */
  if (isset($response['result']['pagination']['cursor'])) {
    $tt['token']=$response['result']['pagination']['cursor'];
  }
  if (!isset($response['result']['data'])) {
    $tt['token']="";
  }
  
  if (isset($response['result']['data'])) {
    for ($cnt_details=0;$cnt_details<count($response['result']['data']);$cnt_details++) {
      $tmp_details=$response['result']['data'][$cnt_details];
      
      $tmp_details=$SYTHS->multiarray2array($tmp_details, "twitch");
      debug_log($tmp_details);
      
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
    }
  }
  $tt["cooldown"]=60*10;
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
