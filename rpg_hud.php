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
  
  <div class="round_counter with_borders" style="width:400px;">
    &nbsp;
  </div>
  
  <div class="monster_pic with_borders" style="width:400px;height:213px;">
    
  </div>
  
  <div class="hp_meter with_borders" style="width:400px;">
    &nbsp;
  </div>
  <script>
  var old_state = new Object;
  var GET_STRING="<?php echo $get_string ?>";
  function ReloadState() {
    $('#check_gamestate').load('<?php echo $this_adresse; ?>rpg_hud/check_state.php?'+GET_STRING);
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
    GET_STRING="";
    GET_STRING+="game_id="+new_state.game_id+"&";
    GET_STRING+="game_state="+new_state.game_state+"&";
    GET_STRING+="calculate_avg="+new_state.calculate_avg+"&";
    GET_STRING+="factor="+new_state.factor+"&";
    GET_STRING+="monster_id="+new_state.monster_id+"&";
    GET_STRING+="monster_factor="+new_state.monster_factor+"&";
    GET_STRING+="player_count="+new_state.player_count+"&";
    GET_STRING+="monster_hp_max="+new_state.monster_hp_max+"&";
    GET_STRING+="monster_hp_current="+new_state.monster_hp_current+"&";
    GET_STRING+="rounds_max="+new_state.rounds_max+"&";
    GET_STRING+="rounds_current="+new_state.rounds_current+"&";
    GET_STRING+="animation_type="+new_state.animation_type+"&";
    GET_STRING+="animation_state="+new_state.animation_state+"";
    
    if (new_state.game_state!=old_state.game_state) {
      ReloadPic();
      ReloadHP();
      ReloadRound();
    }
    if (new_state.monster_id!=old_state.monster_id) {
      ReloadPic();
    }
    if (new_state.monster_hp_current!=old_state.monster_hp_current) {
      ReloadHP();
    }
    if (new_state.rounds_current!=old_state.rounds_current) {
      ReloadRound();
    }
    if (new_state.animation_type!=old_state.animation_type) {
      ReloadPic();
    }
    if (new_state.animation_state!=old_state.animation_state) {
      ReloadPic();
    }
    old_state=new_state;
    setTimeout(ReloadState, 1000);
  }
  
  function ReloadRound() {
    $('.round_counter').load('<?php echo $this_adresse; ?>rpg_hud/round_counter.php?'+GET_STRING);
  }
  
  function ReloadPic() {
    $('.monster_pic').load('<?php echo $this_adresse; ?>rpg_hud/monster_pic.php?'+GET_STRING);
  }
  
  function ReloadHP() {
    $('.hp_meter').load('<?php echo $this_adresse; ?>rpg_hud/hp_meter.php?'+GET_STRING);
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
