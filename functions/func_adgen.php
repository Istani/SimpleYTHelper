<?php
function Generate_Amazon_Ad($amazon, $database, $tag="", $user="-1", $is_echo=false, $is_stream=false) {
  require_once 'API/Amazon/lib/AmazonECS.class.php';
  $client = new AmazonECS($amazon['API_KEY'], $amazon['API_Secret'], 'DE', 'istani0815-21');
  $client->returnType(AmazonECS::RETURN_TYPE_ARRAY);
  try {
    $response  = $client->category('All')->search($tag);
  } catch (Exception $e) {
    return;
  }
  
  //debug_log($response);
  
  $SYTH_USER=$database->sql_select("user", "*", "youtube_user='".$user."' or discord_user='".$user."'", true)[0];
  if ($SYTH_USER['email']=="") {
    $SYTH_USER=$database->sql_select("user", "*", "status='1'", true)[0];
  }
  //debug_log($SYTH_USER);
  
  $ads_template=$database->sql_select("user_ads", "*", "false", true)[0];
  $ads_template["owner"]=$SYTH_USER['email'];
  $ads_template["premcount"]=5;
  $ads_template["type"]="AD_".$user;
  $ads_template["ispremium"]=$SYTH_USER['status'];
  $ads_template["count"]=0;
  if ($is_stream==true) {
    $ads_template["premcount"]=3;
    $ads_template["type"]="AD_Livestream";
  }
  if ($is_echo==true) {
    $ads_template["premcount"]=1;
    $ads_template["type"]="AD_UserID: ".$user;
    $ads_template["ispremium"]=$SYTH_USER['ad_status'];
    $ads_template["count"]=-1;
  }
  
  $count_links=$ads_template["premcount"];
  while ($count_links>0) {
    $count_links--;
    if (isset($response['Items']['Item'][$count_links])) {
      $ads_template['link']=$response['Items']['Item'][$count_links]['DetailPageURL'];
      $ads_template['title']=$response['Items']['Item'][$count_links]['ItemAttributes']['Title'];
      
      $max_ad_len=200-70;
      if (strlen($ads_template['title'])>$max_ad_len) {
        while (strlen($ads_template['title'])>$max_ad_len) {
          $this_parts=explode(" ",$ads_template['title']);
          unset($this_parts[count($this_parts)-1]);
          $ads_template['title']=implode(" ",$this_parts);
        }
      }
      
      if ($is_stream==true) {
        if (($ads_template["premcount"]/2)>$count_links) {
          
          $ads_template['link']=str_replace("istani0815-21", "defender833ga-21",$ads_template['link']);
        }
      }
      $database->sql_insert_update("user_ads", $ads_template);
      //debug_log($ads_template);
    }
  }
}
?>
