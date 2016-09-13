<?php

class db {

    var $connection;
    var $database;
    var $system;

    function error($meldung) {
        echo $meldung;
        die();
    }

    function db($system, $destination, $user = "", $password = "") {
        $this->system = $system;
        if ($this->system == "mysql") {
            if (!$this->connection = mysql_connect($destination, $user, $password)) {
                $this->error("Keine Verbindung zum Datenbank-Server");
            }
        } else {
            $this->error("Datenbank System ist nicht bekannt");
        }
    }

    function connect_db($database_name) {
        if ($this->system == "mysql") {
            if (!$this->database = mysql_select_db($database_name, $this->connection)) {
                $this->error("Keine Verbindung zur Datenbank moeglich!");
            }
        }
    }

    function show_tables() {
        $return_array = array();
        if ($this->system == "mysql") {
            $sql_string = "SHOW TABLE STATUS";
            if ($query = mysql_query($sql_string, $this->connection)) {
                while ($row = mysql_fetch_assoc($query)) {
                    if ($row['Comment'] != "view") {
                        $return_array[] = $row['Name'];
                    }
                }
            } else {
                $this->error("<b>Abfrage:</b> <i>" . $sql_string . "</i><br>Konnte nicht ausgefuehrt werden!<br>" . mysql_error());
            }
        }
        return $return_array;
    }

    function sql_select($tabelle, $felder = "*", $where_string = "", $show_empty = false) {
        $sql_felder = "";
        $return_array = array();
        if (is_array($felder)) {
            foreach ($felder as $key => $value) {
                if ($sql_felder == "") {
                    $sql_felder = $vale;
                } else {
                    $sql_felder.=', ' . $value;
                }
            }
        } else {
            $sql_felder = $felder;
        }
        if ($this->system == "mysql") {
            if ($where_string != "") {
                $sql_string = "SELECT " . $sql_felder . " FROM " . $tabelle . " WHERE " . $where_string;
            } else {
                $sql_string = "SELECT " . $sql_felder . " FROM " . $tabelle;
            }
            if ($query = mysql_query($sql_string, $this->connection)) {
                if (mysql_num_rows($query) > 0) {
                    while ($row = mysql_fetch_assoc($query)) {
                        $return_array[] = $row;
                    }
                } else {
                    if ($show_empty) {
                        $sql_string = "SHOW COLUMNS FROM " . $tabelle;
                        if ($query = mysql_query($sql_string, $this->connection)) {
                            while ($row = mysql_fetch_assoc($query)) {
                                $return_array[0][$row['Field']] = "";
                            }
                        } else {
                            $this->error("<b>Abfrage:</b> <i>" . $sql_string . "</i><br>Konnte nicht ausgef?�hrt werden!<br>" . mysql_error());
                        }
                    }
                }
            } else {
                $this->error("<b>Abfrage:</b> <i>" . $sql_string . "</i><br>Konnte nicht ausgef?�hrt werden!<br>" . mysql_error());
            }
        }
        return $return_array;
    }

    function sql_delete($tabelle, $where_string) {
        $return_bool = false;
        if ($this->system == "mysql") {
            $sql_string = "DELETE FROM " . $tabelle . " WHERE " . $where_string;
            if ($query = mysql_query($sql_string, $this->connection)) {
                $return_bool = true;
            }
        }
        return $return_bool;
    }

    function sql_insert_update($tabelle, $felder_werte_array) {
        $sql_felder = "";
        $return = false;
        if (!is_array($felder_werte_array)) {
            $this->error("<b>Programmfehler:</b><i>ID:10-T Fehler</i><br>Falsche Werte für INSERT Befehl!<br><pre>" . var_dump($felder_werte_array) . "</pre>" . mysql_error());
        }
        foreach ($felder_werte_array as $key => $value) {
            if (get_magic_quotes_gpc()) {
                $value = stripslashes($value);
            }
            $value = mysql_real_escape_string($value);
            $value = utf8_encode($value);
            if ($sql_felder == "") {
                $sql_felder = $key . "='" . $value . "'";
            } else {
                $sql_felder.=", " . $key . "='" . $value . "'";
            }
        }
        if ($this->system == "mysql") {
            $sql_string = "INSERT INTO " . $tabelle . " SET " . $sql_felder . " ON DUPLICATE KEY UPDATE " . $sql_felder;
            if ($query = mysql_query($sql_string, $this->connection)) {
                $return = true;
            } else {
                $this->error("<b>Abfrage:</b> <i>" . $sql_string . "</i><br>Konnte nicht ausgefuehrt werden!<br>" . mysql_error());
            }
        }
        return $return;
    }

}

?>