<?php

// Benötigte Daten
require_once 'inc/php_inc.php';
// http://127.0.0.1/SimpleYTH/rpg_hud.php?game=21232f297a57a5a743894a0e4a801fc3

if (!isset($_GET['game'])) {
  $_GET['game']="";
}
if (isset($_GET['game_id'])) {
  $_GET['game']=$_GET['game_id'];
}
$user=$database->sql_select("user","*","MD5(email)='".$_GET['game']."'", false); // TODO: Was besseres ausdenken für StandartUser;
if (isset($user[0]['email'])) {
  $_SESSION['user']=$user[0];
} else {
  die('ERROR');
}

$this_adresse= "http://".$_SERVER['HTTP_HOST']."/SimpleYTH/";
$game_data=$database->sql_select("rpg_check", "*", "game_id='".$_GET['game']."'", false);
$this_game=$game_data[0];

?>
<!doctype html>
<html>
<head>
  <title>SimpleYTH - RPG HUD</title>
  <?php require_once 'inc/html_inc.php'; ?>
</head>
<body>
  <?php
  $this_game['animation_type']='Spawn';
  $this_game['animation_state']=0;
  if (isset($_GET['animation_state'])) {
    $this_game['animation_state']=$_GET['animation_state']+1;
  }
  if (isset($_GET['animation_type'])) {
    $this_game['animation_type']=$_GET['animation_type'];
  }
  $get_string="";
  foreach ($this_game as $feld => $wert) {
    echo $feld.': <input type="text" id="'.$feld.'" name="'.$feld.'" value="'.$wert.'"><br>';
    $get_string.=$feld."=".$wert."&";
  }
  ?>
  
  <div class="<?php echo $_GET['task']; ?>_pic with_borders" style="width:400px;height:213px;">
    <img src="rpg_hud/img/Alpha_Monster_Idle0.png">
  </div>
  <?php
  if ( $_GET['task']=="monster") {
    ?>
    <script>
    
    function ReloadMonster() {
      $('.<?php echo $_GET['task']; ?>_pic').load('<?php echo $this_adresse; ?>rpg_hud/monster_pic.php?<?php echo $get_string ?>');
      console.log('<?php echo $this_adresse; ?>rpg_hud/monster_pic.php?<?php echo $get_string ?>');
      setTimeout(ReloadMonster, 2000);
    }
    function ReloadPage() {
      location.reload();
    }
    $(document).ready(function() {
      ReloadMonster();
    });
    </script>
    <?php
  }
  ?>
</body>
</html>
<?php
unset($_SESSION);
?>
