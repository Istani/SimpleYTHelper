<?php
$cronjob_id=basename(__FILE__, '.php');
$do_job=check_settings($database, $cronjob_id);

if ($do_job==false) {
  return;
} else {
  $token[$cronjob_id]=load_cronjobtoken($database, $cronjob_id, $_SESSION['user']['email']);
}
$tt=$token[$cronjob_id];
// Der hat keine Eigene Tablle

if ($tt["last_used"]+$tt["cooldown"]<time()) {
  $check_table=$database->show_tables();
  if(!in_array("bot_chatchannels", $check_table)) {
    $felder=null;
    $felder["service"]="VARCHAR(255)";
    $felder["host"]="VARCHAR(255)";
    $felder["room"]="VARCHAR(255)";
    $felder["last_msg"]="INT(20)";
    $felder["last_ad"]="INT(20)";
    $database->create_table("bot_chatchannels", $felder, "service, host, room");
    unset($felder);
  }

  $channels=$database->sql_select("bot_chatlog", "service, host, room, MAX(time) as last_msg", "service not like '%TTS' GROUP BY service, host, room", false);
  for ($count_channel=0;$count_channel<count($channels);$count_channel++) {
    $database->sql_insert_update("bot_chatchannels", $channels[$count_channel]);
  }
  //debug_log($channels);
  unset($channels);
  $channels=$database->sql_select("bot_chatchannels", "*", "last_ad IS NULL", false);
  for ($count_channel=0;$count_channel<count($channels);$count_channel++) {
    $channels[$count_channel]["last_ad"]=0;
    $database->sql_insert_update("bot_chatchannels", $channels[$count_channel]);
  }
  //debug_log($channels);
  unset($channels);
  $channels=$database->sql_select("bot_chatchannels", "*", "last_msg>last_ad", false);

  debug_log($channels);

  $bonus_count=3;
  $add_post['id']=time();
  $add_post['user']="-1";
  $add_post['message']="!ad";
  $add_post['process']=0;
  $add_post['php_process']=0;
  for ($count_channel=0;$count_channel<count($channels);$count_channel++) {
    $add_post['host']=$channels[$count_channel]['host'];
    $add_post['service']=$channels[$count_channel]['service'];
    $add_post['room']=$channels[$count_channel]['room'];
    $add_post['time']=time();

    $message=$database->sql_select("bot_chatlog", "count(time) as count_msg", "time>".$channels[$count_channel]["last_ad"]." AND service='".$channels[$count_channel]['service']."' AND host='".$channels[$count_channel]['host']."' AND room='".$channels[$count_channel]['room']."' GROUP BY service, host, room", false);
    if (($message[0]['count_msg']>$bonus_count+1) && $channels[$count_channel]['last_ad']<time()-(60*60)) {
      $channels[$count_channel]["last_ad"]=time();
      $database->sql_insert_update("bot_chatlog", $add_post);
      $database->sql_insert_update("bot_chatchannels", $channels[$count_channel]);
      $add_post['id']++;
    }

    if (($message[0]['count_msg']>$bonus_count+5) && $channels[$count_channel]['last_ad']<time()-(30*60)) {
      $channels[$count_channel]["last_ad"]=time();
      $database->sql_insert_update("bot_chatlog", $add_post);
      $database->sql_insert_update("bot_chatchannels", $channels[$count_channel]);
      $add_post['id']++;
    }

    if (($message[0]['count_msg']>$bonus_count+20) && $channels[$count_channel]['last_ad']<time()-(15*60)) {
      $channels[$count_channel]["last_ad"]=time();
      $database->sql_insert_update("bot_chatlog", $add_post);
      $database->sql_insert_update("bot_chatchannels", $channels[$count_channel]);
      $add_post['id']++;
    }

    if (($message[0]['count_msg']>$bonus_count+50) && $channels[$count_channel]['last_ad']<time()-(1*60)) {
      $channels[$count_channel]["last_ad"]=time();
      $database->sql_insert_update("bot_chatlog", $add_post);
      $database->sql_insert_update("bot_chatchannels", $channels[$count_channel]);
      $add_post['id']++;
    }
    
  }
}

// Save Token
echo date("d.m.Y - H:i:s")." - ".$_SESSION['user']['email'].': '.$cronjob_id." updated!<br>";
//$tt["cooldown"]=1*60*60; // Test
$tt["cooldown"]=60; // Test
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);
unset($tt);
//die();
?>
