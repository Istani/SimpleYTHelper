<?php
if ($_GET['game_state']<2) {
  echo '<img src="rpg_hud/img/Rpg_Anmeldung.png">';
  die();
}
$file_url="img/".$_GET['monster_id']."_".$_GET['animation_type'].$_GET['animation_state'].".png";
if (file_exists($file_url)) {
  if ($_GET['animation_type']=="Attack") {
    $_GET['animation_type']="Idle";
    echo '<script>document.getElementById("animation_type").value="'.$_GET['animation_type'].'";</script>';
    $_GET['animation_state']=-1;
  }
  if ($_GET['animation_type']=="Dead") {
    $_GET['animation_state']=-1;
  }
  echo '<img src="rpg_hud/'.$file_url.'">';
  
  $file_next="img/".$_GET['monster_id']."_".$_GET['animation_type'].($_GET['animation_state']+1).".png";
  if (!file_exists($file_next)) {
    $_GET['animation_state']=-1;
    $file_next="img/".$_GET['monster_id']."_".$_GET['animation_type'].($_GET['animation_state']+1).".png";
    
  }
  //echo $file_next;
  
  echo '<script>document.getElementById("animation_state").value="'.($_GET['animation_state']+1).'";</script>';
  
  die();
}
die('<center><span style="background-color:#FFFFFF">&nbsp;</span></center>');
?>
