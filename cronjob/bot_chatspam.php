<?php
$_tmp_tabellename=strtolower("bot_chatspam");
if (!isset($token[$_tmp_tabellename])) {
  $token[$_tmp_tabellename] = init_token($_tmp_tabellename);
}
$tt=$token[strtolower("bot_chatspam")];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  if (isset($data4sql)) {
    unset($data4sql);
  }
  // Mehr als 3 Nachrichten in der Minute
  $listRequests = $database->sql_select("bot_chatlog","service, host, room, user, count(message) as Anzahl", "`time` >=".($tt["last_used"]-$tt["cooldown"])." GROUP BY service, host, room, user", true);
  $data4sql= $listRequests; // Hier unnötig, aber dann ist es so wie überall anders!
  for($i=0;$i<count($data4sql);$i++) {
    
    $tmp_row4sql=$data4sql[$i];
    if (isset($tmp_row4sql['Anzahl'])) {
      if ($tmp_row4sql['Anzahl']>=3) {
        // Hier haben wir einen Gewinner!
        unset($tmp_row4sql['Anzahl']);
        $user_name=$database->sql_select("bot_chatuser","name", "service='".$tmp_row4sql['service']."' AND host='".$tmp_row4sql['host']."' AND user='".$tmp_row4sql['user']."'", true);
        $tmp_row4sql['message']="!report_user ".$user_name[0]['name']." : Zuviele Nachrichten in kurzer Zeit!";
        if ($user_name[0]['name']!="") {
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
  $welche_server_checken=$database->sql_select("bot_chatlog","service, host, room", "`time` >=".($tt["last_used"]-$tt["cooldown"])."  GROUP BY service, host, room", false);
  for($i=0;$i<count($welche_server_checken);$i++) {
    $listWords = $database->sql_select("bot_chatbadword","service, host, word", "service='".$welche_server_checken[$i]['service']."' AND host='".$welche_server_checken[$i]['host']."'", false);
    $listMSG = $database->sql_select("bot_chatlog","service, host, room, user, message", "service='".$welche_server_checken[$i]['service']."' AND host='".$welche_server_checken[$i]['host']."' AND `time`>='".($tt["last_used"]-$tt["cooldown"])."'", false);
    for($j=0;$j<count($listWords);$j++) {
      for($k=0;$k<count($listMSG);$k++) {
        if ($listWords[$j]['word']!="") {
          if ($listMSG[$k]['message']!=str_replace($listWords[$j]['word'],"",$listMSG[$k]['message'])) {
            echo $listMSG[$k]['message']. ' - '.$listWords[$j]['word']." - ".str_replace($listWords[$j]['word'],"",$listMSG[$k]['message']).'<br><br>';
            // Hier haben wir einen Gewinner!
            $tmp_row4sql=$listMSG[$k];
            $user_name=$database->sql_select("bot_chatuser","name", "service='".$tmp_row4sql['service']."' AND host='".$tmp_row4sql['host']."' AND user='".$tmp_row4sql['user']."'", true);
            $tmp_row4sql['message']="!report_user ".$user_name[0]['name']." : Bad Word used!";
            if ($user_name[0]['name']!="") {
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
  
  $tt["cooldown"]="60";
  $tt["last_used"]=time();
}
// Save Token
echo date("d.m.Y - H:i:s")." - ".$_tmp_tabellename." updated!<br>";

$tt["yt_token"]=0;
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);
$token[strtolower("bot_chatspam")]=$tt;
unset($tt);

?>
