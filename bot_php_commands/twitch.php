<?php
$get_owner=$database->sql_select("bot_chathosts","*","host='".$this_msg['host']."'",true)[0]['owner'];
$owner_user=$database->sql_select("user","*","twitch_user='".$get_owner."' ordiscord_user='".$get_owner."' or youtube_user='".$get_owner."'",true)[0];

// Check for Own Video Right
$own_video=false;
for ($count_right=0; $count_right<count($this_user['roles']);$count_right++) {
  $this_role=$this_user['roles'][$count_right];
  if ($this_role['recht_own_videos']==1) {
    $own_video=true;
  }
}
if ($own_video) {
  $twitch_user=$this_user['twitch_user'];
} else {
  $twitch_user=$owner_user['twitch_user'];
}
$twitch_user=$database->sql_select("twitch_channels","*","twitch_id='".$twitch_user."'");

switch ($this_msg['message_parts'][1]) {
  case 'livestream':
  $twitch_livestreams=$database->sql_select("twitch_livestream","*","twitch_user_id='".$twitch_user['twitch_id']."' LIMIT 1", true);
  if ($twitch_livestreams[0]['twitch_id']!='') {
    // Yeah twitch_livestream
    echo "https://www.twitch.tv/".$twitch_user['twitch_display_name'];
  }
  break;
}

?>
