<?php
// Switch include
if (!isset($_GET['site'])) {
  $_GET['site']="index";
}
switch ($_GET['site']) {
  case 'info':
  include("site/info.php");
  break;
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
  case 'my_accounts':
  include("site/my_accounts.php");
  break;
  case 'yt_channels':
  include("site/yt_channels.php");
  break;
  default:
  echo "Error";
  break;
}
?>
