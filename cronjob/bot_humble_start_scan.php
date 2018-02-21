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
$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  // Start the Scan
  $add_post['service']="Discord";
  $add_post['host']="225369387001970690";
  $add_post['room']="225371711619465216";
  $add_post['id']=time();
  $add_post['time']=time();
  $add_post['user']="-1";
  $add_post['message']="!humble_scan";
  $add_post['process']=0;
  $add_post['php_process']=0;
  $database->sql_insert_update("bot_chatlog", $add_post);
  debug_log($add_post);
  
  $tt["cooldown"]=60*60; // 1 Stunde?
}
echo date("d.m.Y - H:i:s")." - ".$_tmp_tabellename." updated!<br>";
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if (!isset($tt["token"])) {$tt["token"]="";}
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);
unset($tt);
?>
