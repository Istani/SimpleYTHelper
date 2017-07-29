<?php

// Benötigte Daten

chdir('..');
require_once 'inc/php_inc.php';
// http://127.0.0.1/SimpleYTH/rpg_hud.php?game=21232f297a57a5a743894a0e4a801fc3

if (!isset($_GET['game_id'])) {
  $_GET['game_id']="";
}
$user=$database->sql_select("user","*","MD5(email)='".$_GET['game_id']."'", false); // TODO: Was besseres ausdenken für StandartUser;
if (isset($user[0]['email'])) {
  $_SESSION['user']=$user[0];
} else {
  die('ERROR');
}

$this_adresse= "http://".$_SERVER['HTTP_HOST']."/SimpleYTH/";
$game_data=$database->sql_select("rpg_check", "*", "game_id='".$_GET['game_id']."'", false);
$this_game=$game_data[0];

foreach ($this_game as $key => $value) {
  ?>
  <script>
  document.getElementById('<?php echo $key; ?>').value='<?php echo $value; ?>';
  </script>
  <?php
}
?>
