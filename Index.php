<?php
	// Benötigte Daten
	include("extern/inc_extern.php");
	include("intern/int_settings.php");
	include("intern/func_command.php");
	
	if (!isset($_GET["command"])) {
		die("No Command given!");
	}
	
	if ($_GET["command"]=="debug") {
		echo "<h1>Defender Tests</h1><br>";
		echo "DEV-Key: ". $settings["google"]["devkey"]."<br>";
		echo "Kanal-ID: ". $settings["youtube"]["channleid"]."<br>" ;
		echo "<br>";
	}
	// AREA: Includes zum Test
	
	if ($_GET["command"]=="debug"){
		$commands = array("noob", "lastsub");
		foreach ($commands as $command) {
			echo "<hr>";
			echo $command.":<br>";
			execute_command($command);
			echo "<br>";
		}
	} else {
		execute_command($_GET["command"]);
	 }

?>