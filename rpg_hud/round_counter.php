<?php
if ($_GET['game_state']<2) {
  die('<center><span style="background-color:#FFFFFF">Simple RPG - Alpha</span></center>');
}
if ($_GET['game_state']<3) {
  die('<center><span style="background-color:#FFFFFF">Anmeldung</span></center>');
}
if ($_GET['game_state']<5) {
  die('<center><span style="background-color:#FFFFFF">Runde '.$_GET['rounds_current'].'/'.$_GET['rounds_max'].'</span></center>');
}
if ($_GET['game_state']<7) {
  if ($_GET['monster_hp_current']<=0) {
    die('<center><span style="background-color:#FFFFFF">Victory</span></center>');
  } else {
    die('<center><span style="background-color:#FFFFFF">Failure</span></center>');
  }
}

die('<center><span style="background-color:#FFFFFF">&nbsp;</span></center>');
?>
