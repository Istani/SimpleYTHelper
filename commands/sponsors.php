<?php
require 'inc/php_inc.php';

// default
$check_table=$database->show_tables();

$_tmp_tabellename=strtolower("youtube_sponsors");
if(in_array($_tmp_tabellename, $check_table)) {
  $db_subs = $database->sql_select($_tmp_tabellename, "*", "youtube_snippet_channelid='".$_SESSION['user']['youtube_user']."'ORDER BY youtube_snippet_sponsorsince",false);
  if (count($db_subs)==0) {
    echo "Kein VIP gefunden!";
  }
  for ($cnt_sponsors=0;$cnt_sponsors<count($db_subs);$cnt_sponsors++) {
    echo $db_subs[$cnt_sponsors]["youtube_snippet_sponsordetails_displayname"]."\r\n";
  }
  
} else {
  echo "Kein VIP gefunden!";
}

?>
