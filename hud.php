<?php

// Benötigte Daten
require_once 'inc/php_inc.php';
// http://127.0.0.1/SimpleYTH/hud.php?user=21232f297a57a5a743894a0e4a801fc3&info=yt_sponsors

if (!isset($_GET['user'])) {
  $_GET['user']="";
}
$user=$database->sql_select("user","*","MD5(email)='".$_GET['user']."'", false);
if (isset($user[0]['email'])) {
  $_SESSION['user']=$user[0];
} else {
  die('ERROR');
}

?>
<!doctype html>
<html>
<head>
  <title>SimpleYTH - HUD</title>
  <?php require_once 'inc/html_inc.php'; ?>
  <style type="text/css">
  * {
    text-shadow:
    1px 1px 0 rgba(0,0,0,1),
    1px -1px 0 rgba(0,0,0,1),
    -1px 1px 0 rgba(0,0,0,1),
    -1px -1px 0 rgba(0,0,0,1);
    
    font-weight:normal;
    color:#FFFFFF;
    letter-spacing:1pt;
    word-spacing:2pt;
    font-size:12px;
    font-family:arial black, sans-serif;
    line-height:1;
  }
  .hud_username {
    color: #D84759;
  }
  .hud_special {
    color: #46e65a;
  }
  </style>
  
</head>
<body>
  <?php
  $_SESSION['hud']=true;
  if (!isset($_GET['info'])) {
    $_GET['info']="";
  }
  switch ($_GET['info']) {
    case 'yt_sponsors':
    echo '<div>';
    echo '<center><p>VIPs:</p></center>';
    $this_msg['user']=$_SESSION['user']['youtube_user'];
    $this_msg['message_parts'][1]="sponsors";
    $this_msg['host']=$database->sql_select("bot_chathosts","*","owner='".$_SESSION['user']['youtube_user']."'",true)[0]['host'];
    $this_msg['service']=$database->sql_select("bot_chathosts","*","owner='".$_SESSION['user']['youtube_user']."'",true)[0]['service'];
    $temp_users=$database->sql_select("bot_chatuser","*", "service='".$this_msg['service']."' AND host='".$this_msg['host']."' AND user='".$this_msg['user']."'", true);
    $this_user=$temp_users[0];
    $temp_user_roles=$database->sql_select("bot_chatuser_roles INNER JOIN bot_chatroles ON ( bot_chatuser_roles.service = bot_chatroles.service AND bot_chatuser_roles.host = bot_chatroles.host AND bot_chatuser_roles.role = bot_chatroles.role ) ","bot_chatroles.*","bot_chatroles.service='".$this_msg['service']."' AND bot_chatroles.host='".$this_msg['host']."' AND user='".$this_msg['user']."'",false);
    for ($count_user=0;$count_user<count($temp_user_roles);$count_user++) {
      $this_user['roles'][]=$temp_user_roles[$count_user];
    }
    $command_file="bot_php_commands/yt.php";
    ob_start();
    include($command_file);
    $result = ob_get_contents();
    ob_end_clean();
    $result = str_replace("<br>", " | ", $result);
    $result = utf8_decode($result);
    $result= mb_convert_encoding($result, "ISO-8859-1");
    $result = replace_html2markdown($result);
    
    if (get_magic_quotes_gpc()) {
      $result = stripslashes($result);
    }
    echo '<marquee>';
    echo $result;
    echo '</marquee>';
    echo '</div>';
    break;
  }
  ?>
</body>
</html>
<?php
unset($_SESSION);
?>
