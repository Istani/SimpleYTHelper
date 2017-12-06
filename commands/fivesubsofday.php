<?php
require 'inc/php_inc.php';

$time = time();
$time_min = (int) ($time / 60);
$time_std = (int) ($time_min / 60);
$time_day = (int) ($time_std / 24);

// default
$output[0] = $time_day;
$output[1] = "Nobody";
$output[2] = "Nobody";
$output[3] = "Nobody";
$output[4] = "Nobody";
$output[5] = "Nobody";

$check_table=$database->show_tables();

$_tmp_tabellename=strtolower("youtube_subscriber");
if(in_array($_tmp_tabellename, $check_table)) {
  // Neu Benötigtes Feld hinzufügen
  $new_feld["simpleyth_fivesubs"]="TEXT";
  $database->add_columns($_tmp_tabellename, $new_feld);
  unset($new_feld);
  
  // Feld für Datensätze updaten
  $empty_data=$database->sql_select($_tmp_tabellename, "*","youtube_channelid='".$_SESSION['user']['youtube_user']."' AND not simpleyth_fivesubs = '".$output[0]."'", false);
  foreach ($empty_data as $k=>$v){
    $newData=$v;
    $newData["simpleyth_fivesubs"]="";
    $database->sql_insert_update($_tmp_tabellename, $newData);
  }
  unset($newData);
  
  // Abfrage
  $db_subs = $database->sql_select($_tmp_tabellename, "*", "youtube_channelid='".$_SESSION['user']['youtube_user']."' AND simpleyth_fivesubs='".$output[0]."' ORDER BY RAND() LIMIT 5",true);
  if (count($db_subs)<3) {
    $db_subs = $database->sql_select($_tmp_tabellename, "*", "youtube_channelid='".$_SESSION['user']['youtube_user']."' ORDER BY RAND() LIMIT 5",true);
  }
  for ($i=0;$i<5;$i++) {
    if (isset($db_subs[$i])) {
      $newData=$db_subs[$i];
      $newData["simpleyth_fivesubs"]=$output[0];
      $database->sql_insert_update($_tmp_tabellename, $newData);
    }
  }
  unset($newData);
  $db_subs = $database->sql_select($_tmp_tabellename, "*", "youtube_channelid='".$_SESSION['user']['youtube_user']."' AND simpleyth_fivesubs='".$output[0]."' ORDER BY youtube_subscribersnippet_title",true);
  
}

for ($i = 0; $i <= 5; $i++) {
  if (isset($db_subs[$i])) {
    $output[$i]=$db_subs[$i]["youtube_subscribersnippet_title"];
    echo $output[$i] . ", ";
  }
}
?>
