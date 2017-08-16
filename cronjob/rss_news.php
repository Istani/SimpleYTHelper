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
  // DO magic
  $check_table=$database->show_tables();
  
  if(!in_array($_tmp_tabellename."_source", $check_table)) {
    $felder=null;
    $felder["service"]="VARCHAR(255)";
    $felder["host"]="VARCHAR(255)";
    $felder["src"]="VARCHAR(255)";
    $felder["last_post"]="INT(20)";
    $database->create_table($_tmp_tabellename."_source", $felder, "service, host, src_id");
    unset($felder);
  }
  
  if(!in_array($_tmp_tabellename, $check_table)) {
    $felder=null;
    $felder["source"]="TEXT";
    $felder["id"]="VARCHAR(255)";
    $felder["time"]="INT(20)";
    $felder["link"]="VARCHAR(255)";
    $felder["title"]="TEXT";
    $database->create_table($_tmp_tabellename, $felder, "link");
    unset($felder);
  }
  
  //$sites[]['link']="https://github.com/Istani/SimpleYTHelper/commits/master.atom";
  $sites=$database->sql_select($_tmp_tabellename."_source", "*", "true ORDER BY last_post", true);
  /*
  $sites[]['src']="https://www.factorio.com/blog/rss";
  $sites[]['src']="http://stadt-bremerhaven.de/feed";
  $sites[]['src']="https://twitrss.me/twitter_user_to_rss/?user=defender833";
  $sites[]['src']="https://games.ch/rss/news.xml";
  $sites[]['src']="http://www.gamestar.de/rss/gamestar.rss";
  $sites[]['src']="http://feeds.feedburner.com/ScsSoftwaresBlog?format=xml";
  $sites[]['src']="http://store.steampowered.com/feeds/news.xml";
  $sites[]['src']="http://www.itmagazine.ch/rss/news.xml";
  $sites[]['src']="https://www.heise.de/newsticker/heise-atom.xml";
  $sites[]['src']="http://www.inside-it.ch/frontend/insideit?_d=_rss&config=news";
  $sites[]['src']="https://steamcommunity.com/groups/CnCDe/rss/";
  */
  
  for ($count_feeds=0;$count_feeds<count($sites);$count_feeds++) {
    $this_site=$sites[$count_feeds];
    if (isset($new_Data)) {unset($new_Data);}
    if ($this_site['src']=="") {
      continue;
    }
    
    $xml=simplexml_load_file($this_site['src']);
    $new_Data['source']=$this_site['src'];
    $new_Data['time']=0;
    
    if ($this_site['src']=="") {
      debug_log($xml);
    }
    
    for ($count_entrys=0;$count_entrys<count($xml->entry);$count_entrys++){
      $this_entry=$xml->entry[$count_entrys];
      //echo var_dump($this_entry);
      $new_Data['id']=$xml->id;
      $new_Data['time']=strtotime($this_entry->updated);
      $new_Data['link']=$this_entry->id;
      $new_Data['title']=$this_entry->title;
      if ($new_Data['time']>0) {
        if ($this_site['last_post']<$new_Data['time']) {
          $this_site['last_post']=$new_Data['time'];
        }
        $database->sql_insert_update($_tmp_tabellename, $new_Data);
      }
    }
    
    for ($count_entrys=0;$count_entrys<count($xml->channel->item);$count_entrys++){
      $this_entry=$xml->channel->item[$count_entrys];
      //echo var_dump($this_entry);
      $new_Data['id']=$xml->channel->link;
      $new_Data['time']=strtotime($this_entry->pubDate);
      $new_Data['link']=$this_entry->link;
      $new_Data['title']=$this_entry->title;
      if ($new_Data['time']>0) {
        if ($this_site['last_post']<$new_Data['time']) {
          $this_site['last_post']=$new_Data['time'];
        }
        $database->sql_insert_update($_tmp_tabellename, $new_Data);
      }
    }
    
    for ($count_entrys=0;$count_entrys<count($xml->item);$count_entrys++){
      $this_entry=$xml->item[$count_entrys];
      //echo var_dump($this_entry);
      $new_Data['id']=$xml->channel->link;
      $new_Data['time']=strtotime($this_entry->pubDate);
      $new_Data['link']=$this_entry->link;
      $new_Data['title']=$this_entry->title;
      if ($new_Data['time']>0) {
        if ($this_site['last_post']<$new_Data['time']) {
          $this_site['last_post']=$new_Data['time'];
        }
        $database->sql_insert_update($_tmp_tabellename, $new_Data);
      }
    }
    
    $database->sql_insert_update($_tmp_tabellename."_source", $this_site);
    $hosts=$database->sql_select("bot_chathosts", "*", "service='".$this_site['service']."' AND host='".$this_site['host']."'", true);
    if ($hosts[0]['rss_post']<$this_site['last_post'] && $hosts[0]['channel_rss']!="") {
      $add_post['service']=$this_site['service'];
      $add_post['host']=$this_site['host'];
      $add_post['room']=$hosts[0]['channel_rss'];
      $add_post['id']=time();
      $add_post['time']=time();
      $add_post['user']="-1";
      $add_post['message']="!rss";
      $add_post['process']=0;
      $database->sql_insert_update("bot_chatlog", $add_post);
      unset($add_post);
    }
  }
  
  //$my_rechte=$SYTHS->may_post_videos_on($_SESSION['user']['email']);
  
  $tt["cooldown"]=300;
}
// Save Token
echo date("d.m.Y - H:i:s")." - ".$_SESSION['user']['email'].': '.$_tmp_tabellename." updated!<br>";
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if($tt["token"]==""){$tt["token"]="null";}
$database->sql_insert_update("bot_token",$tt);
unset($tt);
?>
