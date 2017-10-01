<?php

$mysqli_host = $mysql['host'];
$mysqli_user = $mysql['user'];
$mysqli_pass = $mysql['pass'];
$mysqli_base = $mysql['base'];

$link_db = mysqli_connect($mysqli_host,$mysqli_user,$mysqli_pass, $mysqli_base);

$result = mysqli_query($link_db, "select * from Umfragen");

while($line = mysqli_fetch_assoc($result))
{
	echo $line["Umfragetext"]."<br>";
	$result_2 = mysqli_query($link_db, "select * from Ergebnisse where Umfrage_ID = ".$line["Vote_ID"]);
	
	while($line_2 = mysqli_fetch_assoc($result_2))
	{
		echo $line_2["Auswahl_ID"].":".$line_2["Text"]."<br>";	
	}

$vote_array = explode(" ",$this_msg['message']);
// input string zerlegen
if(isset($vote_array[1]))
{
$write = mysqli_query($link_db, "update Ergebnisse set Anzahl_Votes = Anzahl_Votes +1 where Umfrage_ID = ".$line["Vote_ID"]." and Auswahl_ID = ".$vote_array[1]);		
}
// der jeweiligen Auswahl_ID einen Punkt gutschreiben
}
?>