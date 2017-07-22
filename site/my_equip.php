<?php
echo "My Equipment<br><br>";

$_tmp_tabellename="user_ads";
$check_table=$database->show_tables();
if(!in_array($_tmp_tabellename, $check_table)) {
  $felder=null;
  $felder["owner"]="VARCHAR(255)";
  $felder["type"]="VARCHAR(255)";
  $felder["title"]="VARCHAR(255)";
  $felder["link"]="VARCHAR(255)";
  $felder["count"]="INT";
  $database->create_table($_tmp_tabellename, $felder, "owner, link");
  unset($felder);
}

if (isset($newCols)) {
  unset($newCols);
}
$newCols['isPremium']="INT DEFAULT 0";
$newCols['premCount']="INT DEFAULT -1";
$database->add_columns($_tmp_tabellename, $newCols);
unset($newCols);

//
if (isset($_POST['equip_save'])) {
  unset($_POST['equip_save']);
  foreach ($_POST['equip'] as $key => $value) {
    if (isset($new_data)) {unset($new_data);}
    $new_data['owner']=$_POST['owner'];
    $new_data['type']=$key;
    $new_data['title']=$value['title'];
    $new_data['link']=$value['link'];
    $database->sql_insert_update($_tmp_tabellename, $new_data);
  }
}
//
$all_equip=$database->sql_select($_tmp_tabellename, "type", "type NOT LIKE 'AD' AND type NOT LIKE 'Link' GROUP BY type",true);
$equip_temp=$database->sql_select($_tmp_tabellename, "*", "owner='".$_SESSION['user']['email']."' AND type NOT LIKE 'AD' AND type NOT LIKE 'Link' ",false);
for ($i=0;$i<count($all_equip);$i++) {
  $user_equipment[$all_equip[$i]['type']]['link']="";
  $user_equipment[$all_equip[$i]['type']]['title']="";
}
for ($i=0;$i<count($equip_temp);$i++) {
  $user_equipment[$equip_temp[$i]['type']]['link']=$equip_temp[$i]['link'];
  $user_equipment[$equip_temp[$i]['type']]['title']=$equip_temp[$i]['title'];
}
echo '<form method="POST" action="index.php?site=my_equip">';
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
    echo '<td>'.$key.'</td>';
    echo '<td><input type="text" name="equip['.$key.'][title]" value="'.$value['title'].'"></td>';
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
