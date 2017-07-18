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

$_tmp_tabellename=strtolower("subscriptions_subscriberSnippet");
if(in_array($_tmp_tabellename, $check_table)) {
  // Neu Benötigtes Feld hinzufügen
  $new_feld["BOT_five_subs"]="TEXT";
  $database->add_columns($_tmp_tabellename, $new_feld);
  unset($new_feld);
  
  // Feld für Datensätze updaten
  $empty_data=$database->sql_select($_tmp_tabellename, "channelId","user='".$_SESSION['user']['email']."' AND not BOT_five_subs = '".$output[0]."'", false);
  foreach ($empty_data as $k=>$v){
    $newData=$v;
    $newData["BOT_five_subs"]="";
    $database->sql_insert_update($_tmp_tabellename, $newData);
  }
  unset($newData);
  
  // Abfrage
  $db_subs = $database->sql_select($_tmp_tabellename, "*", "user='".$_SESSION['user']['email']."' AND `ignore`=0 AND bot_five_subs='".$output[0]."' ORDER BY RAND() LIMIT 5",true);
  if (count($db_subs)<3) {
    $db_subs = $database->sql_select($_tmp_tabellename, "*", "user='".$_SESSION['user']['email']."' AND `ignore`=0 ORDER BY RAND() LIMIT 5",true);
  }
  for ($i=0;$i<5;$i++) {
    if (isset($db_subs[$i])) {
      $newData=$db_subs[$i];
      $newData["bot_five_subs"]=$output[0];
      $database->sql_insert_update($_tmp_tabellename, $newData);
    }
  }
  unset($newData);
  
  $db_subs = $database->sql_select($_tmp_tabellename, "*", "user='".$_SESSION['user']['email']."' AND `ignore`=0 AND bot_five_subs='".$output[0]."' ORDER BY title",true);
  
}

for ($i = 0; $i <= 5; $i++) {
  if (isset($db_subs[$i])) {
    $output[$i]=$db_subs[$i]["title"];
    echo $output[$i] . ", ";
  }
}
?>
