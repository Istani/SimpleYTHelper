<?php
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
  $felder["game_name"]="VARCHAR(255) NOT NULL";
  $felder["link"]="VARCHAR(255) NOT NULL";
  $felder["text"]="VARCHAR(255) NOT NULL";
  $felder["score"]="BIGINT(20) NOT NULL DEFAULT '0'";
  $felder["last_update"]="BIGINT(20) NOT NULL DEFAULT '0'";
  $database->create_table($_tmp_tabellename, $felder, "game_name, link");
  unset($felder);
}
$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
    $check_time=time();

    $game_list=$database->sql_select("bot_gamelist LEFT JOIN ".$_tmp_tabellename." ON bot_gamelist.name = ".$_tmp_tabellename.".game_name",
        "bot_gamelist.name",
        "true
        GROUP BY bot_gamelist.name
        ORDER BY ".$_tmp_tabellename.".last_update
        LIMIT 1")[0];
    if ($game_list['name']!="") {
        echo $game_list['name'].'<br>';
        
        $amazon_link = new AmazonECS($amazon['API_KEY'], $amazon['API_Secret'], 'DE', 'istani0815-21');
        $amazon_link->returnType(AmazonECS::RETURN_TYPE_ARRAY);
        try {
          $response  = $amazon_link->category('All')->search($game_list['name']);
        } catch (Exception $e) {
          
        }

        $added_links=0;
        $count_links=10;
        while ($count_links>=0) {
            if (isset($response['Items']['Item'][$count_links])) {
                $new_data['game_name']=$game_list['name'];
                $new_data['last_update']=$check_time;
                $new_data['link']=$response['Items']['Item'][$count_links]['DetailPageURL'].'<br>';
                $new_data['text']=$response['Items']['Item'][$count_links]['ItemAttributes']['Title'].'<br>';
                //$response['Items']['Item'][$count_links]['ItemAttributes']['ProductGroup'].'<br>'.'<br>';
                debug_log($new_data);
                $database->sql_insert_update($_tmp_tabellename, $new_data);
                $added_links++;
                unset($new_data);
            }
            $count_links--;
        }
        if ($added_links==0) {
            $new_data['game_name']=$game_list['name'];
            $new_data['last_update']=$check_time;
            $new_data['link']='';
            $new_data['text']='Kein Link gefunden';
            //$response['Items']['Item'][$count_links]['ItemAttributes']['ProductGroup'].'<br>'.'<br>';
            debug_log($new_data);
            $database->sql_insert_update($_tmp_tabellename, $new_data);
            unset($new_data);
        }
        //debug_log($response);
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
