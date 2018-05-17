<?php
$get_owner=$database->sql_select("bot_chathosts","*","host='".$this_msg['host']."'",true)[0]['owner'];
$owner_user=$database->sql_select("user","*","discord_user='".$get_owner."' or youtube_user='".$get_owner."' or twitch_user='".$get_owner."'",true)[0];
$get_discord_link=$database->sql_Select("user_ads","*","type='Link' AND title LIKE 'Merch' AND link NOT LIKE '' AND owner='".$owner_user['email']."'",true)[0];
if ($get_discord_link['link']!="") {
  echo $get_discord_link['title'].': '.$get_discord_link['link'];
  $get_discord_link['count']++;
  $database->sql_insert_update("user_ads", $get_discord_link);
}
?>
