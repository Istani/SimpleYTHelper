<?php
$get_owner=$database->sql_select("bot_chathosts","*","host='".$this_msg['host']."'",true)[0]['owner'];
$owner_user=$database->sql_select("user","*","discord_user='".$get_owner."' or youtube_user='".$get_owner."'",true)[0];
if (!isset($owner_user['ad_status']) && $owner_user['email']!="" || $owner_user['ad_status']=="" || $owner_user['ad_status']==null) {
  $owner_user['ad_status']=1;
  $new_feld['ad_status']="TEXT";
  $database->add_columns("user", $new_feld);
}
if ($get_owner=="") {
  $owner_user['ad_status']=1;
  $owner_user['email']="";
}

$get_ad['link']="";
$try_check=0;
while ($get_ad['link']=="" && $try_check<3) {
  $try_check++;
  if ($owner_user['ad_status']==1) {
    $ad_where="ispremium='1' AND link NOT LIKE '' AND premcount!='0'";
  } else {
    $ad_where="owner='".$owner_user['email']."' AND type NOT LIKE 'Link' AND link NOT LIKE ''";
  }
  $get_min_counter=$database->sql_select("user_ads","MIN(count) as min_counter",$ad_where,true)[0]['min_counter'];
  if ($get_min_counter=="") {
    $get_min_counter=0;
  }
  
  if ($get_min_counter>=2) {
    $ToBeChange=$database->sql_select("user_ads","*",$ad_where." AND count>=".$get_min_counter,true);
    for ($count_changes=0;$count_changes<count($ToBeChange);$count_changes++) {
      $ToBeChange[$count_changes]['count']=0;
      $database->sql_insert_update("user_ads",$ToBeChange[$count_changes]);
    }
    $get_min_counter=0;
    unset($ToBeChange);
  }
  
  $get_ad=$database->sql_select("user_ads","*, md5(concat(owner,link)) AS hash",$ad_where." AND count='".$get_min_counter."' ORDER BY RAND() LIMIT 1",true)[0];
  
  if ($owner_user['ad_status']==1) {
    $owner_user['ad_status']=0;
  } else {
    $owner_user['ad_status']=1;
  }
}

if ($get_ad['link']!="") {
  // Do Things with Ads
  if ($owner_user['email']!="") {
    $database->sql_insert_update("user",$owner_user);
  }
  if ($get_ad['premcount']>0){
    $get_ad['premcount']--;
  }
  $get_ad['count']++;
  echo "(AD) ".$get_ad['title'].": http://s.defender833.de/l.php?l=".$get_ad['hash'];
  unset($get_ad['hash']);
  $database->sql_insert_update("user_ads",$get_ad);
  
  if ($this_msg['service']=="YouTube" && $owner_user['youtube_user']==$this_msg['user']) {
    // ADD Live Cuepoint
    $TmpToken=$database->sql_select("authtoken","*","service='".$this_msg['service']."' AND user='".$owner_user['email']."' LIMIT 1",true)[0];
    if ($TmpToken['user']==$owner_user['email']) {
      //
      //TODO: GGF die Room ID durch die broadcastId wechseln?
      
      $videos_yt=$database->sql_select("youtube_livestream", "*", "youtube_snippet_channelid='".$owner_user['youtube_user']."' AND (youtube_snippet_actualendtime IS NULL OR youtube_snippet_actualendtime='') ORDER BY youtube_snippet_actualstarttime DESC LIMIT 1",false);
      if (count($videos_yt)>0) {
        
        $CURL_Options[CURLOPT_POSTFIELDS]='{
          "broadcastId": "'.$videos_yt[0]['youtube_id'].'",
          "settings": {
            "cueType": "ad",
            "offsetTimeMs": "0",
            "durationSecs": 15
          }
        }';
        $client = new OAuth2\Client($OAUTH2_CLIENT_ID, $OAUTH2_CLIENT_SECRET);
        $client->setAccessToken($TmpToken['access_token']);
        $client->setAccessTokenType(1); //ACCESS_TOKEN_BEARER
        $client->setCurlOptions($CURL_Options);
        $params = array('channelId' => $owner_user['youtube_user']);
        $response = $client->fetch('https://www.googleapis.com/youtube/partner/v1/liveCuepoints', $params);
        
        debug_log($response);
      }
      
      
    }
  }
}

/*
$result = ob_get_contents();
ob_end_clean();
$result = replace_html2markdown($result);
echo $result;
die();
*/
?>
