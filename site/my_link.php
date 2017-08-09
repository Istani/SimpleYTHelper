<?php
echo "My Links<br><br>";

$_tmp_tabellename="user_ads";


//
if (isset($_POST['equip_save'])) {
  unset($_POST['equip_save']);
  foreach ($_POST['equip'] as $key => $value) {
    if (isset($new_data)) {unset($new_data);}
    $new_data['owner']=$_POST['owner'];
    $new_data['type']='Link';
    $new_data['title']=$key;
    $new_data['link']=$value['link'];
    $database->sql_insert_update($_tmp_tabellename, $new_data);
  }
}
//
$all_equip=$database->sql_select($_tmp_tabellename, "title", "type LIKE 'Link' GROUP BY title",true);
$equip_temp=$database->sql_select($_tmp_tabellename, "*", "owner='".$_SESSION['user']['email']."' AND type LIKE 'Link'",false);
for ($i=0;$i<count($all_equip);$i++) {
  $user_equipment[$all_equip[$i]['title']]['link']="";
  $user_equipment[$all_equip[$i]['title']]['title']="";
}
for ($i=0;$i<count($equip_temp);$i++) {
  $user_equipment[$equip_temp[$i]['title']]['link']=$equip_temp[$i]['link'];
  $user_equipment[$equip_temp[$i]['title']]['title']=$equip_temp[$i]['title'];
}
echo '<form method="POST" action="index.php?site=my_link">';
echo '<input type="hidden" name="owner" value="'.$_SESSION['user']['email'].'">';
echo '<table class="ads with_borders">';
echo '<thead>';
echo '<tr>';
echo '<th>Bezeichnung</th>';
echo '<th>Link</th>';
echo '</tr>';
echo '</thead>';
echo '<tbody>';
foreach ($user_equipment as $key => $value) {
  if ($key!="") {
    echo '<tr>';
    echo '<td>'.$key.'</td>';
    echo '<td><input type="text" name="equip['.$key.'][link]" value="'.$value['link'].'"></td>';
    echo '</tr>';
  }
}
echo '</tbody>';
echo '</table>';

echo '<center>';
echo '<input type="submit" name="equip_save" value="Speichern">';
echo '</center>';
echo '</form>';
?>
<script>
$( document ).ready(function() {
  $('.ads').DataTable({
    "paging":   false,
    "ordering": false,
    "info":     false,
    "searching": false
  });
} );
</script>
