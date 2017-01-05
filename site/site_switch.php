<?php
// Switch include
if (!isset($_GET['site'])) {
  $_GET['site']="index";
}
switch ($_GET['site']) {
  case 'info':
  include("site/info.php");
  break;
  default:
  echo "Error";
}
?>
