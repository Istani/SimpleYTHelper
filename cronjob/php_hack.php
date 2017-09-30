<?php
$cronjob_id=basename(__FILE__, '.php');
$do_job=check_settings($database, $cronjob_id);

if ($do_job==false) {
  return;
  die();
} else {
  $token[$cronjob_id]=load_cronjobtoken($database, $cronjob_id, $_SESSION['user']['email']);
}
$_tmp_tabellename=strtolower($cronjob_id);


if (!isset($token[$_tmp_tabellename])) {
  $token[$_tmp_tabellename] = init_token($_tmp_tabellename);
}
$tt=$token[strtolower($_tmp_tabellename)];

$new_feld['php_process']="INT(1) NOT NULL DEFAULT  '0'";
$database->add_columns("bot_chatlog", $new_feld);
unset($new_feld);

if ($tt["last_used"]+$tt["cooldown"]<time()) {
  // Do Magic!
  $temps = scandir("bot_php_commands/");
  foreach ($temps as $filename) {
    if ($filename != str_replace(".php", "", $filename)) {
      $php_commands[] = str_replace(".php", "", $filename);
    }
  }
  
  $prefix="!";
  
  $all_messages = $database->sql_select("bot_chatlog", "*", "php_process=0 ORDER BY time LIMIT 1", false);
  for ($m_count=0;$m_count<count($all_messages);$m_count++) {
    $this_msg=$all_messages[$m_count];
    $command_file="";
    
    if ($prefix==substr($this_msg['message'], 0,1)) {
      $parts=explode(" ", $this_msg['message'],2);
      $command_file="bot_php_commands/".substr($parts[0], 1).".php";
      if (file_exists($command_file)) {
        ob_start();
        include("bot_php_commands/".substr($parts[0], 1).".php");
        $result = ob_get_contents();
        ob_end_clean();
        $result = replace_html2markdown($result);
        //debug_log($result);
      }
    }
    $this_msg['php_process']=1;
    $database->sql_insert_update("bot_chatlog", $this_msg);
    if (file_exists($command_file)) {
      $this_msg['id']=($this_msg['id']*10)+1;
      $this_msg['process']=0;
      $this_msg['user']='-1';
      $this_msg['message']="!php_hack ".$result;
      
      $database->sql_insert_update("bot_chatlog", $this_msg);
    }
  }
  $tt["cooldown"]=2;
}
// Save Token
echo date("d.m.Y - H:i:s")." - ".$_tmp_tabellename." updated für ".$_SESSION['user']['email']."!<br>";
$tt["last_used"]=time();
$tt["user"]=$_SESSION['user']['email'];
if($tt["token"]==""){$tt["token"]="null";}
if ($_SESSION['user']['email']!="") {
  $database->sql_insert_update("bot_token",$tt);
}
$token[strtolower("bot_chatspam")]=$tt;
unset($tt);
?>
