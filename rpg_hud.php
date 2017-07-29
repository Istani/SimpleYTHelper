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
  <div id="check_gamestate"></div>
  
  <div class="<?php echo $_GET['task']; ?>_pic with_borders" style="width:400px;height:213px;">
    <img src="rpg_hud/img/Alpha_Monster_Idle0.png">
  </div>
  <script>
  var old_state = new Object;
  function ReloadState() {
    $('#check_gamestate').load('<?php echo $this_adresse; ?>rpg_hud/check_state.php?<?php echo $get_string ?>');
    var new_state = new Object;
    // Hierfür muss noch irgendeine Besser Idee finden...
    new_state.game_id=document.getElementById('game_id').value;
    new_state.game_state=document.getElementById('game_state').value;
    new_state.calculate_avg=document.getElementById('calculate_avg').value;
    new_state.factor=document.getElementById('factor').value;
    new_state.monster_id=document.getElementById('monster_id').value;
    new_state.monster_factor=document.getElementById('monster_factor').value;
    new_state.player_count=document.getElementById('player_count').value;
    new_state.monster_hp_max=document.getElementById('monster_hp_max').value;
    new_state.monster_hp_current=document.getElementById('monster_hp_current').value;
    new_state.rounds_max=document.getElementById('rounds_max').value;
    new_state.rounds_current=document.getElementById('rounds_current').value;
    new_state.animation_type=document.getElementById('animation_type').value;
    new_state.animation_state=document.getElementById('animation_state').value;
    
    if (new_state.game_state!=old_state.game_state) {
      console.log(new_state.game_state);
    }
    old_state=new_state;
    setTimeout(ReloadState, 1000);
  }
  
  $(document).ready(function() {
    ReloadState();
  });
  
  </script>
  
</body>
</html>
<?php
unset($_SESSION);
?>
