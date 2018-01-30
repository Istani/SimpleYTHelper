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

if(!in_array($_tmp_tabellename.'_tags', $check_table)) {
  $tagstab=null;
  $tagstab["youtube_id"]="VARCHAR(50)";
  $tagstab["tag"]="VARCHAR(255)";
  $database->create_table($_tmp_tabellename.'_tags', $tagstab, "youtube_id, tag");
}

$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  
  $max_req=50;
  
  $sql_from="";
  $sql_from.="(youtube_playlists INNER JOIN youtube_playlists_items ON ";
  $sql_from.="youtube_playlists.youtube_id = youtube_playlists_items.youtube_snippet_playlistid) ";
  $sql_from.="LEFT JOIN youtube_videos ON youtube_playlists_items.youtube_snippet_resourceid_videoid = youtube_videos.youtube_id";
  $sql_select="youtube_playlists_items.youtube_snippet_resourceid_videoid";
  $sql_where="";
  $sql_where.="youtube_playlists.youtube_snippet_channelid='".$_SESSION['user']['youtube_user']."' AND ";
  $sql_where.="youtube_videos.youtube_id IS NULL";
  $sql_group=$sql_where." GROUP BY youtube_playlists_items.youtube_snippet_resourceid_videoid";
  $sql_order=$sql_group." ORDER BY youtube_playlists.youtube_snippet_publishedat DESC";
  $sql_limit=$sql_where." LIMIT 20 ";
  $sql_where=$sql_limit;
  
  $update_temp=$database->sql_select($sql_from, $sql_select,$sql_where, false);
  
  $max_temp=count($update_temp);
  for ($cnt_temp=0;$cnt_temp<$max_temp;$cnt_temp++) {
    $update_list[]=$update_temp[$cnt_temp]['youtube_snippet_resourceid_videoid'];
  }
  unset($update_temp);
  
  $sql_from="youtube_videos";
  $sql_select="youtube_videos.youtube_id";
  $sql_where="";
  $sql_where.="youtube_snippet_channelid LIKE '".$_SESSION['user']['youtube_user']."' AND youtube_status_privacystatus LIKE 'unlisted' ";
  $sql_group=$sql_where."";
  $sql_order=$sql_group." ORDER BY simple_lastupdate ASC ";
  $sql_limit=$sql_order." LIMIT 30 ";
  $sql_where=$sql_limit;
  
  $update_temp=$database->sql_select($sql_from, $sql_select,$sql_where, false);
  $max_temp=count($update_temp);
  for ($cnt_temp=0;$cnt_temp<$max_temp;$cnt_temp++) {
    $update_list[]=$update_temp[$cnt_temp]['youtube_id'];
  }
  unset($update_temp);
  $count_updatelist=0;
  if (isset($update_list)) {
    $count_updatelist=count($update_list);
  }
  $sql_from="youtube_videos";
  $sql_select="youtube_videos.youtube_id";
  $sql_where="";
  $sql_where.="youtube_snippet_channelid LIKE '".$_SESSION['user']['youtube_user']."' AND youtube_status_privacystatus NOT LIKE 'unlisted' ";
  $sql_group=$sql_where."";
  $sql_order=$sql_group." ORDER BY simple_lastupdate";
  $sql_limit=$sql_order." LIMIT 10";
  $sql_where=$sql_limit;
  
  $update_temp=$database->sql_select($sql_from, $sql_select,$sql_where, false);
  $max_temp=count($update_temp);
  for ($cnt_temp=0;$cnt_temp<$max_temp;$cnt_temp++) {
    $update_list[]=$update_temp[$cnt_temp]['youtube_id'];
  }
  unset($update_temp);
  
  $client = new OAuth2\Client($OAUTH2_CLIENT_ID, $OAUTH2_CLIENT_SECRET);
  
  $client->setAccessToken($tmp_token['access_token']);
  $client->setAccessTokenType(1); //ACCESS_TOKEN_BEARER
  
  $count_updatelist=0;
  if (isset($update_list)) {
    $count_updatelist=count($update_list);
    debug_log($update_list);
  }
  for ($cnt_req=0;$cnt_req<$count_updatelist;$cnt_req++) {
    //contentDetails
    //player
    //topicDetails
    //fileDetails
    //processingDetails
    //suggestions
    //localizations
    $part="id, liveStreamingDetails, snippet, statistics, status";
    //$params = array('part' => $part, 'id'=> "rdoyNKvhSOM");
    $params = array('part' => $part, 'id'=> $update_list[$cnt_req]);
    $response = $client->fetch('https://www.googleapis.com/youtube/v3/videos', $params);
    
    
    if (isset($response['result']['items'][0])) {
      $tmp_video_tags=null;
      $tmp_video_details=$response['result']['items'][0];
      unset($tmp_video_details['kind']);
      unset($tmp_video_details['etag']);
      unset($tmp_video_details['snippet']['thumbnails']['medium']);
      unset($tmp_video_details['snippet']['thumbnails']['high']);
      unset($tmp_video_details['snippet']['thumbnails']['standard']);
      unset($tmp_video_details['snippet']['thumbnails']['maxres']);
      unset($tmp_video_details['snippet']['channelTitle']);
      if (isset($tmp_video_details['snippet']['tags'])) {
        $tmp_video_tags=$tmp_video_details['snippet']['tags'];
        unset($tmp_video_details['snippet']['tags']);
      }
      unset($tmp_video_details['snippet']['localized']);
      $tmp_video_details=$SYTHS->multiarray2array($tmp_video_details, "youtube");
      
      $tmp_video_details['simple_lastUpdate']=time();
      $tmp_video_details['simple_publishTimestamp']=strtotime($tmp_video_details['youtube_snippet_publishedAt']);
      
      debug_log($tmp_video_details);
      foreach ($tmp_video_details as $key=>$value){
        $new_feld[$key]="TEXT";
        $database->add_columns($_tmp_tabellename, $new_feld);
        unset($new_feld);
        $newData[$key]=$value;
      }
      $database->sql_insert_update($_tmp_tabellename, $newData);
      unset($newData);
      
      for($count_tags=0;$count_tags<count($tmp_video_tags);$count_tags++) {
        $tag_data=null;
        $tag_data['youtube_id']=$tmp_video_details["youtube_id"];
        $tag_data['tag']=$tmp_video_tags[$count_tags];
        $database->sql_insert_update($_tmp_tabellename.'_tags', $tag_data);
        unset($tag_data);
      }
      
      unset($tmp_video_details);
      unset($tmp_video_tags);
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
