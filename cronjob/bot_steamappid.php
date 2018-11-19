<?php
// http://api.steampowered.com/ISteamApps/GetAppList/v0001/
$cronjob_id=basename(__FILE__, '.php');
$do_job=check_settings($database, $cronjob_id);

if ($do_job==false) {
  return;
  die();
} else {
  $token[$cronjob_id]=load_cronjobtoken($database, $cronjob_id, $_SESSION['user']['email']);
}
$_tmp_tabellename=strtolower($cronjob_id);

$check_table=$database->show_tables();
if(!in_array($_tmp_tabellename, $check_table)) {
  $felder=null;
  $felder["appid"]="VARCHAR(255) NOT NULL";
  $felder["name"]="VARCHAR(255) NOT NULL";
  $database->create_table($_tmp_tabellename, $felder, "appid");
  unset($felder);
}


$tt=$token[$_tmp_tabellename];
if (0) {
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  
  $client = new OAuth2\Client(NULL, NULL);
  $response = $client->fetch('http://api.steampowered.com/ISteamApps/GetAppList/v0001/');
  
  $list_of_apps=$response['result']["applist"]["apps"]["app"];
  for ($count_appids=0;$count_appids<count($list_of_apps);$count_appids++) {
    $database->sql_insert_update($_tmp_tabellename, $list_of_apps[$count_appids]);
  }
  $tt["cooldown"]=1*60*60*24;
}
}
// Save Token
echo date("d.m.Y - H:i:s")." - ".$_tmp_tabellename." updated!<br>";
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if($tt["token"]==""){$tt["token"]="null";}
if ($_SESSION['user']['email']!="") {
  $database->sql_insert_update("bot_token",$tt);
}
$token[strtolower("bot_chatspam")]=$tt;
unset($tt);
?>
