<div id="helper_nav" class="ui-accordion ui-widget ui-helper-reset">
  <h3 class="accordion-header ui-accordion-header ui-helper-reset ui-state-default ui-accordion-icons ui-corner-all">Helper</h3>
  <div class="ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom">
    <?php
    // Falls es den Token schon gibt, muss dann trotzdem bei jedem aufruf die Channel abgefragt werden? Eigentlich ja nicht oder?
    if ($client->getAccessToken()) {
      debug_log($_SESSION);
      $data4sql=$_SESSION['token'];
      // Auth Tabelle Anlegen!
      $_tmp_tabellename="AuthToken";
      $check_table=$database->show_tables();
      if(!in_array($_tmp_tabellename, $check_table)) {
        $felder=null;
        $felder["id"]="INT(20) NOT NULL AUTO_INCREMENT";
        $felder["last_seen"]="INT(20)";
        $database->create_table($_tmp_tabellename, $felder, "id");
        unset($felder);
      }
      $database->sql_select($_tmp_tabellename, "*", "id='".$KANALID."' LIMIT 1", true);
      foreach ($data4sql as $key=>$value){
        $new_feld[$key]="TEXT";
        $database->add_columns($_tmp_tabellename, $new_feld);
        unset($new_feld);
        $newData[$key]=$value;
      }
      $check_token=$database->sql_select($_tmp_tabellename, "*", "access_token='".$_SESSION['token']['access_token']."'", true);
      if (!($check_token[0]['id']>0)) {
        $newData["last_seen"]=time();
        $database->sql_insert_update($_tmp_tabellename, $newData);
      }
      die();
    }
    if ($client->getAccessToken()) {
      try {
        
      } catch (Google_Service_Exception $e) {
        echo sprintf('<p>A service error occurred: <code>%s</code></p>', htmlspecialchars($e->getMessage()));
      } catch (Google_Exception $e) {
        echo sprintf('<p>An client error occurred: <code>%s</code></p>', htmlspecialchars($e->getMessage()));
      }
      $_SESSION['token'] = $client->getAccessToken();
      
      // tokens speichern
      $listResponse = $youtube->channels->listChannels('id', array('mine' => 'true',));
      echo "<pre>";
      //echo var_dump($listResponse["items"][0]["id"]);
      foreach ($listResponse["items"] as $listItem) {
        save_accesstoken($listItem["id"], $_SESSION["token"]);
      }
      $temp = json_decode(json_encode($_SESSION["token"]));
      if (isset($temp->refresh_token)) {
        save_refreshtoken($listItem["id"], $temp->refresh_token);
      }
      
      echo "</pre>";
    } else {
      $state = mt_rand();
      $client->setState($state);
      $_SESSION['state'] = $state;
      
      $authUrl = $client->createAuthUrl();
      echo "<p><a href='" . $authUrl . "'>Google Konto verknüpfen</a></p>";
    }
    ?>
  </div>
</div>
