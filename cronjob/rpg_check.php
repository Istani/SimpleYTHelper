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
	//die("RPG CHECK");
	// Additional Later Added Cols
	
	// Do Magic!
	
	
	// Save Token
	echo date("d.m.Y - H:i:s")." - ".$_SESSION['user']['email'].': '.$cronjob_id." updated!<br>";
	$tt["last_used"]=time();
	$tt["user"]=$_SESSION['user']['email'];
	if($tt["token"]==""){$tt["token"]="null";}
	$database->sql_insert_update("bot_token",$tt);
	unset($tt);
}

?>
