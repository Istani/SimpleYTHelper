<?php

// Benötigte Daten
require_once 'inc/php_inc.php';

// TODO: Irgendwie das mit den Token regeln
$tmp_yt_tokens=$database->sql_select("authtoken LEFT JOIN channel_token ON authtoken.id=channel_token.token_id","authtoken.*, channel_token.channel_id","channel_token.channel_id='".$KANALID."' ORDER BY channel_token.last_cron LIMIT 1",true);
$_SESSION['token']=$tmp_yt_tokens[0];
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
  echo "Kanal-ID: " . $_SESSION['token']['channel_id'] . "<br>";
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
