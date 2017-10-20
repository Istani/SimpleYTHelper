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
  $felder["sponsorid"]="VARCHAR(255)";
  $felder["channelid"]="VARCHAR(255)";
  $felder["channelUrl"]="VARCHAR(255)";
  $felder["displayName"]="VARCHAR(255)";
  $felder["profileImageUrl"]="VARCHAR(255)";
  $felder["first_seen"]="INT(20)";
  $felder["last_seen"]="TEXT";
  $database->create_table($_tmp_tabellename, $felder, "sponsorid, channelid");
  unset($felder);
}

$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  $client = new OAuth2\Client($OAUTH2_CLIENT_ID, $OAUTH2_CLIENT_SECRET);
  $params = array('part' => "snippet");
  $client->setAccessToken($tmp_token['access_token']);
  $client->setAccessTokenType(1); //ACCESS_TOKEN_BEARER
  $response = $client->fetch('https://www.googleapis.com/youtube/v3/sponsors', $params);
  
  for ($cnt_sponsors=0;$cnt_sponsors<count($response['result']['items']);$cnt_sponsors++) {
    $this_sponsor=$response['result']['items'][$cnt_sponsors]['snippet']['sponsorDetails'];
    $this_sponsor['first_seen']=strtotime($response['result']['items'][$cnt_sponsors]['snippet']['sponsorSince']);
    $this_sponsor["last_seen"]=time();
    $this_sponsor["sponsorid"]=$tmp_token['channel_id'];
    $database->sql_insert_update($_tmp_tabellename, $this_sponsor);
    unset($this_sponsor);
  }
  $tt["cooldown"]=60*60;
}
// Save Token
echo date("d.m.Y - H:i:s")." - ".$tmp_token['channel_id'].': '.$_tmp_tabellename." updated!<br>";
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if (!isset($tt["token"])) {$tt["token"]="";}
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);
unset($tt);
?>
