<?php

function execute_command($command) {
    $result = "";
    ob_start();
    $filepath = "commands/" . $command . ".php";
    if (file_exists($filepath)) {
        include($filepath);
    } else {
        echo "No Command: <b>" . $command . "</b>! " . execute_command("commands");
    }
    $result = ob_get_contents();
    ob_end_clean();
    $result = replace_html2markdown($result);
    return $result;
}

function return_commands_array() {
    $temps = scandir("commands/");
    foreach ($temps as $filename) {
        if ($filename != str_replace(".php", "", $filename)) {
            $return[] = str_replace(".php", "", $filename);
        }
    }
    return $return;
}

function replace_html2markdown($string) {

    $string = str_replace("<b>", "**", $string);
    $string = str_replace("</b>", "**", $string);


    return $string;
}

function debug_log($var) {
    echo "<pre>";
    echo var_dump($var);
    echo "</pre>";
}

?>