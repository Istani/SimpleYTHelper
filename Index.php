<?php
	// Benötigte Daten
	include("extern/inc_extern.php");
	include("intern/int_settings.php");
	include("intern/func_command.php");
	
	if (!isset($_GET["command"]) OR $_GET["command"]=="") {
		echo "No Command given!";
		echo "<br>";
		echo "Display DEBUG Information!<br>";
		$_GET["command"]="debug";
		echo "index.php?command=debug";
		echo "<br><br>";
	}
	
	if ($_GET["command"]=="debug") {
		echo "<h1>Defender Tests</h1><br>";
		echo "DEV-Key: ". $settings["google"]["devkey"]."<br>";
		echo "Kanal-ID: ". $settings["youtube"]["channleid"]."<br>" ;
		echo "<br>";
	}
	// AREA: Includes zum Test
	
	if ($_GET["command"]=="debug"){
		$commands = return_commands_array();
		
		foreach ($commands as $command) {
			echo "<hr> Command: ";
			echo "<b>".$command."</b><br>";
			execute_command($command);
			echo "<br>";
		}
	} else {
		execute_command($_GET["command"]);
	 }

?>