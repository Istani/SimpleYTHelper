<?php
$cronjob_id=strtolower(basename(__FILE__, '.php'));
$do_job=check_settings($database, $cronjob_id);

if ($do_job==false) {
	return;
	die();
} else {
	$token[$cronjob_id]=load_cronjobtoken($database, $cronjob_id, $_SESSION['user']['email']);
	$token[$load_tabellename]=load_cronjobtoken($database, $load_tabellename, $_SESSION['user']['email']);
}

if (!isset($token[$cronjob_id])) {
	$token[$cronjob_id] = init_token($cronjob_id);
}
$tt=$token[$cronjob_id];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
	// Check Table exists
	$check_table=$database->show_tables();
	if(!in_array($cronjob_id, $check_table)) {
		$felder=null;
		$felder["game_id"]="VARCHAR(50)";
		$felder["game_state"]="INT DEFAULT 0";
		$database->create_table($cronjob_id, $felder, "game_id");
		unset($felder);
	}
	
	// Additional Later Added Cols
	$new_feld["calculate_avg"]="INT DEFAULT 1";
	$new_feld["factor"]="INT DEFAULT 100";
	$database->add_columns($cronjob_id, $new_feld);
	unset($new_feld);
	
	// Do Magic!
	$game_data=$database->sql_select($cronjob_id, "*", "game_id='".md5($_SESSION['user']['email'])."'", false);
	if (isset($game_data[0])) {
		$this_game=$game_data[0];
		// YEAH
		$change_me=true;
		switch ($this_game['game_state']) {
			case 0:
			$this_game['game_state']=1;
			// Calculate Values for this RPG
			$temp_avg=0;
			$temp_count=0;
			$game_data=$database->sql_select("bot_chatuser INNER JOIN bot_chathosts ON bot_chatuser.service=bot_chathosts.service AND bot_chatuser.host=bot_chathosts.host", "bot_chatuser.*", "bot_chathosts.owner='".$_SESSION['user']['youtube_user']."' or bot_chathosts.owner='".$_SESSION['user']['discord_user']."' ORDER BY msg_avg DESC LIMIT 5,5", false);
			for ($count_game_data=0;$count_game_data<count($game_data);$count_game_data++) {
				$this_user=$game_data[$count_game_data];
				if ($this_user['msg_avg']>0) {
					$temp_avg=$temp_avg+$this_user['msg_avg'];
					$temp_count++;
				}
			}
			$this_game['calculate_avg']=$temp_avg;
			
			break;
			default:
			$change_me=false;
		}
		if ($change_me) {
			$database->sql_insert_update($cronjob_id,$this_game);
		}
		
		
	}
	
	//die("RPG CHECK");
	// Save Token
	echo date("d.m.Y - H:i:s")." - ".$_SESSION['user']['email'].': '.$cronjob_id." updated!<br>";
	$tt["last_used"]=time();
	$tt["user"]=$_SESSION['user']['email'];
	if($tt["token"]==""){$tt["token"]="null";}
	$database->sql_insert_update("bot_token",$tt);
	unset($tt);
}

?>
