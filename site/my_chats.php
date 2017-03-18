<?php
echo "My Chats<br><br>";

$chats_temp=$database->sql_select("bot_chathosts", "*", "owner='".$_SESSION['user']['youtube_user']."'",true);
for ($i=0;$i<count($chats_temp);$i++) {
  $chats[]=$chats_temp[$i];
}
$chats_temp=$database->sql_select("bot_chathosts", "*", "owner='".$_SESSION['user']['discord_user']."'", true);
for ($i=0;$i<count($chats_temp);$i++) {
  $chats[]=$chats_temp[$i];
}

if (isset($_POST['save_roles'])) {
  unset($_POST['save_roles']);
  $database->sql_insert_update("bot_chatroles", $_POST);
}

echo '<div id="rooms">';
for ($i=0;$i<count($chats);$i++) {
  if ($chats[$i]['name']!="") {
    $tmp_roles=$database->sql_select("bot_chatroles","*","service='".$chats[$i]['service']."' AND host='".$chats[$i]['host']."'");
    $tmp_users=$database->sql_select("bot_chatuser","*","service='".$chats[$i]['service']."' AND host='".$chats[$i]['host']."'");
    echo '<h3>'.$chats[$i]['name'].'</h3>';
    echo '<div>';
    
    echo '<div id="tabs_'.$chats[$i]['host'].'">';
    echo '<ul>';
    echo '<li><a href="#tabs_'.$chats[$i]['host'].'-1">Einstellungen/Übersicht</a></li>';
    echo '<li><a href="#tabs_'.$chats[$i]['host'].'-2">Rechte</a></li>';
    echo '<li><a href="#tabs_'.$chats[$i]['host'].'-3">Bad Word List</a></li>';
    echo '</ul>';
    echo '<div id="tabs_'.$chats[$i]['host'].'-1">';
    
    echo '<table>';
    echo '<tr>';
    echo '<td>';
    echo 'System:';
    echo '</td>';
    echo '<td>';
    echo $chats[$i]['service'];
    echo '</td>';
    echo '<td>';
    echo 'User:';
    echo '</td>';
    echo '<td>';
    echo count($tmp_users);
    echo '</td>';
    echo '<td>';
    echo 'Roles:';
    echo '</td>';
    echo '<td>';
    echo count($tmp_roles);
    echo '</td>';
    echo '</tr>';
    echo '</table>';
    echo '<br>';
    
    // NOTE: Alle Rollen & User Azeigen, dammit der Übersichtsblock der "größte" wird? Bzw die Größe Vorgibt
    // (Wie mit der breite, noch nicht ganz sicher)
    echo '<table class="with_borders">';
    echo '<tr>';
    echo '<td>UserName</td>';
    echo '<td>Verwarnung</td>';
    echo '</tr>';
    for ($u=0;$u<count($tmp_users);$u++) {
      echo '<tr>';
      echo '<td>';
      echo $tmp_users[$u]['name'];
      echo '</td>';
      echo '<td>';
      if ($tmp_users[$u]['verwarnung']>0) {
        echo $tmp_users[$u]['verwarnung'].' ('.date("d.m.Y H:i:s", (int)($tmp_users[$u]['verwarnung_zeit']/1000)).')';
      }
      echo '</td>';
      echo '</tr>';
    }
    echo '</table>';
    
    echo '</div>';
    echo '<div id="tabs_'.$chats[$i]['host'].'-2">';
    
    // Rechte
    echo '<table class="with_borders">';
    $j=0;
    echo '<tr>';
    echo '<td>';
    echo '<b>Rolle</b>';
    echo '</td>';
    foreach ($tmp_roles[$j] as $key=>$value) {
      if ($key!=str_replace("recht_", "", $key)) {
        echo '<td><b>';
        echo str_replace("recht_", "", $key)." Recht";
        echo '</b></td>';
      }
    }
    foreach ($tmp_roles[$j] as $key=>$value) {
      if ($key!=str_replace("check_", "", $key)) {
        echo '<td><b>';
        echo str_replace("check_", "", $key)." Check";
        echo '</b></td>';
      }
    }
    echo '</tr>';
    for ($j=0; $j<count($tmp_roles);$j++) {
      echo '<form method="POST" action="index.php?site=my_chats">';
      echo '<input type="hidden" name="service" value="'.$tmp_roles[$j]['service'].'">';
      echo '<input type="hidden" name="host" value="'.$tmp_roles[$j]['host'].'">';
      echo '<input type="hidden" name="role" value="'.$tmp_roles[$j]['role'].'">';
      echo '<tr>';
      echo '<td>';
      echo $tmp_roles[$j]['role'];
      echo '</td>';
      foreach ($tmp_roles[$j] as $key=>$value) {
        if ($key!=str_replace("recht_", "", $key)) {
          echo '<td>';
          echo '<select name="'.$key.'">';
          if ($value==0) {
            echo '<option value="0" selected=selected>Nein</option>';
            echo '<option value="1">Ja</option>';
          } else {
            echo '<option value="0">Nein</option>';
            echo '<option value="1" selected=selected>Ja</option>';
          }
          echo '</select>';
          echo '</td>';
        }
      }
      foreach ($tmp_roles[$j] as $key=>$value) {
        if ($key!=str_replace("check_", "", $key)) {
          echo '<td>';
          echo '<select name="'.$key.'">';
          if ($value==0) {
            echo '<option value="0" selected=selected>Nein</option>';
            echo '<option value="1">Ja</option>';
          } else {
            echo '<option value="0">Nein</option>';
            echo '<option value="1" selected=selected>Ja</option>';
          }
          echo '</select>';
          echo '</td>';
        }
      }
      echo '<td>';
      echo '<input type="submit" name="save_roles" value="Speichern">';
      echo '</td>';
      echo '</tr>';
      echo '</form>';
    }
    echo '</table>';
    
    echo '</div>';
    echo '<div id="tabs_'.$chats[$i]['host'].'-3">';
    
    echo '</div>';
    echo '</div>';
    ?>
    <script>
    $( function() {
      $( "#<?php echo 'tabs_'.$chats[$i]['host']; ?>" ).tabs();
    } );
    </script>
    <?php
    
    
    echo '</div>';
  }
}
echo '</div>';
?>
<script>
$( function() {
  $( "#rooms" ).accordion();
} );
</script>
