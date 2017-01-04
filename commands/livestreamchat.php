<?php
require 'inc/php_inc.php';

// default
$subname = "";

$check_table=$database->show_tables();

$_tmp_tabellename="livestream_chat";
if(in_array($_tmp_tabellename, $check_table)) {
  $db_subs = $database->sql_select($_tmp_tabellename, "*", "ignore='0' ORDER BY RANDOM() LIMIT 1",true);
  $subname=$db_subs[0];
}
debug_log($subname);
?>
