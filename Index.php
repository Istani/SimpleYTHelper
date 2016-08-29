<?php
	// Benötigte Daten
	include_once("extern/inc_extern.php");
	include_once("intern/int_settings.php");
	
	echo "<h1>Defender Tests</h1><br>";
	echo "DEV-Key: ". $settings["google"]["devkey"]."<br>";
	echo "Kanal-ID: ". $settings["youtube"]["channleid"]."<br>" ;
	echo "<br>";
	
	// AREA: Includes zum Test
	
	echo "<hr>LastSub:<br>";
	include("scripts/lastsub.php");
	echo "<br>";
	
	 echo "<hr>LastSub:<br>";
	include("scripts/lastsub.php");
	echo "<br>";
	

?>