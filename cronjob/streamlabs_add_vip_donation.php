<?php
$cronjob_id=basename(__FILE__, '.php');
$do_job=check_settings($database, $cronjob_id);

if ($do_job==false) {
  return;
} else {
  $token[$cronjob_id]=load_cronjobtoken($database, $cronjob_id, $_SESSION['user']['email']);
}
$tt=$token[$cronjob_id];

if ($tt["last_used"]+$tt["cooldown"]<time()) {
  if ($_SESSION['user']['youtube_user']!="") {
    $vips=$database->sql_select("youtube_sponsors","*","youtube_snippet_channelid LIKE '".$_SESSION['user']['youtube_user']."'", true);
    if (!isset($vips[0]["simpleyth_monate_streamlabs"])) {
      $new_feld["simpleyth_monate_streamlabs"]="TEXT";
      $database->add_columns("youtube_sponsors", $new_feld);
    }
    $vips=$database->sql_select("youtube_sponsors","*","youtube_snippet_channelid LIKE '".$_SESSION['user']['youtube_user']."' ORDER BY CAST(simpleyth_monate_streamlabs AS UNSIGNED), youtube_snippet_sponsorsince", true);
    $cnt_sponsor=0;
    while ($cnt_sponsor<count($vips)) {
      if ($vips[$cnt_sponsor]["simpleyth_monate_streamlabs"]<$vips[$cnt_sponsor]["simpleyth_monate"]) {
        $vips[$cnt_sponsor]["simpleyth_monate_streamlabs"]++;
        
        $name=array();
        $temp=$vips[$cnt_sponsor]["youtube_snippet_sponsordetails_displayname"];
        //$temp= mb_convert_encoding($vips[$cnt_sponsor]["youtube_snippet_sponsordetails_displayname"], "ISO-8859-1");
        $temp=str_replace("ä","ae",$temp);
        $temp=str_replace("ö","oe",$temp);
        $temp=str_replace("ü","ue",$temp);
        $temp=str_replace("Ä","AE",$temp);
        $temp=str_replace("Ö","OE",$temp);
        $temp=str_replace("Ü","UE",$temp);
        preg_match_all('/([\w])+/', $temp,$name);
        $temp=implode("_",$name[0]);
        
        $monate=$vips[$cnt_sponsor]["simpleyth_monate_streamlabs"]-1;
        $datum=strtotime($vips[$cnt_sponsor]["youtube_snippet_sponsorsince"])-2*60*60;
        if ($monate>0) {
          $datum = strtotime("+".$monate." MONTH", $datum);
        }
        
        
        $params=array(
          'name' => $temp,
          'identifier' => $vips[$cnt_sponsor]["youtube_snippet_sponsordetails_channelid"],
          'amount' => 2.5,
          'currency' => 'EUR',
          'message' => $vips[$cnt_sponsor]["simpleyth_monate_streamlabs"].'x VIP!',
          'created_at' => date("m/d/Y h:i A",$datum)
        );
        $response = $client->fetch('https://streamlabs.com/api/v1.0/donations', $params,'POST');
        if (!isset($response['result']['error'])) {
          $database->sql_insert_update("youtube_sponsors",$vips[$cnt_sponsor]);
        }
        $cnt_sponsor=count($vips);
        debug_log($params);
        debug_log($response);
      }
      $cnt_sponsor++;
    }
    
    
  }
  $tt["cooldown"]=60*1;
}
// Save Token
echo date("d.m.Y - H:i:s")." - ".$_SESSION['user']['streamlabs_user'].': '.$cronjob_id." updated!<br>";
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if (!isset($tt["token"])) {$tt["token"]="";}
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);
unset($tt);
?>
