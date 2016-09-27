<?php

// Cronjob Subscriptions subscriberSnippet
$_tmp_tabellename="subscriptions_subscriberSnippet";
if (!isset($token[$_tmp_tabellename])) {
	$token[$_tmp_tabellename] = init_token($_tmp_tabellename);
}
$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["interval"]<time()) {
	
// Youtube
$req_count=50;
if ($tt["token"] == "null") { 
$listResponse = $youtube->subscriptions->listSubscriptions("subscriberSnippet", array(/* 'channelId' => $KANALID, */"mySubscribers" => "true", "maxResults" => $req_count, "order" => "relevance"));
} else {
	 $listResponse = $youtube->subscriptions->listSubscriptions("subscriberSnippet", array(/* 'channelId' => $KANALID, */"mySubscribers" => "true", "maxResults" => $req_count, "order" => "relevance", "pageToken" => $tt["token"]));
	 }
$data4sql= $listResponse["items"];
$tt["token"]=$listResponse["nextPageToken"];

// SQL
$check_table=$database->show_tables();
if(!in_array($_tmp_tabellename, $check_table)) {
	$felder=null;
	$felder["channelId"]="TEXT";
	$felder["last_seen"]="TEXT";
	$database->create_table($_tmp_tabellename, $felder, "channelId");
	unset($felder);
}
$new_feld["first_seen"]="TEXT";
$new_feld["ignore"]="TEXT";
$database->add_columns($_tmp_tabellename, $new_feld);
unset($new_feld);
$database->sql_select($_tmp_tabellename, "*", "channelId='".$KANALID."' LIMIT 1", true);
for($i=0;$i<count($data4sql);$i++) {
foreach ($data4sql[$i]["subscriberSnippet"] as $key=>$value){
	$new_feld[$key]="TEXT";
	$database->add_columns($_tmp_tabellename, $new_feld);
	unset($new_feld);
	$newData[$key]=$value;
}
$newData["last_seen"]=time();
$database->sql_insert_update($_tmp_tabellename, $newData);
unset($newData);
}
// Update
$empty_data=$database->sql_select($_tmp_tabellename, "channelId","first_seen IS NULL", false);
foreach ($empty_data as $k=>$v){
	$newData=$v;
	$newData["first_seen"]=time();
	$newData["ignore"]=0;
	$database->sql_insert_update($_tmp_tabellename, $newData);
}
unset($newData);


echo $_tmp_tabellename." updated!<br>";
$tt["last_used"]=time();
}
// Save Token
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);

?>