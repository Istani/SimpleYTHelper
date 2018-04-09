<?php

function check_settings($database, $cronjob_id) {
  $return_value=true;
  if (isset($_SESSION['cronjob'])) {
    if ($_SESSION['cronjob']=="setup") {
      // Get service
      if ($cronjob_id!=str_replace("bot_","",$cronjob_id)) {
        $serivce="Bot";
        $user_where="status=1";
      }
      if ($cronjob_id!=str_replace("simpleyth_","",$cronjob_id)) {
        $serivce="SimpleYTH";
        $user_where="true";
      }
      if ($cronjob_id!=str_replace("youtube_","",$cronjob_id)) {
        $serivce="YouTube";
        $user_where="youtube_user is not null AND youtube_user not like ''";
      }
      if ($cronjob_id!=str_replace("twitch_","",$cronjob_id)) {
        $serivce="Twitch";
        $user_where="twitch_user is not null AND twitch_user not like ''";
      }
      // Get Users
      $users=$database->sql_select("user", "*", $user_where, true);
      if (isset($newData)) {
        unset($newData);
      }
      for ($i=0;$i<count($users);$i++) {
        if ($users[$i]['email']!="") {
          $newData['service']=$serivce;
          $newData['user']=$users[$i]['email'];
          $newData['id']=$cronjob_id;
          $database->sql_insert_update("bot_token", $newData);
          unset($newData);
        }
      }
      $return_value=false;
    }
  }
  return $return_value;
}

function load_cronjobtoken($database, $cronjob_id, $user) {
  $return_value=init_token($cronjob_id);
  $tmp_token=$database->sql_select("bot_token", "*","id='".$cronjob_id."' and user='".$user."'", true);
  if ($tmp_token[0]['id']==$cronjob_id) {
    $return_value=$tmp_token[0];
  }
  if (isset($_GET['job_type'])) {
    if ($_GET['job_type']==$cronjob_id) {
      $return_value["cooldown"]=0;
    }
  }
  return $return_value;
}

function execute_command($command) {
  $result = "";
  ob_start();
  $filepath = "commands/" . $command . ".php";
  if (file_exists($filepath)) {
    include($filepath);
  } else {
    echo "No Command: <b>" . $command . "</b>! " . execute_command("commands");
  }
  $result = ob_get_contents();
  ob_end_clean();
  $result = replace_html2markdown($result);
  return $result;
}

function return_commands_array() {
  $temps = scandir("commands/");
  foreach ($temps as $filename) {
    if ($filename != str_replace(".php", "", $filename)) {
      $return[] = str_replace(".php", "", $filename);
    }
  }
  return $return;
}

function replace_html2markdown($string) {
  
  $string = str_replace("<b>", "**", $string);
  $string = str_replace("</b>", "**", $string);
  
  $string = str_replace("<br>", "\r\n", $string);
  
  return $string;
}

function debug_log($var) {
  echo "<pre>";
  echo var_dump($var);
  echo "</pre>";
}

function protected_settings($thing){
  ob_start();
  echo $thing;
  $result = ob_get_contents();
  ob_end_clean();
  return $result;
}

?>
