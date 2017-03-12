<?php
$cronjob_id=basename(__FILE__, '.php');
$do_job=check_settings($database, $cronjob_id);

if ($do_job==false) {
	return;
	die();
} else {
	$token[$cronjob_id]=load_cronjobtoken($database, $cronjob_id, $_SESSION['user']['email']);
}
$_tmp_tabellename=strtolower($cronjob_id);


$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
	
	// Youtube Channel Statistics
	if ($tt["token"] == "null") {
		$listResponse = $youtube->channels->listChannels('statistics', array('id' => $_SESSION['user']['youtube_user']));
	} else {
		$listResponse = $youtube->channels->listChannels('statistics', array('id' => $_SESSION['user']['youtube_user'], "pageToken" => $tt["token"] ));
	}
	$data4sql= $listResponse[0]["modelData"]["statistics"];
	$tt["token"]=$listResponse["nextPageToken"];
	
	// SQL Channel Statistics
	$check_table=$database->show_tables();
	if(!in_array($_tmp_tabellename, $check_table)) {
		$felder=null;
		$felder["channel_id"]="VARCHAR(50)";
		$felder["last_seen"]="TEXT";
		$database->create_table($_tmp_tabellename, $felder, "channel_id");
		unset($felder);
	}
	$database->sql_select($_tmp_tabellename, "*", "channel_id='".$_SESSION['user']['youtube_user']."' LIMIT 1", true);
	foreach ($data4sql as $key=>$value){
		$new_feld[$key]="TEXT";
		$database->add_columns($_tmp_tabellename, $new_feld);
		unset($new_feld);
		$newData[$key]=$value;
	}
	$newData["channel_id"]=$_SESSION['user']['youtube_user'];
	$newData["last_seen"]=time();
	$database->sql_insert_update($_tmp_tabellename, $newData);
	unset($newData);
	$tt["cooldown"]=300;
}
// Save Token
echo date("d.m.Y - H:i:s")." - ".$tmp_token['channel_id'].': '.$_tmp_tabellename." updated!<br>";
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);
unset($tt);

?>
