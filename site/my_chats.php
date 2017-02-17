<?php
echo "My Chats<br><br>";

function display_chat($name, $icon) {
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
}

$$database->select_sql("bot_chat_host", "*", "owner=".$_SESSION['user']['youtube_user'],false);
$database->select_sql("bot_chat_host", "*", "owner=".$_SESSION['user']['discord_user']);


display_account("Google", "icon_youtube_32px.png", "youtube_user", "New_Google_Auth");
display_account("Discord", "icon_discord_32px.png", "discord_user", "New_Discord_Auth");
?>
