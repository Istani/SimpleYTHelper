<?php
// Cronjob Channel Statistics
$_tmp_tabellename=strtolower("channels_contentdetails");
if (!isset($token[$_tmp_tabellename])) {
	$token[$_tmp_tabellename] = init_token($_tmp_tabellename);
}
$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
	
	// Youtube Channel Statistics
	if ($tt["token"] == "null") {
		$listResponse = $youtube->channels->listChannels('contentDetails', array('id' => $_SESSION['token']['channel_id']));
	} else {
		$listResponse = $youtube->channels->listChannels('contentDetails', array('id' => $_SESSION['token']['channel_id'], "pageToken" => $tt["token"] ));
	}
	
	$data4sql= $listResponse[0]["modelData"]["contentDetails"]["relatedPlaylists"];
	$tt["token"]=$listResponse["nextPageToken"];
	
	// SQL Channel Statistics
	$check_table=$database->show_tables();
	if(!in_array($_tmp_tabellename, $check_table)) {
		$felder=null;
		$felder["channel_id"]="VARCHAR(50)";
		$felder["last_seen"]="INT(20)";
		$database->create_table($_tmp_tabellename, $felder, "channel_id");
		unset($felder);
	}
	$database->sql_select($_tmp_tabellename, "*", "channel_id='".$_SESSION['token']['channel_id']."' LIMIT 1", true);
	foreach ($data4sql as $key=>$value){
		$new_feld[$key]="TEXT";
		$database->add_columns($_tmp_tabellename, $new_feld);
		unset($new_feld);
		$newData[$key]=$value;
	}
	$newData["channel_id"]=$_SESSION['token']['channel_id'];
	$newData["last_seen"]=time();
	$database->sql_insert_update($_tmp_tabellename, $newData);
	unset($newData);
	
}
$tt["cooldown"]=86400;
// Save Token
echo date("d.m.Y - H:i:s")." - ".$tmp_token['channel_id'].': '.$_tmp_tabellename." updated!<br>";
$tt["last_used"]=time();
$tt["yt_token"]=$_SESSION['token']['id'];
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);
unset($tt);
?>
