<?php
require 'inc/php_inc.php';

// default
$subcount = 0;
$subname = "Nobody";

$check_table=$database->show_tables();

$_tmp_tabellename=strtolower("youtube_sponsors");
if(in_array($_tmp_tabellename, $check_table)) {
  $db_subs = $database->sql_select($_tmp_tabellename, "*", "sponsorid='".$_SESSION['user']['youtube_user']."'ORDER BY first_seen",true);
  for ($cnt_sponsors=0;$cnt_sponsors<count($db_subs);$cnt_sponsors++) {
    echo $db_subs[$cnt_sponsors]["displayname"]."\r\n";
  }
  
} else {
  echo "Kein VIP gefunden!";
}

?>
