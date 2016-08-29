<?php
	// Benötigte Daten
	include_once("extern/inc_extern.php");
	include_once("intern/int_settings.php");
	
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
	
		$command="lastsub";
		echo "<hr>".$command.":<br>";
	 include("scripts/". $command.".php");
	echo "<br>";
	
	
	
	} else {
		$normalCommand="scripts/".$_GET["command"].".php";
		if (file_exists($normalCommand)){
			include($normalCommand);
		} else {
			die("Unkown Command!");
		}
	 }

?>