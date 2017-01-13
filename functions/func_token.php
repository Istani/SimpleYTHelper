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

function session_to_database($database, $data4sql) {
  $return_id=0;
  if (isset($data4sql['token'])) {
    $data4sql=$data4sql['token'];
  }
  // Auth Tabelle Anlegen!
  $_tmp_tabellename="authtoken";
  $check_table=$database->show_tables();
  if(!in_array($_tmp_tabellename, $check_table)) {
    $felder=null;
    $felder["id"]="INT(20) NOT NULL AUTO_INCREMENT";
    $felder["last_seen"]="INT(20)";
    $felder["last_cronjob"]="INT(20)";
    $database->create_table($_tmp_tabellename, $felder, "id");
    unset($felder);
  }
  $database->sql_select($_tmp_tabellename, "*", "id='-1' LIMIT 1", true);
  foreach ($data4sql as $key=>$value){
    $new_feld[$key]="TEXT";
    $database->add_columns($_tmp_tabellename, $new_feld);
    unset($new_feld);
    $newData[$key]=$value;
  }
  $check_token=$database->sql_select($_tmp_tabellename, "*", "access_token='".$data4sql['access_token']."'", true);
  if (isset($data4sql['id'])) {
    $check_token[0]['id']=$data4sql['id'];
  }
  if (($check_token[0]['id']>0)) {
    $newData["id"]=$check_token[0]['id'];
  } else {
    $_GET['site']="Cronjob_Channels";
  }
  $newData["last_seen"]=time();
  $database->sql_insert_update($_tmp_tabellename, $newData);
  $check_token=$database->sql_select($_tmp_tabellename, "*", "access_token='".$data4sql['access_token']."'", true);
  
  $return_id=$check_token[0]['id'];
  
  return $return_id;
}

?>
