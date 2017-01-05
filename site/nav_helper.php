<div id="helper_nav" class="ui-accordion ui-widget ui-helper-reset">
  <h3 class="accordion-header ui-accordion-header ui-helper-reset ui-state-default ui-accordion-icons ui-corner-all">Helper</h3>
  <div class="ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom">
    <?php
    // Überprüfen ob Token schon vorhanen!
    if ($client->getAccessToken()) {
      try {
        
      } catch (Google_Service_Exception $e) {
        echo sprintf('<p>A service error occurred: <code>%s</code></p>', htmlspecialchars($e->getMessage()));
      } catch (Google_Exception $e) {
        echo sprintf('<p>An client error occurred: <code>%s</code></p>', htmlspecialchars($e->getMessage()));
      }
      $token_id=session_to_database($database, $_SESSION['token']);
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
