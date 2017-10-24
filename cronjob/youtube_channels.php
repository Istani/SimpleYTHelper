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
if (!isset($token[$_tmp_tabellename])) {
  $token[$_tmp_tabellename] = init_token($_tmp_tabellename);
}

$check_table=$database->show_tables();
if(!in_array($_tmp_tabellename, $check_table)) {
  $felder=null;
  $felder["youtube_id"]="VARCHAR(50)";
  $database->create_table($_tmp_tabellename, $felder, "youtube_id");
  unset($felder);
}
/*
if(!in_array($_tmp_tabellename.'_tags', $check_table)) {
$tagstab=null;
$tagstab["youtube_id"]="VARCHAR(50)";
$tagstab["tag"]="VARCHAR(255)";
$database->create_table($_tmp_tabellename.'_tags', $tagstab, "youtube_id, tag");
}
*/

$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  
  $client = new OAuth2\Client($OAUTH2_CLIENT_ID, $OAUTH2_CLIENT_SECRET);
  $params = array('part' => "snippet");
  $client->setAccessToken($tmp_token['access_token']);
  $client->setAccessTokenType(1); //ACCESS_TOKEN_BEARER
  //auditDetails - Keine Berechtigung!
  // topicDetails
  // status
  $part="id, brandingSettings, contentDetails, contentOwnerDetails, snippet, statistics";
  //$params = array('part' => $part, 'id'=> "rdoyNKvhSOM");
  $params = array('part' => $part, 'mine'=> "true");
  $response = $client->fetch('https://www.googleapis.com/youtube/v3/channels', $params);
  $tmp_channel_details=$response['result']['items'][0];
  
  unset($tmp_channel_details['kind']);
  unset($tmp_channel_details['etag']);
  unset($tmp_channel_details['snippet']['thumbnails']['medium']);
  unset($tmp_channel_details['snippet']['thumbnails']['high']);
  unset($tmp_channel_details['snippet']['thumbnails']['standard']);
  unset($tmp_channel_details['snippet']['thumbnails']['maxres']);
  unset($tmp_channel_details['snippet']['localized']);
  unset($tmp_channel_details['brandingSettings']['channel']['title']);
  unset($tmp_channel_details['brandingSettings']['channel']['description']);
  unset($tmp_channel_details['brandingSettings']['channel']['featuredChannelsTitle']);
  unset($tmp_channel_details['brandingSettings']['channel']['featuredChannelsUrls']); // ?
  unset($tmp_channel_details['brandingSettings']['image']['bannerMobileImageUrl']);
  unset($tmp_channel_details['brandingSettings']['image']['bannerTabletLowImageUrl']);
  unset($tmp_channel_details['brandingSettings']['image']['bannerTabletImageUrl']);
  unset($tmp_channel_details['brandingSettings']['image']['bannerTabletHdImageUrl']);
  unset($tmp_channel_details['brandingSettings']['image']['bannerTabletExtraHdImageUrl']);
  unset($tmp_channel_details['brandingSettings']['image']['bannerMobileLowImageUrl']);
  unset($tmp_channel_details['brandingSettings']['image']['bannerMobileMediumHdImageUrl']);
  unset($tmp_channel_details['brandingSettings']['image']['bannerMobileHdImageUrl']);
  unset($tmp_channel_details['brandingSettings']['image']['bannerMobileExtraHdImageUrl']);
  unset($tmp_channel_details['brandingSettings']['image']['bannerTvImageUrl']);
  unset($tmp_channel_details['brandingSettings']['image']['bannerTvLowImageUrl']);
  unset($tmp_channel_details['brandingSettings']['image']['bannerTvMediumImageUrl']);
  unset($tmp_channel_details['brandingSettings']['image']['bannerTvHighImageUrl']);
  unset($tmp_channel_details['brandingSettings']['hints']);
  
  $tmp_channel_details=$SYTHS->multiarray2array($tmp_channel_details, "youtube");
  debug_log($tmp_channel_details);
  
  foreach ($tmp_channel_details as $key=>$value){
    $new_feld[$key]="TEXT";
    $database->add_columns($_tmp_tabellename, $new_feld);
    unset($new_feld);
    $newData[$key]=$value;
  }
  $database->sql_insert_update($_tmp_tabellename, $newData);
  unset($newData);
  
  unset($tmp_channel_details);
  //echo 'Hello World!';
  die();
  $tt["cooldown"]=60*60;
}
// Save Token
echo date("d.m.Y - H:i:s")." - ".$tmp_token['channel_id'].': '.$_tmp_tabellename." updated!<br>";
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if (!isset($tt["token"])) {$tt["token"]="";}
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);
unset($tt);
?>
