<?php
echo "My Accounts<br><br>";

function display_account($name, $icon, $field, $site) {
  echo '<a href="index.php?site='.$site.'">';
  echo '<div class="ui-tabs ui-corner-all ui-widget ui-widget-content"><table width="100%"><tr><td>';
  echo '<img src="img/'.$icon.'">';
  echo '</td><td width="100%">'.$name.'</td><td>';
  if ($_SESSION['user'][$field]!="") {
    echo '<img src="img/icon_ok_32px.png">';
    //echo " (".$_SESSION['user'][$field].")";
  } else {
    echo '<img src="img/icon_oauth_32px.png">';
  }
  echo '</td></tr></table></div>';
  echo '</a>';
}
display_account("Google", "icon_youtube_32px.png", "youtube_user", "New_Google_Auth");
display_account("Discord", "icon_discord_32px.png", "discord_user", "New_Discord_Auth");
display_account("Twitch", "icon_twitch_32px.png", "twitch_user", "New_Twitch_Auth");
?>
