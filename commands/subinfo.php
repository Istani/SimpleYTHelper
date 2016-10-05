<?php

// Getting SUB count & last name
require 'inc/php_inc.php';

$database=new db("sqlite","");
$database->connect_db("data/".$KANALID.".sqlite3");

// default
$subname = "Nobody";
$subtext ="";

if ($_GET["param"]=="") {
	$subtext="\n\rBitte einen Subscriber Namen eingeben!";
}

$check_table=$database->show_tables();

$_tmp_tabellename="subscriptions_subscriberSnippet";
if(in_array($_tmp_tabellename, $check_table) AND ($_GET["param"]!="")) {
  $db_subs = $database->sql_select($_tmp_tabellename, "*", "title LIKE '".$_GET["param"]."%' ORDER BY first_seen DESC LIMIT 1",true);
  if ($db_subs[0]["title"]==""){
  $subname="Nicht gefunden!";
  $subtext="\n\rGesucht: ".$_GET["param"];
  } else {
  $subname=$db_subs[0]["title"];
  $subtext="\n\rEntdeckt: ".date("d.m.Y h:i:s",(int)$db_subs[0]["first_seen"]);
  }
}
echo "Name: " . $subname . $subtext;
?>