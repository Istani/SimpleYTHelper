<?php

// Benötigte Daten
require_once 'inc/php_inc.php';
// http://127.0.0.1/SimpleYTH/rpg_hud.php?game=21232f297a57a5a743894a0e4a801fc3

if (!isset($_GET['game'])) {
  $_GET['game']="";
}
$user=$database->sql_select("user","*","MD5(email)='".$_GET['game']."'", false); // TODO: Was besseres ausdenken für StandartUser;
if (isset($user[0]['email'])) {
  $_SESSION['user']=$user[0];
} else {
  die('ERROR');
}

// Do the Magic!
echo md5('admin');


unset($_SESSION);
?>
