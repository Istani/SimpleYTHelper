<?php

// Getting SUB count & last name
require 'inc/php_inc.php';

$database=new db("sqlite","");
$database->connect_db("data/".$KANALID.".sqlite3");

// default
$subcount = 0;
$subname = "Nobody";

$db_stats = $database->sql_select("channels_statistics", "*", "id='".$KANALID."'", true);
$subcount=$db_stats[0]["subscriberCount"];

$db_subs = $database->sql_select("subscriptions_subscriberSnippet", "*", "ignore=0 ORDER BY first_seen DESC LIMIT 1",true);
$subname=$db_subs[0]["title"];

echo "#" . $subcount . " - " . $subname;
?>