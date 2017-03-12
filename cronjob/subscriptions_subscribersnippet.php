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


if (!isset($token[$_tmp_tabellename])) {
	$token[$_tmp_tabellename] = init_token($_tmp_tabellename);
}
$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
	
	// Youtube
	$req_count=50;
	if ($tt["token"] == "null") {
		$listResponse = $youtube->subscriptions->listSubscriptions("subscriberSnippet", array("mySubscribers" => "true", "maxResults" => $req_count, "order" => "relevance"));
	} else {
		$listResponse = $youtube->subscriptions->listSubscriptions("subscriberSnippet", array("mySubscribers" => "true", "maxResults" => $req_count, "order" => "relevance", "pageToken" => $tt["token"]));
	}
	$data4sql= $listResponse["items"];
	$tt["token"]=$listResponse["nextPageToken"];
	// SQL
	$check_table=$database->show_tables();
	if(!in_array($_tmp_tabellename, $check_table)) {
		$felder=null;
		$felder["channelid"]="VARCHAR(50)";
		$felder["token_id"]="INT(20)";
		$felder["last_seen"]="TEXT";
		$database->create_table($_tmp_tabellename, $felder, "token_id, channelid");
		unset($felder);
	}
	$new_feld["first_seen"]="TEXT";
	$new_feld["ignore"]="TEXT";
	$database->add_columns($_tmp_tabellename, $new_feld);
	unset($new_feld);
	
	for($i=0;$i<count($data4sql);$i++) {
		$row4sql= $data4sql[$i]["subscriberSnippet"];
		$json=json_encode($row4sql);
		$tmp_row4sql = json_decode($json, true);
		$tmp_row4sql["thumbnail"]= protected_settings( $row4sql["modelData"]["thumbnails"]["default"]["url"]);
		$row4sql=null;
		$row4sql=$tmp_row4sql;
		foreach ($row4sql as $key=>$value){
			$new_feld[$key]="TEXT";
			$database->add_columns($_tmp_tabellename, $new_feld);
			unset($new_feld);
			$newData[$key]=$value;
		}
		$newData["user"]=$_SESSION['user']['email'];
		$newData["last_seen"]=time();
		$database->sql_insert_update($_tmp_tabellename, $newData);
		unset($newData);
	}
	// Update
	$empty_data=$database->sql_select($_tmp_tabellename, "channelid, user","first_seen IS NULL", false);
	foreach ($empty_data as $k=>$v){
		$newData=$v;
		$newData["first_seen"]=time();
		$newData["ignore"]=0;
		$database->sql_insert_update($_tmp_tabellename, $newData);
	}
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
