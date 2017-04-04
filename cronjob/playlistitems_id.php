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
$tt=$token[$_tmp_tabellename];
if ($tt["last_used"]+$tt["cooldown"]<time()) {
  $check_table=$database->show_tables();
  if(!in_array($_tmp_tabellename, $check_table)) {
    $felder=null;
    $felder["playlistid"]="VARCHAR(50)";
    $felder["videoid"]="VARCHAR(50)";
    $database->create_table($_tmp_tabellename, $felder, "playlistid, videoid");
    unset($felder);
  }
  
  // Do Magic
  $req_count=50;
  $listRequests = $database->sql_select("playlists_snippet","*", "`channelid`='".$_SESSION['user']['youtube_user']."' AND `ignore`=0 ORDER BY last_cronjob LIMIT 1", false);
  $data4sql= $listRequests;
  $tt["token"]="null";
  
  for($i=0;$i<count($data4sql);$i++) {
    if ($data4sql[$i]['last_token']!="") {
      $listResponse = $youtube->playlistItems->listPlaylistItems('snippet', array(
        'playlistId' => $data4sql[$i]['paylistid'],
        'maxResults' => $req_count
      ));
    } else {
      $listResponse = $youtube->playlistItems->listPlaylistItems('snippet', array(
        'playlistId' => $data4sql[$i]['paylistid'],
        'maxResults' => $req_count,
        'pageToken' => $data4sql[$i]['last_token']
      ));
    }
    
    $rows4sql=$listResponse["items"];
    $data4sql[$i]['last_token']=$listResponse["nextPageToken"];
    $data4sql[$i]['last_cronjob']=time();
    $database->sql_insert_update("playlists_snippet", $data4sql[$i]);
    for($j=0;$j<count($rows4sql);$j++) {
      $row4sql=$rows4sql[$j]['snippet'];
      $newData=null;
      $newData['playlistid']=$row4sql['playlistId'];
      $newData['videoid']=$row4sql['resourceId']['videoId'];
      $newData['position']=$row4sql['position'];
      
      foreach ($newData as $key=>$value){
        $new_feld=null;
        $new_feld[$key]="TEXT";
        $database->add_columns($_tmp_tabellename, $new_feld);
        unset($new_feld);
      }
      
      $database->sql_insert_update($_tmp_tabellename, $newData);
      unset($newData);
    }
  }
  //End Magic
  $tt["cooldown"]=300;
}
// Save Token
echo date("d.m.Y - H:i:s")." - ".$tmp_token['channel_id'].': '.$_tmp_tabellename." updated!<br>";
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);
unset($tt);
?>
