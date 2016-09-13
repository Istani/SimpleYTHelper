<?php

function save_accesstoken($kanal, $token) {
    $file = "token/" . $kanal . ".access";
    $myfile = fopen($file, "w+") or die("Unable to set access token!");
    fwrite($myfile, json_encode($token));
    fclose($myfile);
}

function load_accesstoken($kanal) {
    $file = "token/" . $kanal . ".access";
    if (filesize($file) > 0) {
        $myfile = fopen($file, "r") or die("Unable to get access token!");
        $token = json_decode(fread($myfile, filesize($file)));
        fclose($myfile);
    } else {
        $token = "null";
    }
    //echo $token;
    return $token;
}

function save_refreshtoken($kanal, $token) {
    $file = "token/" . $kanal . ".refresh";
    $myfile = fopen($file, "w+") or die("Unable to set refresh token!");
    fwrite($myfile, $token);
    fclose($myfile);
}

function load_refreshtoken($kanal) {
    $file = "token/" . $kanal . ".refresh";
    if (filesize($file) > 0) {
        $myfile = fopen($file, "r") or die("Unable to get refresh token!");
        $token = fread($myfile, filesize($file));
        fclose($myfile);
    } else {
        $token = "null";
    }
    return $token;
}

?>