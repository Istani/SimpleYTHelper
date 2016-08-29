<?php

	function execute_command($command) {
		$filepath="scripts/".$command.".php";
		if (file_exists($filepath)){
			include($filepath);
		} else {
			echo "No Command: ".$command;
		}
	}
?>