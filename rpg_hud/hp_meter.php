<?php
if (($_GET['game_state']>=3) && ($_GET['game_state']<5)) {
  die('<center><span style="background-color:#FFFFFF">HP: '.$_GET['monster_hp_current'].'/'.$_GET['monster_hp_max'].'</span></center>');
}
die('<center><span style="background-color:#FFFFFF">&nbsp;</span></center>');
?>
