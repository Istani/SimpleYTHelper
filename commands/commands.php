<?php

echo "!defender commands:
";
	$commands=return_commands_array();
	foreach($commands as $command) {
		echo "<b>".$command."</b>, ";
	}
?>