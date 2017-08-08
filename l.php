<?php

// Benötigte Daten
require_once 'inc/php_inc.php';
if (!isset($_GET['l'])) {
  $_GET['l']="";
}

$links=$database->sql_select("user_ads","*","md5(concat(owner,link))='".$_GET['l']."'", false);
//debug_log($links);
if (!isset($links[0])) {
  $links=$database->sql_select("user_ads","*","owner='admin' ORDER BY RAND()", false);
}
$link=$links[0];

//$url = "http://simpleyth.randompeople.de/l.php?l=".$link['hash'];
//md5(concat(owner,link)) AS hash

//die($link['link']);
header("HTTP/1.1 301 Moved Permanently");
header("Location: " . $link['link']);
?>
