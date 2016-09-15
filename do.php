<?php

// Benötigte Daten
require_once 'inc/php_inc.php';
include("functions/func_command.php");

if (!isset($_GET["command"]) OR $_GET["command"] == "" OR $_GET["command"] == "null") {
    echo "No Command given!
    ";
    $_GET["command"] = "commands";
}

if ($_GET["command"] == "debug") {
    echo "<h1>Defender Tests</h1><br>";
    //echo "DEV-Key: ". $settings["google"]["devkey"]."<br>";
    echo "Kanal-ID: " . $KANALID . "<br>";
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
