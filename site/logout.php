<?php
@session_start();
unset($_SESSION);
@session_destroy();
header("Location: http://s.defender833.de");
//header("Location: http://s.defender833.de");
echo '<a href="http://s.defender833.de">Zurück zur Seite</a>';
?>
