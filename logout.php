<?php

session_start();
unset($_SESSION);
session_destroy();
header("Location: http://" . $_SERVER['HTTP_HOST'] . "/index.php");
 
?>