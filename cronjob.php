<?php
require 'inc/php_inc.php';

// Check Tables
$check_table=$database->show_tables();
$_tmp_tabellename="authtoken";
if(!in_array($_tmp_tabellename, $check_table)) {
  die("ERROR!");
}
$_tmp_tabellename="bot_token";
if(!in_array($_tmp_tabellename, $check_table)) {
  $felder=null;
  $felder["yt_token"]="VARCHAR(255)";
  $felder["id"]="VARCHAR(255)";
  $felder["token"]="TEXT";
  $felder["last_used"]="TEXT";
  $felder["cooldown"]="TEXT";
  $database->create_table($_tmp_tabellename, $felder, "yt_token, id");
  unset($felder);
}
$_tmp_tabellename="channel_token";
if(!in_array($_tmp_tabellename, $check_table)) {
  $felder=null;
  $felder["token_id"]="INT(20)";
  $felder["channel_id"]="VARCHAR(50)";
  $felder["last_cron"]="INT(20)";
  $database->create_table($_tmp_tabellename, $felder, "token_id, channel_id");
  unset($felder);
}

// Load Bot Tokens
$_tmp_tabellename="authtoken";
$TmpToken['Bot']=$database->sql_select("authtoken","*","is_bot='1' ORDER BY last_seen LIMIT 1",false);
$TmpToken['Bot']=$TmpToken['Bot'][0];

$tmp_channel_data=$database->sql_select("channel_token","channel_id", "token_id='".$TmpToken['Bot']['id']."' ORDER BY last_cron LIMIT 1", true);
$TmpToken['Bot']['channel_id']=$tmp_channel_data[0]['channel_id'];

// Function
function init_token($name) {
  $_tmp_token["id"]=$name;
  $_tmp_token["token"]="null";
  $_tmp_token["last_used"]=0;
  $_tmp_token["cooldown"]=300;
  $_tmp_token['yt_token']=0;
  return $_tmp_token;
}

// While - Cronjob
$Time['Start']=time();
// Delete Wrong Data!
$database->sql_delete("authtoken", "refresh_token='' AND discrod_token=''");
$database->sql_delete("livestream_chat", "last_seen<".time()." AND `irgnore`=1");

// TODO: Token für neue Dateien erstellen?


// Bot Token da hinzufügen wo es noch keine Token gibt?!?
$tmp_all_token=$database->sql_select("bot_token", "id","yt_token>=0 GROUP BY id");
$tmp_all_auth=$database->sql_select("authtoken", "id","access_token>=0 GROUP BY id");
for($i=0;$i<count($tmp_all_token);$i++) {
  for($j=0;$j<count($tmp_all_auth);$j++) {
    $new_data['id']=$tmp_all_token[$i]['id'];
    $new_data['yt_token']=$tmp_all_auth[$j]['id'];
    $database->sql_insert_update("bot_token",$new_data);
    unset($new_data);
  }
}

while (time()-$Time['Start']<=45) {
  //if (time()>0) {
  // Getting Next Job
  $TmpNextJob=$database->sql_select("bot_token","*","last_used+cooldown <= ".time()." ORDER BY last_used+cooldown LIMIT 1",false);
  if(!isset($TmpNextJob[0]['yt_token'])) {
    sleep(1);
    continue;
  }
  foreach ($TmpNextJob as $tmp_key => $tmp_value)  {
    foreach($tmp_value as $t2key => $t2value) {
      $token[$tmp_value["id"]][$t2key] = $t2value;
    }
    if ( $token[$tmp_value["id"]]["cooldown"] == 0) {
      $token[$tmp_value["id"]]["cooldown"] = 300;
    }
  }
  
  // load User Token
  $TmpToken['User']=$database->sql_select("authtoken","*","id='".$TmpNextJob[0]['yt_token']."' ORDER BY id LIMIT 1",true);
  $TmpToken['User']=$TmpToken['User'][0];
  
  // Load Channel ID if exists
  $tmp_channel_data=$database->sql_select("channel_token","channel_id", "token_id='".$TmpToken['User']['id']."' ORDER BY last_cron LIMIT 1", true);
  $TmpToken['User']['channel_id']=$tmp_channel_data[0]['channel_id'];
  
  //Check User Token
  $tmp_token=$TmpToken['User'];
  if($tmp_token['access_token']!="") {
    if($tmp_token['google_clientid']=="") {
      $tmp_token['google_clientid']=$TmpToken['Bot']['google_clientid'];
      $tmp_token['google_clientsecret']=$TmpToken['Bot']['google_clientsecret'];
    }
    
    // Google Verbindung
    $client = new Google_Client();
    $client->setClientId($tmp_token['google_clientid']);
    $client->setClientSecret($tmp_token['google_clientsecret']);
    $client->setDeveloperKey($DEV_KEY);
    $client->setScopes('https: //www.googleapis.com/auth/youtube');
    $client->setAccessToken($tmp_token);
    if ($client->isAccessTokenExpired()) {
      $client->refreshToken($tmp_token['refresh_token']);
      $tmp_insert_token["token"]=$client->getAccessToken();
      $tmp_insert_token["token"]['id']=$tmp_token['id'];
      $tmp_insert_token["token"]['last_seen']=time();
      session_to_database($database, $tmp_insert_token);
    }
    $_SESSION['token'] = $tmp_token;
    $youtube = new Google_Service_YouTube($client);
    
    if ($tmp_token['channel_id']=="") {
      if (!isset($token['channel_token'])) {
        continue;
      }
    }
  }
  
  foreach ($token as $tokenkey => $tokenvalue) {
    include("cronjob/".$tokenkey.".php");
    sleep(1);
  }
}


$Time['End']=time();
echo '<br>';
echo date("d.m.Y H:i:s",$Time['Start']);
echo ' - ';
echo date("d.m.Y H:i:s",$Time['End']);
echo '<br>';
echo ($Time['End']-$Time['Start']).' Sek.<br>';

// Zur Einmaligen initalisierung
// TODO: Das ist so noch nicht richtig...
// Neue Dateien müssen einmalig selnst eingetragen werden
?>
