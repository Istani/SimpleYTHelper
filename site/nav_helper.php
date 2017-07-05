<div id="helper_nav" class="ui-accordion ui-widget ui-helper-reset">
  <h3 class="accordion-header ui-accordion-header ui-helper-reset ui-state-default ui-accordion-icons ui-corner-all">Helper</h3>
  <div class="ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom">
    <?php
    if (isset($_SESSION['user']['email'])) {
      echo "<p><a href='index.php?site=my_accounts'>Meine Accounts</a></p>";
      echo "<p><a href='index.php?site=my_chats'>Meine Chat Hosts</a></p>";
      echo "<p><a href='index.php?site=my_equip'>Meine Equipment</a></p>";
      echo "<p><a href='index.php?site=my_ads'>Meine Werbelinks</a></p>";
      
      
      echo "<p><a href='site/logout.php'>Logout</a></p>";
    } else {
      // Login
      ?>
      <form method="POST" action="index.php">
        <table>
          <tr>
            <td>
              E-Mail:
            </td>
          </tr>
          <tr>
            <td>
              <input type="text" name="email">
            </td>
          </tr>
          <tr>
            <td>
              Passwort:
            </td>
          </tr>
          <tr>
            <td>
              <input type="password" name="passwort">
            </td>
          </tr>
          <tr>
            <td>
              &nbsp;
            </td>
          </tr>
          <tr>
            <td>
              <input type="submit" name="login" value="LOGIN">
            </td>
          </tr>
          <tr>
            <td>
              &nbsp;
            </td>
          </tr>
        </table>
      </form>
      <?php
    }
    ?>
  </div>
</div>
