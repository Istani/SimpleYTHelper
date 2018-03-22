<?php
$get_owner=$database->sql_select("bot_chathosts","*","host='".$this_msg['host']."'",true)[0]['owner'];
$owner_user=$database->sql_select("user","*","discord_user='".$get_owner."' or youtube_user='".$get_owner."'",true)[0];
$get_discord_link=$database->sql_Select("user_ads","*","WHERE type='Link' AND title LIKE 'Discord' AND link NOT LIKE '' AND owner='".$owner_user['email']."'",true)[0];
echo $get_discord_link['title'].': '$get_discord_link['link'];
?>
