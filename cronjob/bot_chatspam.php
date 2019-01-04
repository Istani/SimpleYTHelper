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
$tt=$token[strtolower("bot_chatspam")];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  if (isset($data4sql)) {
    unset($data4sql);
  }
/*
  // Mehr als 3 Nachrichten in der Minute
  // TODO: Die Berechnung stimmt noch nicht^^
  $listRequests = $database->sql_select("bot_chatlog","service, host, room, user, count(message) as Anzahl", "`time` >=".($tt["last_used"]-1)." GROUP BY service, host, room, user", true);
  $data4sql= $listRequests; // Hier unnötig, aber dann ist es so wie überall anders!
  for($i=0;$i<count($data4sql);$i++) {
    $modifier=time()-($tt["last_used"]-1); // CheckGesamtZeit
    $modifier=$modifier/60; // Anzahl Minuten GesamtZeit
    $tmp_row4sql=$data4sql[$i];
    if (isset($tmp_row4sql['Anzahl'])) {
      $tmp_row4sql['Anzahl']=$tmp_row4sql['Anzahl']/$modifier;
      if ($tmp_row4sql['Anzahl']>=10) {
        // Hier haben wir einen Gewinner!
        unset($tmp_row4sql['Anzahl']);
        $check_user=true;
        $user_name=$database->sql_select("bot_chatuser","name", "service='".$tmp_row4sql['service']."' AND host='".$tmp_row4sql['host']."' AND user='".$tmp_row4sql['user']."' AND is_bot=0", true);
        $user_roles=$database->sql_select("bot_chatuser_roles","role", "service='".$tmp_row4sql['service']."' AND host='".$tmp_row4sql['host']."' AND user='".$tmp_row4sql['user']."'", true);
        for ($j=0;$j<count($user_roles);$j++) {
          if ($user_roles[$j]['role']!="") {
            $role_check=$database->sql_select("bot_chatroles","check_spam", "service='".$tmp_row4sql['service']."' AND host='".$tmp_row4sql['host']."' AND role='".$user_roles[$j]['role']."'", true);
            for ($k=0;$k<count($role_check);$k++) {
              if ($role_check[$k]['check_spam']==0) {
                $check_user=false;
              }
            }
          }
        }
        $tmp_row4sql['message']="!report_user ".$user_name[0]['name']." : Zuviele Nachrichten in kurzer Zeit!";
        if ($user_name[0]['name']!="" && $check_user==true) {
          $tmp_row4sql['user']=-1;
          $tmp_row4sql['time']=0;
          $milliseconds = round(microtime(true) * 10000);
          $tmp_row4sql['id']=$milliseconds;
          $database->sql_insert_update("bot_chatlog", $tmp_row4sql);
        }
      }
    }
  }
  // bot_chatbadword
  $welche_server_checken=$database->sql_select("bot_chatlog","service, host, room", "`time` >=".($tt["last_used"]-1)."  GROUP BY service, host, room", false);
  for($i=0;$i<count($welche_server_checken);$i++) {
    $listWords = $database->sql_select("bot_chatbadword","service, host, word", "service='".$welche_server_checken[$i]['service']."' AND host='".$welche_server_checken[$i]['host']."'", false);
    $listMSG = $database->sql_select("bot_chatlog","service, host, room, user, message", "service='".$welche_server_checken[$i]['service']."' AND host='".$welche_server_checken[$i]['host']."' AND `time`>='".($tt["last_used"]-1)."'", false);
    for($j=0;$j<count($listWords);$j++) {
      for($k=0;$k<count($listMSG);$k++) {
        if ($listWords[$j]['word']!="") {
          if ($listMSG[$k]['message']!=str_replace($listWords[$j]['word'],"",$listMSG[$k]['message'])) {
            echo $listMSG[$k]['message']. ' - '.$listWords[$j]['word']." - ".str_replace($listWords[$j]['word'],"",$listMSG[$k]['message']).'<br><br>';
            // Hier haben wir einen Gewinner!
            $tmp_row4sql=$listMSG[$k];
            $check_user=true;
            $user_name=$database->sql_select("bot_chatuser","name", "service='".$tmp_row4sql['service']."' AND host='".$tmp_row4sql['host']."' AND user='".$tmp_row4sql['user']."'", true);
            $user_roles=$database->sql_select("bot_chatuser_roles","role", "service='".$tmp_row4sql['service']."' AND host='".$tmp_row4sql['host']."' AND user='".$tmp_row4sql['user']."'", true);
            for ($n=0;$n<count($user_roles);$n++) {
              if ($user_roles[$n]['role']!="") {
                $role_check=$database->sql_select("bot_chatroles","check_spam", "service='".$tmp_row4sql['service']."' AND host='".$tmp_row4sql['host']."' AND role='".$user_roles[$n]['role']."'", true);
                for ($m=0;$m<count($role_check);$m++) {
                  if ($role_check[$m]['check_spam']==0) {
                    $check_user=false;
                  }
                }
              }
            }
            $tmp_row4sql['message']="!report_user ".$user_name[0]['name']." : Wort aus dem Spamfilter verwendet (".$listWords[$j]['word'].")!";
            if ($user_name[0]['name']!="" && $check_user==true) {
              $tmp_row4sql['user']=-1;
              $tmp_row4sql['time']=0;
              $milliseconds = round(microtime(true) * 10000);
              $tmp_row4sql['id']=$milliseconds;
              $database->sql_insert_update("bot_chatlog", $tmp_row4sql);
            }
          }
        }
      }
    }
  }
  // Check Inaktiv?!?
  
  // Points Timeout
  $time=time();
  $minute=($time/60);
  $stunde=($minute/60);
  $tag=($stunde/24);
  $start_tag=$tag-7;
  $start_stunde=$start_tag*24;
  $start_minute=$start_stunde*60;
  $start_timestamp=$start_minute*60;
  $start_timestamp=$start_timestamp*1000; // Weil mit MS sekunden gespeichter^^ Hoffentlich XD
  $user_name=$database->sql_select("bot_chatuser","*", "verwarnung>0 AND last_seen>=verwarnung_zeit AND verwarnung_zeit<=".$start_timestamp, true);
  for ($c=0;$c<count($user_name);$c++) {
    if ($user_name[$c]['host']!="") {
      $user_name[$c]['verwarnung_zeit']=$time;
      $database->sql_insert_update("bot_chatuser", $user_name[$c]);
      
      // new message
      $tmp_host=$database->sql_select("bot_chathosts", "*", "service='".$user_name[$c]['service']."' AND host='".$user_name[$c]['host']."'", true);
      $new_msg['service']=$user_name[$c]['service'];
      $new_msg['host']=$user_name[$c]['host'];
      $new_msg['room']=$tmp_host[0]['channel_report'];
      $new_msg['message']="!unreport_user ".$user_name[$c]['name']." : Zeit Abgelaufen eine Verwarnung entfernt!";
      $new_msg['user']=-1;
      $new_msg['time']=0;
      $milliseconds = round(microtime(true) * 10000);
      $new_msg['id']=$milliseconds;
      $database->sql_insert_update("bot_chatlog", $new_msg);
      unset($new_msg);
    }
  }
*/  
  
  $tt["cooldown"]="60";
  $tt["last_used"]=time();
}
// Save Token
echo date("d.m.Y - H:i:s")." - ".$_tmp_tabellename." updated!<br>";
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);
$token[strtolower("bot_chatspam")]=$tt;
unset($tt);

?>
