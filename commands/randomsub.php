<?php

// Getting Random SUB Name
// incs
require 'inc/php_inc.php';

if (!file_exists("data/" . $KANALID . ".subs")) {
    $tmp = fopen("data/" . $KANALID . ".subs", "w+");
    fclose($tmp);
}
$file = "data/" . $KANALID . ".subs";
$myfile = fopen($file, "r+") or die("Unable to load SubData!");
$file_subs = fread($myfile, filesize($file));
fclose($myfile);
$arr_subs = explode("|#*#|", $file_subs);

shuffle($arr_subs);
echo $arr_subs[0];
?>