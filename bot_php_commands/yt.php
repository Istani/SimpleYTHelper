<?php
$get_owner=$database->sql_select("bot_chathosts","*","host='".$this_msg['host']."'",true)[0]['owner'];
$owner_user=$database->sql_select("user","*","twitch_user='".$get_owner."' or discord_user='".$get_owner."' or youtube_user='".$get_owner."'",true)[0];

// Check for Own Video Right
$own_video=false;
for ($count_right=0; $count_right<count($this_user['roles']);$count_right++) {
  $this_role=$this_user['roles'][$count_right];
  if ($this_role['recht_own_videos']==1) {
    $own_video=true;
  }
}
if ($own_video) {
  $msg_user=$database->sql_select("user","*","twitch_user='".$this_msg['user']."' or discord_user='".$this_msg['user']."' or youtube_user='".$this_msg['user']."'",true)[0];
  if ($msg_user['youtube_user']!="") {
    $service_user=$msg_user['youtube_user'];
  } else {
    $service_user=$owner_user['youtube_user'];
  }
} else {
  $service_user=$owner_user['youtube_user'];
}
$user_channel=$database->sql_select("youtube_channels","*","youtube_id='".$service_user."'",true)[0];
$check_table=$database->show_tables();

if (!isset($this_msg['message_parts'][1])) {
  $this_msg['message_parts'][1]="";
}

/* Auswertung */
switch ($this_msg['message_parts'][1]) {
  
  
  case 'livestream':
  $data=$database->sql_select("youtube_livestream", "*", "youtube_snippet_channelid='".$service_user."' AND (youtube_snippet_actualendtime IS NULL OR youtube_snippet_actualendtime='') ORDER BY youtube_snippet_actualstarttime DESC LIMIT 1",false);
  if (count($data)>0) {
    // Yeah twitch_livestream
    echo "http://gaming.youtube.com/channel/".$service_user."/live";
  } else {
    echo "Kein Livestream gefunden!";
  }
  break;
  
  
  case 'lastsub':
  case 'randomsub':
  $subcount = $user_channel['youtube_statistics_subscribercount'];
  $subname = "Nobody";
  $_tmp_tabellename=strtolower("youtube_subscriber");
  if(in_array($_tmp_tabellename, $check_table)) {
    if ($this_msg['message_parts'][1]=="lastsub") {
      $db_subs = $database->sql_select($_tmp_tabellename, "*", "youtube_channelid='".$service_user."' ORDER BY youtube_snippet_publishedat DESC LIMIT 1",true);
    } else {
      $db_subs = $database->sql_select($_tmp_tabellename, "*", "youtube_channelid='".$service_user."' ORDER BY RAND() LIMIT 1",true);
    }
    $subname=$db_subs[0]["youtube_subscribersnippet_title"];
  }
  echo "#" . $subcount . " - " . $subname;
  break;
  
  
  case 'lastvideo':
  case 'video':
  if (!isset($this_msg['message_parts'][2]) || $this_msg['message_parts'][1]='lastvideo') {
    $this_msg['message_parts'][2]="";
  }
  $vidtitle = "Kein Video gefunden!";
  $vidlink = "";
  $_tmp_tabellename="youtube_videos";
  if(in_array($_tmp_tabellename, $check_table)) {
    if ($this_msg['message_parts'][2]=="") {
      $db_stats = $database->sql_select($_tmp_tabellename, "*", "youtube_status_privacystatus ='public' AND youtube_status_uploadstatus LIKE 'processed' AND youtube_snippet_channelid='".$service_user."' ORDER BY simple_publishtimestamp DESC LIMIT 1", false);
    } else {
      $db_stats = $database->sql_select($_tmp_tabellename, "*", "youtube_id='".$this_msg['message_parts'][2]."' ORDER BY youtube_snippet_publishedat DESC LIMIT 1", false);
    }
    if (isset($db_stats[0])) {
      $vidtitle=$db_stats[0]["youtube_snippet_title"];
      $vidlink="https://www.youtube.com/watch?v=".$db_stats[0]["youtube_id"];
    }
  }
  echo $vidtitle . "<br>" . $vidlink;
  break;
  
  
  case 'sponsors':
  $_tmp_tabellename=strtolower("youtube_sponsors");
  if(in_array($_tmp_tabellename, $check_table)) {
    $db_subs = $database->sql_select($_tmp_tabellename, "*", "youtube_snippet_channelid='".$service_user."'ORDER BY youtube_snippet_sponsorsince",false);
    if (count($db_subs)==0) {
      echo "Kein VIP gefunden!";
    }
    for ($cnt_sponsors=0;$cnt_sponsors<count($db_subs);$cnt_sponsors++) {
      echo $db_subs[$cnt_sponsors]["youtube_snippet_sponsordetails_displayname"]." seit: ".$db_subs[$cnt_sponsors]["youtube_snippet_sponsorsince"]."<br>";
    }
  } else {
    echo "Kein VIP gefunden!";
  }
  break;
  
  
  case 'community':
  $_tmp_tabellename=strtolower("youtube_communitytab");
  if(in_array($_tmp_tabellename, $check_table)) {
    $yt_com = $database->sql_select($_tmp_tabellename,"*","youtube_link LIKE 'https://www.youtube.com/channel/".$_SESSION['user']['youtube_user']."%' ORDER BY last_update DESC LIMIT 1",false);
    if (count($yt_com)==0) {
      echo "Kein Community Tab eintrag gefunden!";
    } else {
      $output_text=$yt_com[0]['youtube_text'];
      $output_link=$yt_com[0]['youtube_link'];
      while (strlen($output_text."<br>".$output_link)>200) {
        $parts=explode(" ", $output_text);
        unset($parts[count($parts)-1]);
        $output_text=implode(" ",$parts);
        $output_text.="...";
      }
      echo $output_text."<br>".$output_link;
    }
  } else {
    echo "Kein Community Tab eintrag gefunden!";
  }
  break;
  
  
  default:
  echo "Befehl: ".$this_msg['message_parts'][1];
  echo "<br>Nicht gefunden!";
  break;
}
?>
