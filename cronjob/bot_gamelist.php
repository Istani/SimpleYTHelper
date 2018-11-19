<?php
// http://api.steampowered.com/ISteamApps/GetAppList/v0001/
$cronjob_id=basename(__FILE__, '.php');
$do_job=check_settings($database, $cronjob_id);

if ($do_job==false) {
  return;
  die();
} else {
  $token[$cronjob_id]=load_cronjobtoken($database, $cronjob_id, $_SESSION['user']['email']);
}
$_tmp_tabellename=strtolower($cronjob_id);

$check_table=$database->show_tables();
if(in_array("bot_steamappid", $check_table)) {
  if(!in_array($_tmp_tabellename, $check_table)) {
    $felder=null;
    $felder["name"]="VARCHAR(255) NOT NULL";
    $felder["steam_id"]="VARCHAR(255) NOT NULL";
    $felder["humble_link"]="VARCHAR(255) NOT NULL";
    
    $felder["banner"]="VARCHAR(255) NOT NULL";
    $felder["description"]="TEXT NOT NULL";
    
    $felder["last_import"]="INT(20) NOT NULL";
    $database->create_table($_tmp_tabellename, $felder, "name");
    unset($felder);
  }
  if (isset($new_data)) {
    unset($new_data);
  }

  $new_feld['humble_price']="VARCHAR(6)";
  $new_feld['steam_price']="VARCHAR(6)";
  $database->add_columns($_tmp_tabellename, $new_feld);
  unset($new_feld);
  
  
  $tt=$token[$_tmp_tabellename];
if (0) {
  if ($tt["last_used"]+$tt["cooldown"]<time()) {
    // Steam
    $sub_query="SELECT `text` as name FROM bot_humble";
    $tmp_video_games_list=$database->sql_select("bot_steamappid","*","name IN (".$sub_query.")");
    for ($count_games=0;$count_games<count($tmp_video_games_list);$count_games++) {
      $new_data['name']=$tmp_video_games_list[$count_games]['name'];
      $new_data['steam_id']=$tmp_video_games_list[$count_games]['appid'];

      //$new_data['steam_price']=$tmp_video_games_list[$count_games]['simpleyth_price'];
      $database->sql_insert_update($_tmp_tabellename,$new_data);
      unset($new_data);
    }
    
    // Humble
    $tmp_video_games_list=$database->sql_select("bot_humble","*","true");
    for ($count_games=0;$count_games<count($tmp_video_games_list);$count_games++) {
      $new_data['name']=$tmp_video_games_list[$count_games]['text'];
      $new_data['humble_link']=$tmp_video_games_list[$count_games]['link'];
      $preis=$tmp_video_games_list[$count_games]['price'];
      $preis=substr($preis,1);
      $preis=str_replace(",","",$preis);
      $new_data['humble_price']=$preis/100;
      $database->sql_insert_update($_tmp_tabellename,$new_data);
      unset($new_data);
    }
  }
}
}
$tt["cooldown"]=1*60*60*24;
// Save Token
echo date("d.m.Y - H:i:s")." - ".$_tmp_tabellename." updated!<br>";
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if($tt["token"]==""){$tt["token"]="null";}
if ($_SESSION['user']['email']!="") {
  $database->sql_insert_update("bot_token",$tt);
}
$token[strtolower("bot_chatspam")]=$tt;
unset($tt);
?>
