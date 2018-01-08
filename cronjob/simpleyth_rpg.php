<?php
$cronjob_id=strtolower(basename(__FILE__, '.php'));
$do_job=check_settings($database, $cronjob_id);

if ($do_job==false) {
	return;
	die();
} else {
	$token[$cronjob_id]=load_cronjobtoken($database, $cronjob_id, $_SESSION['user']['email']);
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
	$new_feld["monster_id"]="VARCHAR(50)";
	$new_feld["monster_factor"]="INT DEFAULT 100";
	$new_feld["calculate_avg"]="INT DEFAULT 1";
	$new_feld["player_count"]="INT DEFAULT 1";
	$new_feld["monster_hp_max"]="INT DEFAULT 1";
	$new_feld["monster_hp_current"]="INT DEFAULT 1";
	$new_feld["rounds_max"]="INT DEFAULT 1";
	$new_feld["rounds_current"]="INT DEFAULT 0";
	$new_feld["start_time"]="VARCHAR(50)";
	$database->add_columns($cronjob_id, $new_feld);
	unset($new_feld);
	
	// Player Table:
	if(!in_array($cronjob_id."_player", $check_table)) {
		$felder=null;
		$felder["game_id"]="VARCHAR(50)";
		$felder["user_id"]="VARCHAR(50)";
		$felder["user_name"]="VARCHAR(255)";
		$felder["calculate_avg"]="INT DEFAULT 5";
		$felder["sum_dmg"]="VARCHAR(50)";
		$database->create_table($cronjob_id."_player", $felder, "game_id, user_id");
		unset($felder);
	}
	
	// Monster Table:
	if(!in_array($cronjob_id."_monster", $check_table)) {
		$felder=null;
		$felder["monster_id"]="VARCHAR(50)";
		$felder["factor"]="INT DEFAULT 100";
		$database->create_table($cronjob_id."_monster", $felder, "monster_id");
		unset($felder);
	}
	
	// Player Attack Table:
	if(!in_array($cronjob_id."_player_attack", $check_table)) {
		$felder=null;
		$felder["game_id"]="VARCHAR(50)";
		$felder["user_id"]="VARCHAR(50)";
		$database->create_table($cronjob_id."_player_attack", $felder, "game_id, user_id");
		unset($felder);
	}
	
	// Do Magic!
	$game_data=$database->sql_select($cronjob_id, "*", "game_id='".md5($_SESSION['user']['email'])."'", false);
	
	$yt_livestream_data=$database->sql_select("youtube_livestream","*","youtube_snippet_channelid='".$_SESSION['user']['youtube_user']."' AND 	youtube_snippet_actualendtime IS NULL ORDER BY 	youtube_snippet_actualstarttime DESC LIMIT 1", true);
	$LiveStream_Room=$yt_livestream_data[0]['youtube_snippet_livechatid'];
	
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
			$this_game['start_time']=time();
			// Drop old Data
			$database->sql_delete($cronjob_id."_player", "`game_id`='".$this_game['game_id']."'");
			$database->sql_delete($cronjob_id."_player_attack", "`game_id`='".$this_game['game_id']."'");
			
			break;
			case 1: //Wait for Spawn
			
			// Wenn genug Nachrichten da sind, dann starte doch vielleicht einfach XD
			$tmp_msgcount=0;
			$var_msgFactor=2;
			
			//echo "owner='".$_SESSION['user']['youtube_user']."' or owner='".$_SESSION['user']['discord_user']."'<br>";
			$game_hosts=$database->sql_select("bot_chathosts", "*", "owner='".$_SESSION['user']['youtube_user']."' or owner='".$_SESSION['user']['discord_user']."'", false);
			for ($num_host=0;$num_host<count($game_hosts);$num_host++) {
				$this_host=$game_hosts[$num_host];
				$game_message=$database->sql_select("bot_chatlog", "count(id) as anzahl", "service='".$this_host['service']."' AND host='".$this_host['host']."' AND time>=".$this_game['start_time']."", false);
				$tmp_msgcount=$tmp_msgcount+$game_message[0]['anzahl'];
				//echo "service='".$this_host['service']."' AND host='".$this_host['host']."' AND time>=".$this_game['start_time']."<br>";
			}
			$tmp_chance=(int)($tmp_msgcount/$var_msgFactor);
			$rand=rand(0,101);
			if ($tmp_chance>$rand) {
				$this_game['game_state']++;
				$this_game['rounds_max']=rand(5,15);
			}
			
			break;
			case 2:
			$tt["cooldown"]=120;
			$this_game['game_state']++;
			
			$add_post['message']="!rpg anmeldung";
			$game_data=$database->sql_select("bot_chathosts", "*", "owner='".$_SESSION['user']['youtube_user']."' or owner='".$_SESSION['user']['discord_user']."'", false);
			for ($count_game_data=0;$count_game_data<count($game_data);$count_game_data++) {
				$this_channel=$game_data[$count_game_data];
				$add_post['room']="";
				$add_post['service']=$this_channel['service'];
				$add_post['host']=$this_channel['host'];
				if ($this_channel['service']=="YouTube") {
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
			$game_data=$database->sql_select($cronjob_id."_player", "*", "`game_id`='".$this_game['game_id']."'", false);
			$this_game['player_count']=count($game_data);
			if ($this_game['player_count']==0) {
				$this_game['rounds_current']=$this_game['rounds_max'];
			}
			for ($count_game_data=0;$count_game_data<count($game_data);$count_game_data++) {
				$this_player=$game_data[$count_game_data];
				$this_game['calculate_avg']+=($this_player['calculate_avg']-5);
			}
			
			// Generate Monster Stats
			$this_monster['factor']=0;
			while ($this_monster['factor']==0) {
				$game_data=$database->sql_select($cronjob_id."_monster", "*", "true ORDER BY RAND() LIMIT 1", false);
				if (count($game_data)==1) {
					$this_monster=$game_data[0];
				} else {
					// NOTE: Create Monster, because none exists on first run!
					$addMon['monster_id']="Alpha_Monster";
					$addMon['factor']=100;
					$database->sql_insert_update($cronjob_id."_monster", $addMon);
				}
			}
			$this_game['monster_id']=$this_monster['monster_id'];
			$this_game['monster_factor']=$this_monster['factor'];
			// Calculate HP
			$this_game["monster_hp_max"]=($this_game['monster_factor']/100)*($this_game['calculate_avg']*$this_game['rounds_max']);
			$this_game["monster_hp_current"]=$this_game["monster_hp_max"];
			
			// Message to Start!
			if ($this_game['player_count']>0) {
				$add_post['message']="!rpg howto";
				$game_data=$database->sql_select("bot_chathosts", "*", "owner='".$_SESSION['user']['youtube_user']."' or owner='".$_SESSION['user']['discord_user']."'", false);
				for ($count_game_data=0;$count_game_data<count($game_data);$count_game_data++) {
					$this_channel=$game_data[$count_game_data];
					$add_post['room']="";
					$add_post['service']=$this_channel['service'];
					$add_post['host']=$this_channel['host'];
					if ($this_channel['service']=="YouTube") {
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
			$add_post['id']++;
			$add_post['time']++;
			//break;	// Damit der bei State 4 Direkt mit dem Kampf beginnt
			case 4:  // Kampf Start!
			$tt["cooldown"]=60;
			// Calculate DMG and so...
			$game_data=$database->sql_select($cronjob_id."_player INNER JOIN ".$cronjob_id."_player_attack ON ".$cronjob_id."_player.user_id=".$cronjob_id."_player_attack.user_id AND ".$cronjob_id."_player.game_id=".$cronjob_id."_player_attack.game_id", $cronjob_id."_player.*", $cronjob_id."_player.game_id='".$this_game['game_id']."'", false);
			for ($count_game_data=0;$count_game_data<count($game_data);$count_game_data++) {
				$this_player=$game_data[$count_game_data];
				$this_game['monster_hp_current']-=$this_player['calculate_avg'];
				$this_player['sum_dmg']+=$this_player['calculate_avg'];
				$database->sql_insert_update($cronjob_id."_player", $this_player);
			}
			
			if ($this_game['monster_hp_current']<=0) {
				$this_game['rounds_current']=$this_game['rounds_max'];
			}
			$database->sql_delete($cronjob_id."_player_attack", "`game_id`='".$this_game['game_id']."'");
			// Checking Round Counter!
			$this_game['rounds_current']++;
			if ($this_game['rounds_current']>$this_game['rounds_max']) {
				$add_post['id']++;
				$add_post['time']++;
				$this_game['game_state']++;
			} else {
				$add_post['message']="!rpg round";
				$game_data=$database->sql_select("bot_chathosts", "*", "owner='".$_SESSION['user']['youtube_user']."' or owner='".$_SESSION['user']['discord_user']."'", false);
				for ($count_game_data=0;$count_game_data<count($game_data);$count_game_data++) {
					$this_channel=$game_data[$count_game_data];
					$add_post['room']="";
					$add_post['service']=$this_channel['service'];
					$add_post['host']=$this_channel['host'];
					if ($this_channel['service']=="YouTube") {
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
			}
			case 5:	// Ende
			$tt["cooldown"]=1;
			$this_game['game_state']++;
			$add_post['message']="!rpg result";
			$game_data=$database->sql_select("bot_chathosts", "*", "owner='".$_SESSION['user']['youtube_user']."' or owner='".$_SESSION['user']['discord_user']."'", false);
			for ($count_game_data=0;$count_game_data<count($game_data);$count_game_data++) {
				$this_channel=$game_data[$count_game_data];
				$add_post['room']="";
				$add_post['service']=$this_channel['service'];
				$add_post['host']=$this_channel['host'];
				if ($this_channel['service']=="YouTube") {
					$add_post['room']=$LiveStream_Room;
				}
				if ($this_channel['service']=="Discord") {
					$add_post['room']=$this_channel['channel_rpgmain'];
				}
				if ($add_post['room']!="") {
					$database->sql_insert_update("bot_chatlog", $add_post);
				}
			}
			$add_post['id']++;
			$add_post['time']++;
			$game_data=$database->sql_select($cronjob_id."_monster", "*", "monster_id='".$this_game['monster_id']."'", false);
			$this_monster=$game_data[0];
			if ($this_game['player_count']>0) {
				if ($this_game['monster_hp_current']<=0) {
					$this_monster['factor']=($this_monster['factor']*1.25);
				} else {
					$this_monster['factor']=($this_monster['factor']*0.80);
				}
			}
			$database->sql_insert_update($cronjob_id."_monster", $this_monster);
			break;
			case 6:
			if ($this_game['start_time']<time()-(49*60*60)) {
				$add_post['message']="!rpg start";
				$game_data=$database->sql_select("bot_chathosts", "*", "owner='".$_SESSION['user']['youtube_user']."' or owner='".$_SESSION['user']['discord_user']."'", false);
				for ($count_game_data=0;$count_game_data<count($game_data);$count_game_data++) {
					$this_channel=$game_data[$count_game_data];
					$add_post['room']="";
					$add_post['service']=$this_channel['service'];
					$add_post['host']=$this_channel['host'];
					if ($this_channel['service']=="Discord") {
						$add_post['room']=$this_channel['channel_rpgmain'];
					}
					if ($add_post['room']!="") {
						$database->sql_insert_update("bot_chatlog", $add_post);
					}
				}
			}
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
