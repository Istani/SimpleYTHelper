<?php
@session_start();
unset($_SESSION);
@session_destroy();
header("Location: http://127.0.0.1/SimpleYTH/");
//header("Location: http://simpleyth.randompeople.de");
echo '<a href="http://simpleyth.randompeople.de">Zurück zur Seite</a>';
?>
