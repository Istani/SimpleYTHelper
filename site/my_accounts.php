<?php
echo "My Accounts<br><br>";

function display_account($name, $class, $field, $site) {
  echo '<a href="index.php?site='.$site.'">';
  echo '<div class="accountchoice"><table><tr><td>';
  echo '<span class="'.$class.'">&nbsp;</span>';
  echo '</td><td width="100%">'.$name.'</td><td>';
  if ($_SESSION['user'][$field]!="") {echo $_SESSION['user'][$field];}
  echo '</td></tr></table></div>';
  echo '</a>';
}
display_account("Google", "img_youtbe", "youtube_user", "New_Google_Auth");
display_account("Discord", "img_discord", "discord_user", "New_Discord_Auth");
?>
