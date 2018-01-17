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

$check_table=$database->show_tables();
if(!in_array("$_tmp_tabellename", $check_table)) {
  $felder=null;
  $felder["service"]="VARCHAR(255) NOT NULL";
  $felder["host"]="VARCHAR(255) NOT NULL";
  $felder["user"]="VARCHAR(255) NOT NULL";
  $felder["date"]="BIGINT(20) NOT NULL";
  $felder["count"]="BIGINT(20) NOT NULL DEFAULT '0'";
  $database->create_table($_tmp_tabellename, $felder, "service, host, user, date");
  unset($felder);
}


if (!isset($token[$_tmp_tabellename])) {
  $token[$_tmp_tabellename] = init_token($_tmp_tabellename);
}
$tt=$token[strtolower($_tmp_tabellename)];

if ($tt["last_used"]+$tt["cooldown"]<time()) {
  $seks_a_day=60*60*24;
  $time=time();
  $minute=(int)($time/60);
  $stunde=(int)($minute/60);
  $tag=(int)($stunde/24);
  
  $sql_user=$database->sql_select("bot_chatuser","*", "is_bot=0", true);
  for($i=0;$i<count($sql_user);$i++) {
    $start_tag=$tag-3;
    // Berechnung der Nachtichten
    while($start_tag<$tag) {
      $start_stunde=$start_tag*24;
      $start_minute=$start_stunde*60;
      $start_timestamp=$start_minute*60;
      
      $ende_tag=$start_tag+1;
      $ende_stunde=$ende_tag*24;
      $ende_minute=$ende_stunde*60;
      $ende_timestamp=$ende_minute*60;
      // Für jeden User die Nachricten Abfragen
      $sql_msg_count=$database->sql_select("bot_chatlog", "count(message) as Anzahl","service='".$sql_user[$i]['service']."' AND host='".$sql_user[$i]['host']."' AND user='".$sql_user[$i]['user']."' AND time>=".$start_timestamp." AND time<".$ende_timestamp ,true);
      if ($sql_msg_count[0]['Anzahl']=="") {$sql_msg_count[0]['Anzahl']=0;}
      // Write start
      if (isset($new_data)) {unset($new_data);}
      $new_data['service']=$sql_user[$i]['service'];
      $new_data['host']=$sql_user[$i]['host'];
      $new_data['user']=$sql_user[$i]['user'];
      $new_data['date']=$start_timestamp;
      $new_data['count']=$sql_msg_count[0]['Anzahl'];
      $database->sql_insert_update($_tmp_tabellename, $new_data);
      $start_tag=$ende_tag;
    }
    // Update User
    $sql_msg_avg=$database->sql_select($_tmp_tabellename, "sum(count) as Summe, avg(count) as AVG","service='".$sql_user[$i]['service']."' AND host='".$sql_user[$i]['host']."' AND user='".$sql_user[$i]['user']."'" ,true);
    $sql_user[$i]['msg_sum']=$sql_msg_avg[0]['Summe'];
    $sql_user[$i]['msg_avg']=$sql_msg_avg[0]['AVG'];
    $database->sql_insert_update("bot_chatuser", $sql_user[$i]);
  }
  $tt["cooldown"]=1*60*60; // Einmal die Stunde reicht locker!
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
