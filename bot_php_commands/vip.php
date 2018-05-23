<?php
$get_owner=$database->sql_select("bot_chathosts","*","host='".$this_msg['host']."'",true)[0]['owner'];
$owner_user=$database->sql_select("user","*","discord_user='".$get_owner."' or youtube_user='".$get_owner."' or twitch_user='".$get_owner."'",true)[0];
if ($owner_user['youtube_user']!="") {
  echo "https://gaming.youtube.com/channel/".$owner_user['youtube_user']."#action=sponsor<br>";
}

?>
