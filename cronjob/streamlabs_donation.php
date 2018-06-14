<?php
$cronjob_id=basename(__FILE__, '.php');
$do_job=check_settings($database, $cronjob_id);

if ($do_job==false) {
  return;
} else {
  $token[$cronjob_id]=load_cronjobtoken($database, $cronjob_id, $_SESSION['user']['email']);
}
$tt=$token[$cronjob_id];

if ($tt["last_used"]+$tt["cooldown"]<time()) {
  $params=array(
    'currency'      => 'EUR',
    'limit'         => 99
  );
  $response = $client->fetch('https://streamlabs.com/api/v1.0/donations', $params);
  debug_log($response);
  $tt["cooldown"]=60*10;
}
// Save Token
echo date("d.m.Y - H:i:s")." - ".$_SESSION['user']['streamlabs_user'].': '.$cronjob_id." updated!<br>";
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if (!isset($tt["token"])) {$tt["token"]="";}
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);
unset($tt);
?>