<?php
$get_owner=$database->sql_select("bot_chathosts","*","host='".$this_msg['host']."'",true)[0]['owner'];
$owner_user=$database->sql_select("user","*","discord_user='".$get_owner."' or youtube_user='".$get_owner."' or twitch_user='".$get_owner."'",true)[0];

if (!isset($owner_user['bio'])) {
  $new_feld['bio']="TEXT";
  $database->add_columns("user", $new_feld);
  $owner_user['bio']="";
}
echo $owner_user['bio'];
?>
