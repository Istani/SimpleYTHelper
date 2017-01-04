<?php
require 'inc/php_inc.php';

$check_table=$database->show_tables();

$_tmp_tabellename="bot_token";
$sql_data = $database->sql_select($_tmp_tabellename, "*", "",true);
foreach ($sql_data as $data_zeilen => $sql_data2)  {
  echo $sql_data2["id"]." ";
  echo date("d.m.Y H:i:s", $sql_data2["last_used"])." ";
  echo "+ ".$sql_data2["interval"]." ";
  echo "\r\n";
}

?>
