<?php

// Cronjob Channel Statistics
$_tmp_tabellename="channels_statistics";
if (!isset($token[$_tmp_tabellename])) {
	$token[$_tmp_tabellename] = init_token($_tmp_tabellename);
}
$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["interval"]<time()) {
	
// Youtube Channel Statistics
if ($tt["token"] == "null") { 
$listResponse = $youtube->channels->listChannels('statistics', array('id' => $KANALID));
} else {
	 $listResponse = $youtube->channels->listChannels('statistics', array('id' => $KANALID, "pageToken" => $tt["token"] ));
}
$data4sql= $listResponse[0]["modelData"]["statistics"];
$tt["token"]=$listResponse["nextPageToken"];

// SQL Channel Statistics
$check_table=$database->show_tables();
if(!in_array($_tmp_tabellename, $check_table)) {
	$felder=null;
	$felder["id"]="TEXT";
	$felder["last_seen"]="TEXT";
	$database->create_table($_tmp_tabellename, $felder, "id");
	unset($felder);
}
$database->sql_select($_tmp_tabellename, "*", "id='".$KANALID."' LIMIT 1", true);
foreach ($data4sql as $key=>$value){
	$new_feld[$key]="TEXT";
	$database->add_columns($_tmp_tabellename, $new_feld);
	unset($new_feld);
	$newData[$key]=$value;
}
$newData["id"]=$KANALID;
$newData["last_seen"]=time();
$database->sql_insert_update($_tmp_tabellename, $newData);
unset($newData);
echo $_tmp_tabellename." updated!<br>";
$tt["last_used"]=time();
}
// Save Token
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);

?>