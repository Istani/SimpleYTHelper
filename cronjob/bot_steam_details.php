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
if(!in_array($_tmp_tabellename, $check_table)) {
  $felder=null;
  $felder["steam_app_id"]="VARCHAR(255) NOT NULL";
  $database->create_table($_tmp_tabellename, $felder, "steam_app_id");
  unset($felder);
}


$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  
  if(in_array("bot_gamelist", $check_table)) {
    $game_to_update=$database->sql_select("bot_gamelist", "*", "steam_id NOT LIKE '' ORDER BY last_import, name LIMIT 1")[0];
    
    $client = new OAuth2\Client(NULL, NULL);
    $response = $client->fetch('http://store.steampowered.com/api/appdetails?appids='.$game_to_update['steam_id'].'&cc=de&l=de');
    if (isset($response["result"][$game_to_update['steam_id']])) {
      $response = $response["result"][$game_to_update['steam_id']];
      if (isset($response['data'])) {
        $response=$response['data'];
        
        unset($response['type']);
        unset($response['steam_appid']);
        unset($response['mac_requirements']);
        unset($response['pc_requirements']);
        unset($response['linux_requirements']);
        unset($response['is_free']);
        unset($response['packages']);
        unset($response['package_groups']);
        unset($response['categories']);
        unset($response['screenshots']);
        unset($response['movies']);
        unset($response['achievements']);
        unset($response['background']);
        
        unset($response['dlc']);  // Ja es gibt spiele die zu viele DLC haben
        $tmp_details=$SYTHS->multiarray2array($response, "steam");
        
        $tmp_details['steam_app_id']=$game_to_update['steam_id'];
        foreach ($tmp_details as $key=>$value){
          $new_feld[$key]="TEXT";
          $database->add_columns($_tmp_tabellename, $new_feld);
          unset($new_feld);
          $newData[$key]=$value;
        }
        debug_log($newData);
        $database->sql_insert_update($_tmp_tabellename, $newData);
        unset($newData);
      }
      
      if (isset($response["header_image"])) {$game_to_update['banner']=$response["header_image"];}
      
      if (isset($response["short_description"])) {$game_to_update['description']=$response["short_description"];}
      if (isset($response["detailed_description"])) {$game_to_update['description']=$response["detailed_description"];}
      
      $game_to_update['steam_price']=$tmp_details['steam_price_overview_final']/100;
      $game_to_update['last_import']=time();
      $database->sql_insert_update("bot_gamelist",$game_to_update);
      
      debug_log($game_to_update);
    }
  }
  $tt["cooldown"]=1*60;
}
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
