<?php

// Getting SUB count & last name
require 'inc/php_inc.php';

$database=new db("sqlite","");
$database->connect_db("data/".$KANALID.".sqlite3");

// default
$subcount = 0;
$subname = "Nobody";

$check_table=$database->show_tables();

$_tmp_tabellename="channels_statistics";
if(in_array($_tmp_tabellename, $check_table)) {
  $db_stats = $database->sql_select($_tmp_tabellename, "*", "id='".$KANALID."'", true);
  $subcount=$db_stats[0]["subscriberCount"];
}

$_tmp_tabellename="subscriptions_subscriberSnippet";
if(in_array($_tmp_tabellename, $check_table)) {
  $db_subs = $database->sql_select($_tmp_tabellename, "*", "ignore=0 ORDER BY first_seen DESC LIMIT 1",true);
  $subname=$db_subs[0]["title"];
}
echo "#" . $subcount . " - " . $subname;
?>