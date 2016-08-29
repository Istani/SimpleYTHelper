<?php

	function execute_command($command) {
		$filepath="commands/".$command.".php";
		if (file_exists($filepath)){
			include($filepath);
		} else {
			echo "No Command: ".$command;
		}
	}
	
	function return_commands_array() {
		$temps=scandir("commands/");
		foreach ($temps as $filename) {
			if ($filename!=str_replace(".php","", $filename )) {
				$return[]= str_replace(".php","", $filename );
			}
		}
		return $return;
	}
?>