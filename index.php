<?php
require_once 'inc/php_inc.php';
?>
<!doctype html>
<html>
<head>
  <title>SimpleYTH</title>
  <?php require_once 'inc/html_inc.php'; ?>
</head>
<body>
  <table>
    <tr>
      <td colspan="2">
        <div id="helper_nav" class="ui-accordion ui-widget ui-helper-reset" width="100%">
          <h3 class="accordion-header ui-accordion-header ui-helper-reset ui-state-default ui-accordion-icons ui-corner-all">Simple YoutubeHelper</h3>
          <div class="ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom">
            <img src="img/_Banner.png">
          </div>
        </div>
      </td>
    </tr>
    <tr>
      <td width="250"><?php
      require_once 'site/nav_main.php';
      require_once 'site/nav_helper.php';
      require_once 'site/nav_development.php';
      ?></td>
      <td class="content_page">
        <div id="site_content" class="ui-accordion ui-widget ui-helper-reset">
          <h3 class="accordion-header ui-accordion-header ui-helper-reset ui-state-default ui-accordion-icons ui-corner-all">Content</h3>
          <div class="ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom">
            <?php include("site/site_switch.php"); ?>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
