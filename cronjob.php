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
  $felder["user"]="VARCHAR(255)";
  $felder["id"]="VARCHAR(255)";
  $felder["token"]="TEXT";
  $felder["last_used"]="TEXT";
  $felder["cooldown"]="TEXT";
  $database->create_table($_tmp_tabellename, $felder, "user, id");
  unset($felder);
}
$_tmp_tabellename="channel_token";
if(!in_array($_tmp_tabellename, $check_table)) {
  $felder=null;
  $felder["user"]="VARCHAR(255)";
  $felder["channel_id"]="VARCHAR(50)";
  $felder["last_cron"]="INT(20)";
  $database->create_table($_tmp_tabellename, $felder, "user, channel_id");
  unset($felder);
}

// While - Cronjob
$Time['Start']=time();
// Delete Wrong Data!
//$database->sql_delete("authtoken", "refresh_token='' AND discrod_token=''");
$database->sql_delete("livestream_chat", "last_seen<".time()." AND `irgnore`=1");

// TODO: Token für neue Dateien erstellen?
$_SESSION['cronjob']="setup";
// NOTE: Add ALL the Cronjobs!
$alledateien = scandir('cronjob');
foreach ($alledateien as $datei) {
  if ($datei!=".." && $datei !=".") {
    //echo $datei."<br />";
    include ("cronjob/".$datei);
  }
};
unset($_SESSION['cronjob']);

while (time()-$Time['Start']<=55) {
  // Getting Next Job
  if (isset($_GET['job_type'])) {
    $TmpNextJob=$database->sql_select("bot_token","*","service not like '' AND last_used+cooldown <= ".time()." and id='".$_GET['job_type']."' ORDER BY last_used+cooldown",false);
  } else {
    $TmpNextJob=$database->sql_select("bot_token","*","service not like '' AND last_used+cooldown <= ".time()." ORDER BY last_used+cooldown",false);
  }
  
  if(!isset($TmpNextJob[0]['service'])) {
    sleep(1);
    continue;
  }
  $i_s=0;
  while ($TmpNextJob[0]['service']=="") {
    $i_s++;
    if ($i_s>count($TmpNextJob)) {
      return;
    }
    if (isset($TmpNextJob[$i_s]['service'])) {
      $TmpNextJob[0]=$TmpNextJob[$i_s];
    }
    unset($TmpNextJob[$i_s]);
  }
  foreach ($TmpNextJob as $tmp_key => $tmp_value)  {
    foreach($tmp_value as $t2key => $t2value) {
      $token[$tmp_value["id"]][$t2key] = $t2value;
    }
    if ( $token[$tmp_value["id"]]["cooldown"] == 0) {
      $token[$tmp_value["id"]]["cooldown"] = 300;
    }
  }
  
  // Load Bot Tokens
  $_tmp_tabellename="authtoken";
  $bot_user=$database->sql_select("user","*","status='1' LIMIT 1",true);
  $TmpToken['Bot']=$database->sql_select("authtoken","*","service='".$TmpNextJob[0]['service']."' AND user='".$bot_user[0]['email']."' LIMIT 1",true);
  $TmpToken['Bot']=$TmpToken['Bot'][0];
  $TmpToken['Bot']['service']=$TmpNextJob[0]['service'];
  
  $tmp_channel_data=$database->sql_select("channel_token","channel_id", "user='".$TmpToken['Bot']['user']."' ORDER BY last_cron LIMIT 1", true);
  $TmpToken['Bot']['channel_id']=$tmp_channel_data[0]['channel_id'];
  
  // load User Token
  $TmpToken['User']=$database->sql_select("authtoken","*","service='".$TmpNextJob[0]['service']."' AND user='".$TmpNextJob[0]['user']."' LIMIT 1",true);
  $TmpToken['User']=$TmpToken['User'][0];
  $TmpToken['User']['service']=$TmpNextJob[0]['service'];
  
  // Load Channel ID if exists
  $tmp_channel_data=$database->sql_select("channel_token","channel_id", "user='".$TmpNextJob[0]['user']."' ORDER BY last_cron LIMIT 1", true);
  $TmpToken['User']['channel_id']=$tmp_channel_data[0]['channel_id'];
  
  $_SESSION['user']=$database->sql_select("user","*","email='".$TmpNextJob[0]['user']."'", true);
  $_SESSION['user']=$_SESSION['user'][0];
  //debug_log($TmpToken);
  //debug_log($token['bot_chatspam']);
  //debug_log($_SESSION['user']);
  switch ($TmpNextJob[0]['service']) {
    case 'YouTube':
    $tmp_token=$TmpToken['User'];
    if ($tmp_token['user']=="") {
      $tmp_token=$TmpToken['Bot'];
    }
    
    $client = new Google_Client();
    //if ($TmpToken['User']['client_id']!="") {
    //  $client->setClientId($TmpToken['User']['client_id']);
    //  $client->setClientSecret($TmpToken['User']['client_secret']);
    //} else {
    $client->setClientId($OAUTH2_CLIENT_ID);
    $client->setClientSecret($OAUTH2_CLIENT_SECRET);
    //}
    $client->setDeveloperKey($DEV_KEY);
    $client->setScopes('https://www.googleapis.com/auth/youtube');
    //https://www.googleapis.com/auth/youtubepartner
    $client->setAccessType('offline');
    $client->setAccessToken($tmp_token);
    //debug_log($tmp_token);
    if ($client->isAccessTokenExpired()) {
      if ($tmp_token['refresh_token']!="") {
        $client->refreshToken($tmp_token['refresh_token']);
        
        $tmp_insert_token["token"]=$client->getAccessToken();
        foreach ($tmp_insert_token["token"] as $key => $value) {
          $tmp_token[$key]=$value;
        }
        $tmp_channel=$tmp_token['channel_id'];
        //$tmp_clientid=$tmp_token['client_id'];
        //$tmp_clientsecret=$tmp_token['client_secret'];
        unset($tmp_token['channel_id']);
        if ($tmp_token['user']!="") {
          authtoken_save($database, $tmp_token);
        }
        $tmp_token['channel_id']=$tmp_channel;
        //$tmp_token['client_id']=$tmp_clientid;
        //$tmp_token['client_secret']=$tmp_clientsecret;
      }
    }
    $youtube = new Google_Service_YouTube($client);
    
    default:
    if (file_exists("cronjob/".$TmpNextJob[0]['id'].".php")) {
      include("cronjob/".$TmpNextJob[0]['id'].".php");
    } else {
      $database->sql_delete("bot_token", "id='".$TmpNextJob[0]['id']."'");
    }
    //die();
    sleep(1);
    if (isset($_GET['job_type'])) {
      die();
    }
    break;
  }
}
//$database->close();


$Time['End']=time();
echo '<br>';
echo date("d.m.Y H:i:s",$Time['Start']);
echo ' - ';
echo date("d.m.Y H:i:s",$Time['End']);
echo '<br>';
echo ($Time['End']-$Time['Start']).' Sek.<br>';
?>
