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
  include("cronjob/channel_token.php");
  include("cronjob/channels_statistics.php");
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
  // Sites
  case 'my_accounts':
  include("site/my_accounts.php");
  break;
  case 'my_chats':
  include("site/my_chats.php");
  break;
  case 'my_equip':
  include("site\my_equip.php");
  break;
  case 'my_ads':
  include("site\my_ads.php");
  break;
  case 'my_link':
  include("site\my_link.php");
  break;
  
  case 'yt_channels':
  include("site/yt_channels.php");
  break;
  default:
  echo "Error";
  break;
}
?>
