<?php
	require_once 'inc/php_inc.php';
	require_once 'inc/google_connect.php';
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
							BANNER
						</div>
					</div>
				</td>
			</tr>
			<tr>
				<td width="250"><?php 
						require_once 'site/nav_main.php';
						require_once 'site/nav_helper.php';
				?></td>
				<td><?php include("site/GetSubs.php"); ?></td>
			</tr>
		</table>
	</body>
</html>