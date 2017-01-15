<?php
// Switch include
if (!isset($_GET['site'])) {
  $_GET['site']="index";
}
switch ($_GET['site']) {
  case 'info':
    include("site/info.php");
    break;
  case 'Cronjob_Channels':
    include("cronjob/load_channels.php");
    break;
  default:
    echo "Error";
    break;  
  }
?>
