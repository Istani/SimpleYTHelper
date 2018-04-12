<?php
require 'inc/php_inc.php';

// default
$check_table=$database->show_tables();

$_tmp_tabellename=strtolower("youtube_communitytab");
if(in_array($_tmp_tabellename, $check_table)) {
  $yt_com = $database->sql_select($_tmp_tabellename,"*","youtube_link LIKE 'https://www.youtube.com/channel/".$_SESSION['user']['youtube_user']."%' ODER BY last_update DESC LIMIT 1",false);
  if (count($yt_com)==0) {
    echo "Kein Community Tab eintrag gefunden!";
  } else {
    $output_text=$yt_com[0]['youtube_text'];
    $output_link=$yt_com[0]['youtube_link'];
    while (str_len($output_text."<br>".$output_link)>200) {
      $parts=explode(" ", $output_text);
      unset($parts[count($parts)-1]);
      $output_text=implode(" ",$parts);
      $output_text.="...";
    }
    echo $output_text."<br>".$output_link;
  }
} else {
  echo "Kein Community Tab eintrag gefunden!";
}
?>
