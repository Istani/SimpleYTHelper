<?php
$cronjob_id=basename(__FILE__, '.php');
$do_job=check_settings($database, $cronjob_id);
$load_tabellename="channels_liveStreamChat";

if ($do_job==false) {
	return;
	die();
} else {
	$token[$cronjob_id]=load_cronjobtoken($database, $cronjob_id, $_SESSION['user']['email']);
	$token[$load_tabellename]=load_cronjobtoken($database, $load_tabellename, $_SESSION['user']['email']);
}
$_tmp_tabellename=strtolower($cronjob_id);


if (!isset($token[$_tmp_tabellename])) {
	$token[$_tmp_tabellename] = init_token($_tmp_tabellename);
}
$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
	
	$db_stats = $database->sql_select($load_tabellename, "*", "channel_id='".$_SESSION['user']['youtube_user']."'", true);
	
	$BroadcastId=$db_stats[0]["broadcastid"];
	$ChatId=$db_stats[0]["chatid"];
	$Last=$db_stats[0]["last_seen"];
	
	if ($Last<=$token[$load_tabellename]["last_used"]-600) {	//Wenn 10 Minuten das andere nicht ausgeführt worden ist, dann mach hier auch nichts mehr... Sonst bleibt das hier mit Fehlermeldung für immer stehen!
		$BroadcastId="null";
		$ChatId="null";
	}
	
	if ($ChatId!="null" && $ChatId!="") {
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
			
			$tt["token"]=$listResponse["nextPageToken"];
			$tt["cooldown"]=$listResponse["pollingcooldownMillis"]/1000+1;
			
			// SQL Channel Statistics
			$check_table=$database->show_tables();
			if(!in_array($_tmp_tabellename, $check_table)) {
				$felder=null;
				$felder["channel_id"]="VARCHAR(50)";
				$felder["last_seen"]="TEXT";
				$felder["id"]="VARCHAR(255)";
				$felder["ignore"]="VARCHAR(255)";
				$database->create_table($_tmp_tabellename, $felder, "id");
				unset($felder);
			}
			$database->sql_select($_tmp_tabellename, "*", "channel_id='".$_SESSION['user']['youtube_user']."' LIMIT 1", true);
			foreach ($row4sql as $key=>$value){
				$new_feld[$key]="TEXT";
				$database->add_columns($_tmp_tabellename, $new_feld);
				unset($new_feld);
				$newData[$key]=$value;
			}
			$newData["channel_id"]=$_SESSION['user']['youtube_user'];
			$newData["last_seen"]=time();
			$database->sql_insert_update($_tmp_tabellename, $newData);
			unset($newData);
			
			if ($db_stats[0]["last_ad"]<=time()-1800) {
				$add_post['id']=time();
				$add_post['time']=time();
				$add_post['user']='-1';
				$add_post['message']="!ad";
				$add_post['process']=0;
				
				$add_post['service']='YouTube';
				$add_post['host']=$_SESSION['user']['youtube_user'];
				$add_post['room']=$ChatId;
				$database->sql_insert_update("bot_chatlog", $add_post);
				/*
				$discord_server=$database->sql_select("bot_chathosts", "*", "owner='".$_SESSION['user']['discord_user']."'",true);
				$add_post['service']='Discord';
				$add_post['host']=$discord_server[0]['host'];
				$add_post['room']=$discord_server[0]['channel_video'];
				$database->sql_insert_update("bot_chatlog", $add_post);
				*/
				unset($add_post);
				
				$db_stats[0]["last_ad"]=time();
				$database->sql_insert_update($load_tabellename, $db_stats[0]);
			}
		}
	} else {
		$tt["token"]="null"; // Vielleicht muss der Token irgendwann irgendwie auch wieder zur+ck gesetzt werden?
	}
	// Save Token
	echo date("d.m.Y - H:i:s")." - ".$tmp_token['channel_id'].': '.$_tmp_tabellename." updated!<br>";
	$tt["last_used"]=time();
	$tt["user"]=$_SESSION['user']['email'];
	if($tt["token"]==""){$tt["token"]="null";}
	$database->sql_insert_update("bot_token",$tt);
	unset($tt);
}

?>
