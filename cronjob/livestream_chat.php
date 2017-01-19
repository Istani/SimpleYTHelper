<?php
// Cronjob Channel Statistics
$_tmp_tabellename=strtolower("livestream_chat");
if (!isset($token[$_tmp_tabellename])) {
	$token[$_tmp_tabellename] = init_token($_tmp_tabellename);
}
$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
	$load_tabellename="channels_liveStreamChat";
	$db_stats = $database->sql_select($load_tabellename, "*", "channel_id='".$_SESSION['token']['channel_id']."'", true);
	
	$BroadcastId=$db_stats[0]["broadcastid"];
	$ChatId=$db_stats[0]["chatid"];
	
	if ($BroadcastId!="null" && $BroadcastId!="") {
		
		if ($tt["token"] == "null") {
			$listResponse = $youtube->liveChatMessages->listLiveChatMessages($ChatId,'snippet, authorDetails' , array("maxResults"=>2000));
		} else{
			$listResponse = $youtube->liveChatMessages->listLiveChatMessages($ChatId,'snippet, authorDetails' , array("maxResults"=>2000, "pageToken" => $tt["token"]));
		}
		$data4sql= $listResponse["items"];
		for($i=0;$i<count($data4sql);$i++) {
			//$row4sql=$data4sql[$i];
			
			foreach ($data4sql[$i]["snippet"] as $key=>$value){
				$row4sql[$key]=protected_settings($value);
			}
			
			foreach ($data4sql[$i]["authorDetails"] as $key=>$value){
				$row4sql[$key]=protected_settings($value);
			}
			
			$row4sql['id']=protected_settings($data4sql[$i]['id']);
			debug_log($row4sql);
			
			$tt["token"]=$listResponse["nextPageToken"];
			$tt["cooldown"]=$listResponse["pollingcooldownMillis"]/1000+1;
			
			// SQL Channel Statistics
			$check_table=$database->show_tables();
			if(!in_array($_tmp_tabellename, $check_table)) {
				$felder=null;
				$felder["channel_id"]="VARCHAR(50)";
				$felder["last_seen"]="TEXT";
				$felder["id"]="VARCHAR(255)";
				$database->create_table($_tmp_tabellename, $felder, "id");
				unset($felder);
			}
			$database->sql_select($_tmp_tabellename, "*", "channel_id='".$_SESSION['token']['channel_id']."' LIMIT 1", true);
			foreach ($row4sql as $key=>$value){
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
		die();
		echo $_tmp_tabellename." updated!<br>";
		$tt["last_used"]=time();
		$tt["yt_token"]=$_SESSION['token']['id'];
	}
	// Save Token
	if($tt["token"]==""){$tt["token"]="null";}
	$database->sql_insert_update("bot_token",$tt);
}

?>
