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
  $felder["link"]="VARCHAR(255) NOT NULL";
  $felder["text"]="VARCHAR(255) NOT NULL";
  $felder["price"]="VARCHAR(255) NOT NULL";
  $felder["discount"]="VARCHAR(255) NOT NULL DEFAULT '0'";
  $felder["old_discount"]="VARCHAR(255) NOT NULL DEFAULT ''";
  $felder["last_check"]="BIGINT(20) NOT NULL DEFAULT '0'";
  $felder["type"]="VARCHAR(255) NOT NULL DEFAULT ''";
  $database->create_table($_tmp_tabellename, $felder, "link");
  unset($felder);
}

// NOTE: Check Ohters
$possible_hosts=$database->sql_select("bot_chathosts","*","true Limit 1", true); //channel_humble
if (!isset($possible_hosts[0]['channel_humble'])) {
  $new_feld['channel_humble']="TEXT";
  $database->add_columns("bot_chathosts", $new_feld);
  unset($new_feld);
}
$possible_owner=$database->sql_select("user","*","true Limit 1", true); // partner_humble
if (!isset($possible_hosts[0]['partner_humble'])) {
  $new_feld['partner_humble']="TEXT";
  $database->add_columns("user", $new_feld);
  unset($new_feld);
}

$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  
  // Load Data
  $possible_humble=$database->sql_select($_tmp_tabellename,"*, CAST(TRIM(LEADING  '-' FROM TRIM(TRAILING  '%'FROM discount)) AS UNSIGNED) AS CalcDiscount",
  "discount NOT LIKE old_discount AND CalcDiscount>75 AND type='Store' ORDER BY discount DESC LIMIT 1", true);
  if ($possible_humble[0]['link']=="") {
    // Es gibt keinen Link?
    echo 'Kein Humble Sale verfügbar!<br>';
  } else {
    $post_id=83300;
    
    debug_log($possible_humble[0]);
    $possible_hosts=$database->sql_select("bot_chathosts","*","channel_humble NOT LIKE ''", true);
    for ($count_hosts=0;$count_hosts<count($possible_hosts);$count_hosts++) {
      $possible_owner=$database->sql_select("user","*","partner_humble NOT LIKE '' AND (
        youtube_user='".$possible_hosts[$count_hosts]['owner']."' OR discord_user='".$possible_hosts[$count_hosts]['owner']."'
        )", true);
        
        if ($possible_owner[0]['partner_humble']=="") {
          $possible_owner=$database->sql_select("user","*","status=1", true);
        }
        if ($possible_owner[0]['partner_humble']=="") {
          $possible_owner[0]['partner_humble']="istani0815";
        }
        //debug_log($possible_owner);
        
        $ads_template=$database->sql_select("user_ads", "*", "false", true)[0];
        $ads_template["owner"]=$possible_owner[0]['email'];
        $ads_template["premcount"]=0;
        $ads_template["type"]="AD_Humble";
        $ads_template["ispremium"]=0;
        $ads_template["count"]=0;
        $ads_template['link']=$possible_humble[0]['link']."?partner=".$possible_owner[0]['partner_humble'];
        $ads_template['title']="Humble Sale: ".$possible_humble[0]['discount'].' auf '.$possible_humble[0]['text'].' ('.$possible_humble[0]['price'].')';
        $database->sql_insert_update("user_ads", $ads_template);
        
        $get_ad=$database->sql_select("user_ads","*, md5(concat(owner,link)) AS hash","link='".$ads_template['link']."' ORDER BY RAND() LIMIT 1",true)[0];
        unset($ads_template);
        $output_text="(AD) ".$get_ad['title'].": http://s.defender833.de/l.php?l=".$get_ad['hash'];
        
        $add_post['service']=$possible_hosts[$count_hosts]['service'];
        $add_post['host']=$possible_hosts[$count_hosts]['host'];
        $add_post['room']=$possible_hosts[$count_hosts]['channel_humble'];
        $add_post['id']=$post_id++;
        $add_post['time']=time();
        $add_post['user']="-1";
        $add_post['message']="!php_hack ".$output_text;
        $add_post['process']=0;
        $add_post['php_process']=0;
        $database->sql_insert_update("bot_chatlog", $add_post);
        debug_log($add_post);
      }
    }
    $tt["cooldown"]=30;
    
    $possible_humble[0]['old_discount']=$possible_humble[0]['discount'];
    $database->sql_insert_update($_tmp_tabellename, $possible_humble[0]);
  }
  
  echo date("d.m.Y - H:i:s")." - ".$_tmp_tabellename." updated!<br>";
  $tt["last_used"]=time();
  $tt["user"]=$_SESSION['user']['email'];
  if (!isset($tt["token"])) {$tt["token"]="";}
  if($tt["token"]==""){$tt["token"]="null";}
  $database->sql_insert_update("bot_token",$tt);
  unset($tt);
  ?>
