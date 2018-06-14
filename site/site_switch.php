<?php
// Switch include
if (!isset($_GET['site'])) {
  $_GET['site']="index";
}
switch ($_GET['site']) {
  case 'info':
  include("site/info.php");
  break;
  case 'debug':
  include("site/debug.php");
  break;
  // Google Auth
  case 'New_Google_Auth':
  include("inc/google_connect.php");
  include("site/auth_google.php");
  break;
  case 'Google_Auth':
  include("inc/google_connect.php");
  ob_start();
  include("cronjob/youtube_channels.php");
  ob_end_clean();
  include("site/yt_channels.php");
  break;
  // Discord Auth
  case 'New_Discord_Auth':
  include("inc/discord_connect.php");
  include("site/auth_discord.php");
  break;
  case 'Discord_Auth':
  include("inc/discord_connect.php");
  break;
  // Twitch auth
  case 'New_Twitch_Auth':
  include("inc/twitch_connect.php");
  include("site/auth_twitch.php");
  break;
  case 'Twitch_Auth':
  include("inc/twitch_connect.php");
  break;
  // Streamlabs auth
  case 'New_Streamlabs_Auth':
  include("inc/streamlabs_connect.php");
  include("site/auth_streamlabs.php");
  break;
  case 'Streamlabs_Auth':
  include("inc/streamlabs_connect.php");
  break;
  // Sites
  case 'my_accounts':
  include("site/my_accounts.php");
  break;
  case 'my_chats':
  include("site/my_chats.php");
  break;
  case 'my_equip':
  include("site/my_equip.php");
  break;
  case 'my_ads':
  include("site/my_ads.php");
  break;
  case 'my_link':
  include("site/my_link.php");
  break;
  
  case 'my_votes':
  include("site/create_votes.php");
  break;
  
  case 'youtube_videos':
  include("site/youtube_videos.php");
  break;
  
  case 'yt_channels':
  include("site/yt_channels.php");
  break;
  default:
  echo "Error";
  break;
}
?>
