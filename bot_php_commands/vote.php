<?php
/*
//fake input
$this_msg['service'] = "Discord";
$this_msg['host'] = "1234";
$this_msg['channel'] = "5678";
$this_msg['id'] = "875";
$this_msg['time'] = time();
$this_msg['user'] = "Defender833";
$this_msg['message'] = "!vote 2";

//$this_user

$mysql['host'] = "127.0.0.1";
$mysql['user'] = "root";
$mysql['pass'] = "";
$mysql['base']	= "simpleyth";
*/

$link_db = mysqli_connect($mysql['host'],$mysql['user'],$mysql['pass'], $mysql['base']);

$result = mysqli_query($link_db, "select * from Umfragen where aktiv = 1 limit 1");
$vote_array = explode(" ",$this_msg['message']);
// input string zerlegen

if(mysqli_num_rows($result)== 0){
	echo "Zur Zeit gibt es keine Umfragen!";
}

// Voting "Gewicht"
$vote_gewicht=1;
for ($tmp_count=0;$tmp_count<count($this_user['roles'])) {
	$this_role=$this_user['roles'][$tmp_count];
	if ($this_role['vote_factor']>$vote_gewicht) {
		$vote_gewicht=$this_role['vote_factor'];
	}
}

while($line = mysqli_fetch_assoc($result))
{
	if(!isset($vote_array[1]))
	{
		echo '<b>Umfrage:</b><br>';
		echo $line["Umfragetext"]."<br>";
		$result_2 = mysqli_query($link_db, "select * from Ergebnisse where Umfrage_ID = ".$line["Vote_ID"]);
		
		while($line_2 = mysqli_fetch_assoc($result_2))
		{
			echo $line_2["Auswahl_ID"].":".$line_2["Text"]."<br>";
		}
	}
	else
	{
		$voted = mysqli_query($link_db, "select * from user_voted where Umfrage_ID = ".$line["Vote_ID"]." and User_ID ='".$this_msg['user']."'");
		
		if(mysqli_num_rows($voted)== 0)
		{
			echo "Du hast gevoted!";
			mysqli_query($link_db, "update Ergebnisse set Anzahl_Votes=Anzahl_Votes+".$vote_gewicht." where Umfrage_ID = ".$line["Vote_ID"]." and Auswahl_ID = ".$vote_array[1]);
			// der jeweiligen Auswahl_ID einen Punkt gutschreiben
			mysqli_query($link_db, "insert into user_voted set Umfrage_ID = ".$line["Vote_ID"]." , User_ID ='".$this_msg['user']."'");
			// setze user in base auf die wählerliste
		}
		elseif($vote_array[1] != "ende"){echo "Du hast schon gevoted!";}
		
		
		if(($vote_array[1] == "ende") && ($this_msg['user'] == "UC5DOhI70dI3PnLPMkUsosgw"))
		{
			$result_2 = mysqli_query($link_db, "select * from Ergebnisse where Umfrage_ID = ".$line["Vote_ID"]." order by Anzahl_Votes desc");
			mysqli_query($link_db, "update Umfragen set aktiv = 0 where Vote_ID = ".$line["Vote_ID"]);
			// setzt die umfrage auf inaktiv
			while($line_2 = mysqli_fetch_assoc($result_2))
			{
				echo $line_2["Auswahl_ID"].":".$line_2["Text"]." ".$line_2["Anzahl_Votes"]."<br>";
			}
			
		}
	}
	
}
echo debug_log($this_user);
?>
