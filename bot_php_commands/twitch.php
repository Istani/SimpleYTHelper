<?php
/*
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
if ($msg_user['twitch_user']!="") {
$twitch_user=$msg_user['twitch_user'];
} else {
$twitch_user=$owner_user['twitch_user'];
}
} else {
$twitch_user=$owner_user['twitch_user'];
}
$twitch_user=$database->sql_select("twitch_channels","*","twitch_id='".$twitch_user."'",true)[0];

switch ($this_msg['message_parts'][1]) {
case 'livestream':
$twitch_livestreams=$database->sql_select("twitch_livestream","*","twitch_user_id='".$twitch_user['twitch_id']."' LIMIT 1", true);
if ($twitch_livestreams[0]['twitch_id']!='') {
// Yeah twitch_livestream
echo "https://www.twitch.tv/".$twitch_user['twitch_display_name'];
} else {
echo "Kein Livestream gefunden!";
}
break;
default:
echo "Befehl: ".$this_msg['message_parts'][1];
echo "<br>Nicht gefunden!";
break;
}
*/
?>
