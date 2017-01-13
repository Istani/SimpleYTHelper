<?php
require 'inc/php_inc.php';

// default
$subname = "Nobody";

$check_table=$database->show_tables();

$_tmp_tabellename=strtolower("subscriptions_subscriberSnippet");
if(in_array($_tmp_tabellename, $check_table)) {
  $db_subs = $database->sql_select($_tmp_tabellename, "*", "token_id='".$_SESSION['token']['id']."' AND `ignore`=0 ORDER BY RAND() LIMIT 1",true);
  $subname=$db_subs[0]["title"];
}
echo $subname;
?>
