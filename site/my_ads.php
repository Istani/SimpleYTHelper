<?php
echo "My ADs<br><br>";

$_tmp_tabellename="user_ads";

//
if (isset($_POST['equip_save'])) {
  unset($_POST['equip_save']);
  foreach ($_POST['equip'] as $key => $value) {
    if (isset($new_data)) {unset($new_data);}
    $new_data['owner']=$_POST['owner'];
    $new_data['type']='AD';
    $new_data['title']=$value['title'];
    $new_data['link']=$value['link'];
    $database->sql_insert_update($_tmp_tabellename, $new_data);
  }
}
//
$equip_temp=$database->sql_select($_tmp_tabellename, "*", "owner='".$_SESSION['user']['email']."' AND type LIKE 'AD'",true);
for ($i=0;$i<count($equip_temp);$i++) {
  $user_equipment[$equip_temp[$i]['link']]['title']=$equip_temp[$i]['title'];
  $user_equipment[$equip_temp[$i]['link']]['link']=$equip_temp[$i]['link'];
}
echo '<form method="POST" action="index.php?site=my_ads">';
echo '<input type="hidden" name="owner" value="'.$_SESSION['user']['email'].'">';
echo '<table class="ads with_borders">';
echo '<thead>';
echo '<tr>';
echo '<th>Typ</th>';
echo '<th>Bezeichnung</th>';
echo '<th>Link</th>';
echo '</tr>';
echo '</thead>';
echo '<tbody>';
foreach ($user_equipment as $key => $value) {
  if ($key!="") {
    echo '<tr>';
    echo '<td>AD</td>';
    echo '<td><input type="text" name="equip['.$key.'][title]" value="'.$value['title'].'"></td>';
    echo '<td><input type="text" name="equip['.$key.'][link]" value="'.$value['link'].'"></td>';
    echo '</tr>';
  }
}
echo '<tr>';
echo '<td>Neu</td>';
echo '<td><input type="text" name="equip[new][title]" value=""></td>';
echo '<td><input type="text" name="equip[new][link]" value=""></td>';
echo '</tr>';
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
