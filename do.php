<?php

// Benötigte Daten
require_once 'inc/php_inc.php';

if (isset($_GET['host'])) {
  $user=$database->sql_select("user","*","email=admin", true); // TODO: Was besseres ausdenken für StandartUser;
  $host=$database->sql_select("bot_chathosts","*","host='".$_GET['host']."'", true);
  if ($host[0]['owner']==$_GET['user'] || $host[0]['community_type']==0 || $_GET['user']=="-1") {
    $user=$database->sql_select("user","*","youtube_user='".$host[0]['owner']."' OR discord_user='".$host[0]['owner']."'", true);
  } else {
    if ($host[0]['community_type']==1) {
      // Joa darfst du vielleicht Videos Posten?
      $user_permission=false;
      $user_roles=$database->sql_select("bot_chatuser_roles","*","host='".$_GET['host']."' AND user='".$_GET['user']."'",true);
      for ($i=0;count($user_roles);$i++) {
        $role=$database->sql_select("bot_chatroles","*","host='".$_GET['host']."' AND role='".$user_roles[$i]['role']."'",true);
        if ($role[0]['recht_own_videos']>0) {
          $user_permission=true;
        }
      }
      if ($user_permission==false) {
        $user=$database->sql_select("user","*","youtube_user='".$host[0]['owner']."' OR discord_user='".$host[0]['owner']."'", true);
      } else {
        $user=$database->sql_select("user","*","youtube_user='".$_GET['user']."' OR discord_user='".$_GET['user']."'", true);
      }
    } else {
      $user=$database->sql_select("user","*","youtube_user='".$host[0]['owner']."' OR discord_user='".$host[0]['owner']."'", true);
    }
  }
  $_SESSION['user']=$user;
}

if (!isset($_GET["command"]) OR $_GET["command"] == "" OR $_GET["command"] == "null") {
  echo "No Command given!
  ";
  $_GET["command"] = "commands";
}

if (!isset($_GET["param"])) {
  $_GET["param"]="";
}

if ($_GET["command"] == "debug") {
  echo "<h1>Defender Tests</h1><br>";
  //echo "DEV-Key: ". $settings["google"]["devkey"]."<br>";
  echo "Kanal-ID: " . $_SESSION['user']['youtube_user'] . "<br>";
  echo "<br>";
}
// AREA: Includes zum Test

if ($_GET["command"] == "debug") {
  $commands = return_commands_array();
  
  foreach ($commands as $command) {
    echo "<hr> Command: ";
    echo "<b>" . $command . "</b><br>";
    echo execute_command($command);
    echo "<br>";
  }
} else {
  echo execute_command($_GET["command"]);
}
?>
