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


if(in_array($_tmp_tabellename, $check_table)) {
  $db_stats = $database->sql_select("channels_contentdetails", "*", "channel_id='".$_SESSION['user']['youtube_user']."'", true);
  $uploadsListId=$db_stats[0]["uploads"];
}



// Cronjob

$_tmp_tabellename=strtolower("videos_snippet");
if (!isset($token[$_tmp_tabellename])) {
  $token[$_tmp_tabellename] = init_token($_tmp_tabellename);
}
$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  if ($uploadsListId!="") {
    // Youtube
    $req_count=50;
    if ($tt["token"] == "null") {
      $listResponse = $youtube->playlistItems->listPlaylistItems("snippet", array('playlistId' => $uploadsListId, "maxResults" => $req_count));
    } else {
      $listResponse = $youtube->playlistItems->listPlaylistItems("snippet", array('playlistId' => $uploadsListId, "maxResults" => $req_count, "pageToken" => $tt["token"]));
    }
    
    $data4sql= $listResponse["items"];
    $tt["token"]=$listResponse["nextPageToken"];
    
    // SQL
    $check_table=$database->show_tables();
    if(!in_array($_tmp_tabellename, $check_table)) {
      $felder=null;
      $felder["videoid"]="VARCHAR(50)";
      $felder["channelid"]="VARCHAR(50)";
      $felder["last_seen"]="TEXT";
      $database->create_table($_tmp_tabellename, $felder, "videoid");
      unset($felder);
    }
    $new_feld["first_seen"]="TEXT";
    $new_feld["last_statisticsupdate"]="TEXT";
    $new_feld["last_statusupdate"]="TEXT";
    $new_feld["last_liveStreamingDetailsupdate"]="TEXT";
    $new_feld["last_contentDetailsupdate"]="TEXT";
    
    $new_feld["ignore"]="TEXT";
    $database->add_columns($_tmp_tabellename, $new_feld);
    unset($new_feld);
    
    for($i=0;$i<count($data4sql);$i++) {
      $row4sql= $data4sql[$i]["snippet"];
      debug_log($row4sql);
      $tags4video= $row4sql["tags"];
      debug_log($tags4video);
      die();
      $json=json_encode($row4sql);
      $tmp_row4sql = json_decode($json, true);
      $tmp_row4sql["thumbnail"]= protected_settings( $row4sql["modelData"]["thumbnails"]["default"]["url"]);
      $tmp_row4sql["videoId"]= protected_settings( $row4sql["modelData"]["resourceId"]["videoId"]);
      $row4sql=null;
      $row4sql=$tmp_row4sql;
      
      unset($row4sql["channelTitle"]);
      unset($row4sql["playlistId"]);
      unset($row4sql["position"]);
      
      
      if(!in_array("videos_snippet_tags", $check_table)) {
        $tagstab=null;
        $tagstab["videoid"]="VARCHAR(50)";
        $tagstab["tag"]="VARCHAR(255)";
        $database->create_table("videos_snippet_tags", $tagstab, "videoid, tag");
      }
      unset($tagstab);
      $database->sql_delete("videos_snippet_tags", "videoid='".$row4sql["videoId"]."'");
      for($count_tags=0;$count_tags<count($tags4video);$count_tags++) {
        $tag_data=null;
        $tag_data['videoid']=$row4sql["videoId"];
        $tag_data['tag']=$tags4video[$count_tags];
        $database->sql_insert_update("videos_snippet_tags", $tag_data);
        unset($tag_data);
      }
      
      foreach ($row4sql as $key=>$value){
        $new_feld[$key]="TEXT";
        $database->add_columns($_tmp_tabellename, $new_feld);
        unset($new_feld);
        $newData[$key]=$value;
      }
      //$newData['first_seen']=strtotime($newData["publishedat"]); // Naja ist nicht wirklcih First_seen, aber ist besser so
      $newData["last_seen"]=time();
      $database->sql_insert_update($_tmp_tabellename, $newData);
      $old=$database->sql_select($_tmp_tabellename,"*","videoid='".$newData["videoId"]."'",true);
      $old[0]['first_seen']=strtotime($old[0]["publishedat"]);
      $database->sql_insert_update($_tmp_tabellename, $old[0]);
      unset($newData);
      unset($old);
    }
    $tt["cooldown"]=300;
  }
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
