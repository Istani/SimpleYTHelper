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
  
  $_SESSION['user']=$database->sql_select("user","*","email='".$TmpNextJob[0]['user']."'", true);
  $_SESSION['user']=$_SESSION['user'][0];
  
  // Load Bot Tokens
  $_tmp_tabellename="authtoken";
  $bot_user=$database->sql_select("user","*","status='1' LIMIT 1",true);
  $TmpToken['Bot']=$database->sql_select("authtoken","*","service='".$TmpNextJob[0]['service']."' AND user='".$bot_user[0]['email']."' LIMIT 1",true);
  $TmpToken['Bot']=$TmpToken['Bot'][0];
  $TmpToken['Bot']['service']=$TmpNextJob[0]['service'];
  $TmpToken['Bot']['channel_id']=$_SESSION['user']['youtube_user'];
  
  // load User Token
  $TmpToken['User']=$database->sql_select("authtoken","*","service='".$TmpNextJob[0]['service']."' AND user='".$TmpNextJob[0]['user']."' LIMIT 1",true);
  $TmpToken['User']=$TmpToken['User'][0];
  $TmpToken['User']['service']=$TmpNextJob[0]['service'];
  $TmpToken['User']['channel_id']=$_SESSION['user']['youtube_user'];
  
  
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
    break;
    case 'Twitch':
    $tmp_token=$TmpToken['User'];
    if ($tmp_token['user']=="") {
      $tmp_token=$TmpToken['Bot'];
    }
    $client = new OAuth2\Client($twitch_CLIENT_ID, $twitch_CLIENT_SECRET);
    // TODO: Check for Refresh TOKEN
    
    $client->setAccessToken($tmp_token["access_token"]);
    $client->setAccessTokenType(1); //ACCESS_TOKEN_BEARER
    $twitch=$client;
    
    break;
    case 'Streamlabs':
    $tmp_token=$TmpToken['User'];
    if ($tmp_token['user']=="") {
      $tmp_token=$TmpToken['Bot'];
    }
    $client = new OAuth2\Client($streamlabs_CLIENT_ID, $streamlabs_CLIENT_SECRET);
    // TODO: Check for Refresh TOKEN
    
    $client->setAccessToken($tmp_token["access_token"]);
    $client->setAccessTokenType(1); //ACCESS_TOKEN_BEARER
    $streamlabs=$client;
    
    break;
    default:
    
    break;
  }
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
