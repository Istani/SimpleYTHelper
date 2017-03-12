<?php
require 'inc/php_inc.php';

// default
$subname = "Nobody";
$subtext ="";

if ($_GET["param"]=="") {
	$subtext="\n\rBitte einen Subscriber Namen eingeben!";
}

$check_table=$database->show_tables();

$_tmp_tabellename=strtolower("subscriptions_subscriberSnippet");
if(in_array($_tmp_tabellename, $check_table) AND ($_GET["param"]!="")) {
	$db_subs = $database->sql_select($_tmp_tabellename, "*", "user='".$_SESSION['user']['email']."' AND title LIKE '".$_GET["param"]."%' ORDER BY first_seen DESC LIMIT 1",true);
	if ($db_subs[0]["title"]==""){
		$subname="Nicht gefunden!";
		$subtext="\n\rGesucht: ".$_GET["param"];
	} else {
		$subname=$db_subs[0]["title"];
		$subtext="\n\rEntdeckt: ".date("d.m.Y h:i:s",(int)$db_subs[0]["first_seen"]);
		$subtext.="\n\rAktualisiert: ".date("d.m.Y h:i:s",(int)$db_subs[0]["last_seen"]);
		$subtext.="\n\rThumbnail: ".$db_subs[0]["thumbnail"];
		
	}
}
echo "Name: " . $subname . $subtext;
?>
