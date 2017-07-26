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
	$tt["token"]="null";
	$tt["cooldown"]=1;
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
	$new_feld["monster_id"]="INT DEFAULT 1";
	$new_feld["monster_factor"]="INT DEFAULT 100";
	$new_feld["calculate_avg"]="INT DEFAULT 1";
	$new_feld["player_count"]="INT DEFAULT 1";
	$new_feld["monster_hp_max"]="INT DEFAULT 1";
	$new_feld["monster_hp_current"]="INT DEFAULT 1";
	$new_feld["rounds_max"]="INT DEFAULT 1";
	$new_feld["rounds_current"]="INT DEFAULT 0";
	$database->add_columns($cronjob_id, $new_feld);
	unset($new_feld);
	
	// Player Table:
	if(!in_array("rpg_player", $check_table)) {
		$felder=null;
		$felder["game_id"]="VARCHAR(50)";
		$felder["user_id"]="VARCHAR(50)";
		$felder["calculate_avg"]="INT DEFAULT 5";
		$felder["sum_dmg"]="INT DEFAULT 5";
		$database->create_table("rpg_player", $felder, "game_id, user_id");
		unset($felder);
	}
	
	// Monster Table:
	if(!in_array("rpg_monster", $check_table)) {
		$felder=null;
		$felder["monster_id"]="VARCHAR(50)";
		$felder["factor"]="INT DEFAULT 100";
		$database->create_table("rpg_monster", $felder, "monster_id");
		unset($felder);
	}
	
	// Player Attack Table:
	if(!in_array("rpg_player_attack", $check_table)) {
		$felder=null;
		$felder["game_id"]="VARCHAR(50)";
		$felder["user_id"]="VARCHAR(50)";
		$database->create_table("rpg_player_attack", $felder, "game_id, user_id");
		unset($felder);
	}
	
	// Do Magic!
	$game_data=$database->sql_select($cronjob_id, "*", "game_id='".md5($_SESSION['user']['email'])."'", false);
	
	$yt_livestream_data = $database->sql_select("channels_liveStreamChat", "*", "channel_id='".$_SESSION['user']['youtube_user']."'", true);
	$LiveStream_Room=$yt_livestream_data[0]["chatid"];
	
	// NOTE: Testweise noch nicht auf YT
	$LiveStream_Room="";
	
	$add_post['id']=time();
	$add_post['time']=time();
	$add_post['user']='-1';
	$add_post['process']=0;
	
	if (isset($game_data[0])) {
		$this_game=$game_data[0];
		// YEAH
		$change_me=true;
		switch ($this_game['game_state']) {
			case 0:
			$this_game['game_state']++;
			// Drop old Data
			$database->sql_delete("rpg_player", "`game_id`=".$this_game['game_id']."");
			$database->sql_delete("rpg_player_attack", "`game_id`=".$this_game['game_id']."");
			
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
			// case 1: Wait for Spawn
			case 2:
			$tt["cooldown"]=120;
			$this_game['game_state']++;
			
			$add_post['message']="!rpg anmeldung";
			$database->sql_insert_update($load_tabellename, $db_stats[0]);
			$game_data=$database->sql_select("bot_chathosts", "*", "owner='".$_SESSION['user']['youtube_user']."' or owner='".$_SESSION['user']['discord_user']."'", false);
			for ($count_game_data=0;$count_game_data<count($game_data);$count_game_data++) {
				$this_channel=$game_data[$count_game_data];
				$add_post['service']=$this_channel['service'];
				$add_post['host']=$this_channel['host'];
				if ($this_channel['service']=="Youtube") {
					$add_post['room']=$LiveStream_Room;
				}
				if ($this_channel['service']=="Discord") {
					$add_post['room']=$this_channel['channel_rpgmain'];
				}
				if ($add_post['room']!="") {
					$database->sql_insert_update("bot_chatlog", $add_post);
				}
			}
			break;
			case 3:	// Anmeldung Vorbei! - Generate Monster & Player!
			$tt["cooldown"]=1;
			$this_game['game_state']++;
			// Generate Player Stats
			$game_data=$database->sql_select("rpg_player", "*", "`game_id`=".$this_game['game_id']."", false);
			$this_game['player_count']=count($game_data);
			if ($this_game['player_count']==0) {
				$this_game['player_count']=1;
				$this_game['rounds_current']=$this_game['rounds_max'];
			}
			
			// Generate Monster Stats
			$this_monster['factor']=0;
			while ($this_monster['factor']==0) {
				$game_data=$database->sql_select("rpg_monster", "*", "true ODER BY RAND() LIMIT 1", false);
				if (count($game_data)==1) {
					$this_monster=$game_data[0];
				} else {
					// NOTE: Create Monster, because none exists on first run!
					$addMon['monster_id']="Alpha_Monster";
					$addMon['factor']=100;
					$database->sql_insert_update("rpg_monster", $addMon);
				}
			}
			$this_game['monster_id']=$this_monster['monster_id'];
			$this_game['monster_factor']=$this_monster['factor'];
			// Calculate HP
			$this_game["monster_hp_max"]=($this_game['monster_factor']/100)*($this_game['player_count']*$this_game['calculate_avg']*$this_game['rounds_max']);
			$this_game["monster_hp_current"]=$this_game["monster_hp_max"];
			
			// Message to Start!
			$add_post['message']="!rpg howto";
			$database->sql_insert_update($load_tabellename, $db_stats[0]);
			$game_data=$database->sql_select("bot_chathosts", "*", "owner='".$_SESSION['user']['youtube_user']."' or owner='".$_SESSION['user']['discord_user']."'", false);
			for ($count_game_data=0;$count_game_data<count($game_data);$count_game_data++) {
				$this_channel=$game_data[$count_game_data];
				$add_post['service']=$this_channel['service'];
				$add_post['host']=$this_channel['host'];
				if ($this_channel['service']=="Youtube") {
					$add_post['room']=$LiveStream_Room;
				}
				if ($this_channel['service']=="Discord") {
					$add_post['room']=$this_channel['channel_rpgmain'];
				}
				if ($add_post['room']!="") {
					$database->sql_insert_update("bot_chatlog", $add_post);
				}
			}
			break;
			case 4:  // Kampf Start!
			$tt["cooldown"]=60;
			// Calculate DMG and so...
			
			
			if ($this_game['monster_hp_current']<=0) {
				$this_game['rounds_current']=$this_game['rounds_max'];
			}
			$database->sql_delete("rpg_player_attack", "`game_id`=".$this_game['game_id']."");
			// Checking Round Counter!
			$this_game['rounds_current']++;
			if ($this_game['rounds_current']>$this_game['rounds_max']) {
				$this_game['game_state']++;
			} else {
				$add_post['message']="!rpg round";
				$database->sql_insert_update($load_tabellename, $db_stats[0]);
				$game_data=$database->sql_select("bot_chathosts", "*", "owner='".$_SESSION['user']['youtube_user']."' or owner='".$_SESSION['user']['discord_user']."'", false);
				for ($count_game_data=0;$count_game_data<count($game_data);$count_game_data++) {
					$this_channel=$game_data[$count_game_data];
					$add_post['service']=$this_channel['service'];
					$add_post['host']=$this_channel['host'];
					if ($this_channel['service']=="Youtube") {
						$add_post['room']=$LiveStream_Room;
					}
					if ($this_channel['service']=="Discord") {
						$add_post['room']=$this_channel['channel_rpgmain'];
					}
					if ($add_post['room']!="") {
						$database->sql_insert_update("bot_chatlog", $add_post);
					}
				}
			}
			break;
			case 5:	// Ende
			// Irgendwas machen
			break;
			default:
			$change_me=false;
		}
		unset($add_post);
		if ($change_me) {
			$database->sql_insert_update($cronjob_id,$this_game);
		}
		$rundendauer=1; // Ich nehme an das 60 Sekunden zu kurz sind, deswegen hier ein Faktor!
		$tt["cooldown"]=$tt["cooldown"]*$rundendauer;
		
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
