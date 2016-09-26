<?php

//$_GET["command"] = "debug";
//include("do.php");

require 'inc/php_inc.php';

$accessToken = load_accesstoken($KANALID);

$database=new db("sqlite","");
$database->connect_db("data/".$KANALID.".sqlite3");

// Google Verbindung
$client = new Google_Client();
$client->setClientId($OAUTH2_CLIENT_ID);
$client->setClientSecret($OAUTH2_CLIENT_SECRET);
$client->setDeveloperKey($DEV_KEY);
$client->setScopes('https: //www.googleapis.com/auth/youtube.readonly');

$client->setAccessToken($accessToken);
if ($client->isAccessTokenExpired()) {
  $client->refreshToken(load_refreshtoken($KANALID));
  save_accesstoken($KANALID, $client->getAccessToken());
}

$youtube = new Google_Service_YouTube($client);

// SQL Load Token
$_tmp_tabellename="bot_token";
$check_table=$database->show_tables();
if(!in_array($_tmp_tabellename, $check_table)) {
  $felder=null;
  $felder["id"]="TEXT";
  $felder["token"]="TEXT";
  $felder["last_used"]="TEXT";
  $felder["interval"]="TEXT";
  $database->create_table($_tmp_tabellename, $felder, "id");
  unset($felder);
}
$tmp_tokens=$database->sql_select($_tmp_tabellename,"*","",true);
foreach ($tmp_tokens as $tmp_key => $tmp_value)  {
  foreach($tmp_value as $t2key => $t2vakue) {
    if ($t2key!=(int)$t2key) {
      $token[$tmp_value["id"]][$t2key] = $t2value;
    }
  }
}
function init_token($name) {
  $_tmp_token["id"]=$name;
  $_tmp_token["token"]="null";
  $_tmp_token["last_used"]=0;
  $_tmp_token["interval"]=0;
  return $_tmp_token;
}

// Cronjob Channel Statistics
$_tmp_tabellename="channels_statistics";
if (!isset($token[$_tmp_tabellename])) {
  $token[$_tmp_tabellename] = init_token($_tmp_tabellename);
}
$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["interval"]<time()) {
  
  // Youtube Channel Statistics
  if ($tt["token"] == "null") {
    $listResponse = $youtube->channels->listChannels('statistics', array('id' => $KANALID));
  } else {
    $listResponse = $youtube->channels->listChannels('statistics', array('id' => $KANALID, "pageToken" => $refToken ));
  }
  $data4sql= $listResponse[0]["modelData"]["statistics"];
  $tt["token"]=$listResponse["nextPageToken"];
  
  // SQL Channel Statistics
  $check_table=$database->show_tables();
  if(!in_array($_tmp_tabellename, $check_table)) {
    $felder=null;
    $felder["id"]="TEXT";
    $felder["last_seen"]="TEXT";
    $database->create_table($_tmp_tabellename, $felder, "id");
    unset($felder);
  }
  $new_feld["ignore"]="TEXT";
  $database->add_columns($_tmp_tabellename, $new_feld);
  unset($new_feld);
  $database->sql_select($_tmp_tabellename, "*", "id='".$KANALID."' LIMIT 1", true);
  foreach ($data4sql as $key=>$value){
    $new_feld[$key]="TEXT";
    $database->add_columns($_tmp_tabellename, $new_feld);
    unset($new_feld);
    $newData[$key]=$value;
  }
  $newData["id"]=$KANALID;
  $newData["last_seen"]=time();
  $database->sql_insert_update($_tmp_tabellename, $newData);
  unset($newData);
  echo $_tmp_tabellename." updated!<br>";
  $tt["last_used"]=time();
}
// Save Token
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);


// Cronjob Subscriptions subscriberSnippet
$_tmp_tabellename="subscriptions_subscriberSnippet";
if (!isset($token[$_tmp_tabellename])) {
  $token[$_tmp_tabellename] = init_token($_tmp_tabellename);
}
$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["interval"]<time()) {
  
  // Youtube
  $req_count=1;
  if ($tt["token"] == "null") {
    $listResponse = $youtube->subscriptions->listSubscriptions("subscriberSnippet", array(/* 'channelId' => $KANALID, */"mySubscribers" => "true", "maxResults" => $req_count, "order" => "relevance"));
    } else {
      $listResponse = $youtube->subscriptions->listSubscriptions("subscriberSnippet", array(/* 'channelId' => $KANALID, */"mySubscribers" => "true", "maxResults" => $req_count, "order" => "relevance", "pageToken" => $refToken));
      }
      $data4sql= $listResponse;
      $tt["token"]=$listResponse["nextPageToken"];
      
      echo "<pre>";
      echo var_dump($data4sql);
      echo "</pre>";
      die();
      
      // SQL
      $check_table=$database->show_tables();
      if(!in_array($_tmp_tabellename, $check_table)) {
        $felder=null;
        $felder["id"]="TEXT";
        $felder["last_seen"]="TEXT";
        $database->create_table($_tmp_tabellename, $felder, "id");
        unset($felder);
      }
      $new_feld["ignore"]="TEXT";
      $database->add_columns($_tmp_tabellename, $new_feld);
      unset($new_feld);
      $database->sql_select($_tmp_tabellename, "*", "id='".$KANALID."' LIMIT 1", true);
      foreach ($data4sql as $key=>$value){
        $new_feld[$key]="TEXT";
        $database->add_columns($_tmp_tabellename, $new_feld);
        unset($new_feld);
        $newData[$key]=$value;
      }
      $newData["id"]=$KANALID;
      $newData["last_seen"]=time();
      $database->sql_insert_update($_tmp_tabellename, $newData);
      unset($newData);
      echo $_tmp_tabellename." updated!<br>";
      $tt["last_used"]=time();
    }
    // Save Token
    if($tt["token"]==""){$tt["token"]="null";}
    $database->sql_insert_update("bot_token",$tt);
    
    ?>
