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
  $felder["youtube_id"]="VARCHAR(255)";
  $database->create_table($_tmp_tabellename, $felder, "youtube_id");
  unset($felder);
}

$check_table=$database->show_tables();
if(!in_array($_tmp_tabellename."_items", $check_table)) {
  $felder=null;
  $felder["youtube_snippet_playlistId"]="VARCHAR(255)";
  $felder["youtube_snippet_position"]="VARCHAR(255)";
  $database->create_table($_tmp_tabellename."_items", $felder, "youtube_snippet_playlistId, youtube_snippet_position");
  unset($felder);
}


$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  $req_max=50;
  $client = new OAuth2\Client($OAUTH2_CLIENT_ID, $OAUTH2_CLIENT_SECRET);
  $client->setAccessToken($tmp_token['access_token']);
  $client->setAccessTokenType(1); //ACCESS_TOKEN_BEARER
  
  $part="id, contentDetails, snippet, status";
  //$params = array('part' => $part, 'id'=> "rdoyNKvhSOM");
  if($tt['token']=="Upload") {
    $db_stats = $database->sql_select("youtube_channels", "*", "youtube_id='".$_SESSION['user']['youtube_user']."'", true);
    $uploadsListId=$db_stats[0]["youtube_contentdetails_relatedplaylists_uploads"];
    $params = array('part' => $part, 'id'=> $uploadsListId, 'maxResults'=>$req_max);
  } elseif ($tt['token']!="" && $tt['token']!=null && $tt['token']!='null') {
    $params = array('part' => $part, 'mine'=> "true", 'maxResults'=>$req_max, 'pageToken'=>$tt['token']);
  } else {
    $params = array('part' => $part, 'mine'=> "true", 'maxResults'=>$req_max);
  }
  $response = $client->fetch('https://www.googleapis.com/youtube/v3/playlists', $params);
  if (isset($response['result']['nextPageToken'])) {
    $tt["token"]=$response['result']['nextPageToken'];
  } elseif($tt['token']=="Upload") {
    $tt['token']="";
  } else {
    $tt["token"]="Upload";
  }
  
  if (isset($response['result']['items'])) {
    $playlists_max=count($response['result']['items']);
    for ($cnt_playlist=0;$cnt_playlist<$playlists_max;$cnt_playlist++) {
      $tmp_details=$response['result']['items'][$cnt_playlist];
      
      unset($tmp_details['kind']);
      unset($tmp_details['etag']);
      unset($tmp_details['snippet']['thumbnails']['medium']);
      unset($tmp_details['snippet']['thumbnails']['high']);
      unset($tmp_details['snippet']['thumbnails']['standard']);
      unset($tmp_details['snippet']['thumbnails']['maxres']);
      unset($tmp_details['snippet']['channelTitle']);
      unset($tmp_details['snippet']['localized']);
      $tmp_details=$SYTHS->multiarray2array($tmp_details, "youtube");
      
      // Load "old" Playlist for Paging
      $old_playlist=$database->sql_select($_tmp_tabellename,"*","youtube_id='".$tmp_details["youtube_id"]."'",true);
      if (!isset($old_playlist[0]['import_pagetoken'])) {
        $old_playlist[0]['import_pagetoken']="";
      }
      $old_playlist=$old_playlist[0];
      
      $part2="snippet";
      if ($old_playlist['import_pagetoken']!="" && $old_playlist['import_pagetoken']!=null) {
        $params2 = array('part' => $part2, 'playlistId'=> $tmp_details["youtube_id"], 'maxResults'=>$req_max, 'pageToken'=>$old_playlist['import_pagetoken']);
      } else {
        $params2 = array('part' => $part2, 'playlistId'=> $tmp_details["youtube_id"], 'maxResults'=>$req_max);
      }
      $response2 = $client->fetch('https://www.googleapis.com/youtube/v3/playlistItems', $params2);
      if (isset($response2['result']['nextPageToken'])) {
        $tmp_details['import_pagetoken']=$response2['result']['nextPageToken'];
      } else {
        $tmp_details['import_pagetoken']="";
      }
      
      
      $playlistsitems_max=count($response2['result']['items']);
      for ($cnt_playlistitems=0;$cnt_playlistitems<$playlistsitems_max;$cnt_playlistitems++) {
        $tmp_items=$response2['result']['items'][$cnt_playlistitems];
        
        unset($tmp_items['id']);
        unset($tmp_items['kind']);
        unset($tmp_items['etag']);
        unset($tmp_items['snippet']['thumbnails']);
        unset($tmp_items['snippet']['channelTitle']);
        unset($tmp_items['snippet']['localized']);
        unset($tmp_items['snippet']['publishedAt']);
        unset($tmp_items['snippet']['channelId']);
        unset($tmp_items['snippet']['title']);
        unset($tmp_items['snippet']['description']);
        unset($tmp_items['snippet']['resourceId']['kind']);
        
        $tmp_items=$SYTHS->multiarray2array($tmp_items, "youtube");
        
        foreach ($tmp_items as $key=>$value){
          $new_feld[$key]="TEXT";
          $database->add_columns($_tmp_tabellename."_items", $new_feld);
          unset($new_feld);
          $newData[$key]=$value;
        }
        $database->sql_insert_update($_tmp_tabellename."_items", $newData);
        unset($newData);
        debug_log($tmp_items);
      }
      
      foreach ($tmp_details as $key=>$value){
        $new_feld[$key]="TEXT";
        $database->add_columns($_tmp_tabellename, $new_feld);
        unset($new_feld);
        $newData[$key]=$value;
      }
      $database->sql_insert_update($_tmp_tabellename, $newData);
      unset($newData);
      debug_log($tmp_details);
    }
  }
  $tt["cooldown"]=60*5;
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
