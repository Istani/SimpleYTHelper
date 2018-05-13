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
  if (0) {
    // Get My Videos Since last Try?!?
    if ($tt["token"]=="null" or is_null($tt['token'])) {
      $tt['token']=0;
    }
    if (isset($video_list)) {
      unset($video_list);
    }
    $videos_yt=$database->sql_select("youtube_videos", "*",
    "youtube_snippet_channelid='".$_SESSION['user']['youtube_user']."'
    AND simple_publishtimestamp>".$tt['token']."
    AND youtube_status_uploadstatus LIKE 'processed'
    AND youtube_status_privacystatus LIKE 'public'
    ORDER BY simple_publishtimestamp
    LIMIT 1",true);
    
    for ($v=0;$v<count($videos_yt);$v++) {
      $tmp_newvideo['id']=$videos_yt[$v]["youtube_id"];
      $tmp_newvideo['link']="https://www.youtube.com/watch?v=".$videos_yt[$v]["youtube_id"];
      $tmp_newvideo['title']=$videos_yt[$v]["youtube_snippet_title"];
      $tmp_newvideo['description']=$videos_yt[$v]["youtube_snippet_description"];
      $tmp_newvideo['publishedat']=strtotime($videos_yt[$v]["youtube_snippet_publishedat"]);
      $tmp_newvideo['thumbnail']=$videos_yt[$v]['youtube_snippet_thumbnails_default_url'];
      $tmp_newvideo['thumbnail_data']=file_get_contents(str_replace("https","http",$tmp_newvideo['thumbnail']));
      
      $tmp_newvideo['tags']=array();
      $tmp_tags=$database->sql_select("youtube_videos_tags","tag","youtube_id LIKE '".$videos_yt[$v]["youtube_id"]."'");
      for ($t=0;$t<count($tmp_tags);$t++) {
        $tmp_newvideo['tags'][]=$tmp_tags[$t]["tag"];
      }
      
      $tmp_newvideo['playlists']=array();
      $tmp_lists=$database->sql_select("youtube_playlists_items INNER JOIN youtube_playlists ON youtube_playlists_items.youtube_snippet_playlistid=youtube_playlists.youtube_id","youtube_snippet_title","youtube_snippet_resourceid_videoid LIKE '".$videos_yt[$v]["youtube_id"]."'");
      for ($p=0;$p<count($tmp_lists);$p++) {
        $tmp_newvideo['playlists'][]=$tmp_lists[$p]["youtube_snippet_title"];
      }
      // Was braucht man noch?
      
      $video_list[]=$tmp_newvideo;
      unset($tmp_newvideo);
    }
    
    
    //    if (isset($video_list)) {
    //    for ($v=0;$v<count($video_list);$v++) {
    //    debug_log($video_list[$v]);
    //    echo '<br>';
    //  }
    //}
    
    
    $wpadress = "http://www.defender833.de/xmlrpc.php";
    $wpadress = "http://31.172.95.10/wordpress/xmlrpc.php";
    $wpadress = "http://127.0.0.1/Defender833/xmlrpc.php";
    
    $rpc = new IXR_Client($wpadress);
    $login = array(
      1,
      'defender833',
      'test'
    );
    /* Checking Thumb exists*/
    $thumb_id=0;
    if (1) {
      $need_upload=true;
      $result = $rpc->query('wp.getMediaLibrary',$login);
      if (!$result) {
        // Irgendeine Fehlermeldung!
        echo 'Error [' . $rpc->getErrorCode() . ']: ' . $rpc->getErrorMessage().'<br>';
      } else {
        $response=$rpc->getResponse();
        for($media_id=0;$media_id<count($response);$media_id++) {
          if ($response[$media_id]['title']=="thumb_".$video_list[0]['id'].".png") {
            $need_upload=false;
            break;
          }
        }
        if (!$need_upload) {
          // TODO: Get Media ID
          $thumb_id=$response[$media_id]["attachment_id"];
        } else {
          // Upload File!
          $data=array(
            'name' => "thumb_".$video_list[0]['id'].".png",
            'type' => "image/png",
            'bits' => new IXR_Base64($video_list[0]['thumbnail_data']),
            'overwrite' => true
          );
          $new_param=$login;
          $new_param[]=$data;
          $result = $rpc->query('wp.uploadFile',$new_param);
          if (!$result) {
            // Irgendeine Fehlermeldung!
            echo 'Error [' . $rpc->getErrorCode() . ']: ' . $rpc->getErrorMessage().'<br>';
          } else {
            $result=$response=$rpc->getResponse();
            $thumb_id=$result["attachment_id"];
          }
        }
      }
    }
    echo "File_ID: $thumb_id";
    
    /* Checking Tags/Kategorie */
    $kategorie_video=0;
    $kategorie_post=0;
    $kategorie_tags=0;
    $kategorie_format=0;
    if (1) {
      $result = $rpc->query('wp.getTaxonomies',$login);
      
      
      
      if (!$result) {
        echo 'Error [' . $rpc->getErrorCode() . ']: ' . $rpc->getErrorMessage().'<br>';
      } else {
        $respones=$rpc->getResponse();
        
        for ($tc=0;$tc<count($respones);$tc++) {
          $ttc=$respones[$tc];
          $TermsParam=$login;
          $TermsParam[]=$ttc['name'];
          $result2 = $rpc->query('wp.getTerms',$TermsParam);
          $respones2=$rpc->getResponse();
          debug_log($respones2);die();
          //$ttc['name']
          
          if ($ttc['label']=="Video Categories") {
            $kategorie_video=$ttc['name'];
          }
          if ($ttc['name']=="category") {
            $kategorie_post=$ttc['name'];
          }
          if ($ttc['name']=="post_tag") {
            $kategorie_tags=$ttc['name'];
          }
          if ($ttc['name']=="post_format") {
            $kategorie_format=$ttc['name'];
          }
          
        }
        debug_log($kategorie_video);
        debug_log($kategorie_post);
        debug_log($kategorie_tags);
        debug_log($kategorie_format);
      }
      die();
      $result = $rpc->query('system.listMethods');
      
      
      if ($result) {
        debug_log($rpc->getResponse());
      } else {
        echo 'Error [' . $rpc->getErrorCode() . ']: ' . $rpc->getErrorMessage().'<br>';
      }
      die();
      
    }
  }
}
// Save Token
echo date("d.m.Y - H:i:s")." - ".$_SESSION['user']['email'].': '.$cronjob_id." updated!<br>";
$tt["cooldown"]=60*5; // Test
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);
unset($tt);
//die();
?>
