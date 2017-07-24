<?php

// Benötigte Daten
require_once 'inc/php_inc.php';

$user=$database->sql_select("user","*","email='admin'", true); // TODO: Was besseres ausdenken für StandartUser;
if (isset($_GET['host'])) {
  $host=$database->sql_select("bot_chathosts","*","host='".$_GET['host']."'", true);
  if ($host[0]['owner']==$_GET['user'] || $_GET['user']=="-1") {
    $user=$database->sql_select("user","*","youtube_user='".$host[0]['owner']."' OR discord_user='".$host[0]['owner']."'", true);
  } else {
    // Joa darfst du vielleicht Videos Posten?
    $user_permission=false;
    $user_roles=$database->sql_select("bot_chatuser_roles","*","host='".$_GET['host']."' AND user='".$_GET['user']."'",true);
    for ($i=0;$i<count($user_roles);$i++) {
      $role=$database->sql_select("bot_chatroles","*","host='".$_GET['host']."' AND role='".$user_roles[$i]['role']."'",true);
      if ($role[0]['recht_own_videos']>0) {
        $user_permission=true;
      }
    }
    if ($user_permission==false) {
      $user=$database->sql_select("user","*","youtube_user='".$host[0]['owner']."' OR discord_user='".$host[0]['owner']."'", true);
    } else {
      $user=$database->sql_select("user","*","youtube_user='".$_GET['user']."' OR discord_user='".$_GET['user']."'", true);
    }
  }
}
$_SESSION['user']=$user[0];

// Do the Magic!
?>
