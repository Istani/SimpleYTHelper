<?php

// Benötigte Daten
require_once 'inc/php_inc.php';
if (!isset($_GET['l'])) {
  $_GET['l']="";
}
$_tmp_tabellename="user_ads";

$check_table=$database->show_tables();
if(!in_array($_tmp_tabellename, $check_table)) {
  $felder=null;
  $felder["owner"]="VARCHAR(255)";
  $felder["type"]="VARCHAR(255)";
  $felder["title"]="VARCHAR(255)";
  $felder["link"]="VARCHAR(255)";
  $felder["count"]="INT";
  $database->create_table($_tmp_tabellename, $felder, "owner, link");
  unset($felder);
}

if (isset($newCols)) {
  unset($newCols);
}
$newCols['isPremium']="INT DEFAULT 0";
$newCols['premCount']="INT DEFAULT -1";
$newCols['total_text']="INT DEFAULT 0";
$newCols['total_clicks']="INT DEFAULT 0";
$database->add_columns($_tmp_tabellename, $newCols);
unset($newCols);

$links=$database->sql_select($_tmp_tabellename,"*","md5(concat(owner,link))='".$_GET['l']."'", false);
//debug_log($links);
if (!isset($links[0])) {
  $links=$database->sql_select($_tmp_tabellename,"*","owner='admin' ORDER BY RAND()", false);  // TODO: Auf SimpleYTH ändern
}
$link=$links[0];

//$url = "http://simpleyth.randompeople.de/l.php?l=".$link['hash'];
//md5(concat(owner,link)) AS hash

//die($link['link']);
header("HTTP/1.1 301 Moved Permanently");
header("Location: " . $link['link']);
?>
