<?php
require 'inc/php_inc.php';

// default
$subname = "Nobody";

$check_table=$database->show_tables();

$_tmp_tabellename=strtolower("youtube_subscriber");
if(in_array($_tmp_tabellename, $check_table)) {
  $db_subs = $database->sql_select($_tmp_tabellename, "*", "youtube_channelid='".$_SESSION['user']['youtube_user']."' ORDER BY RAND() LIMIT 1",true);
  $subname=$db_subs[0]["youtube_subscribersnippet_title"];
}
echo $subname;
?>
