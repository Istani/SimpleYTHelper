<?php

class db {
  
  var $connection;
  var $database;
  var $system;
  
  function __destruct() {
    $this->close();
  }
  
  function error($meldung) {
    trigger_error($meldung, E_USER_ERROR);
    die();
  }
  
  function db($system, $destination, $user = "", $password = "") {
    $this->system = $system;
    if ($this->system == "mysql") {
      if (!$this->connection = mysql_connect($destination, $user, $password)) {
        $this->error("Keine Verbindung zum Datenbank-Server");
      }
    } elseif ($this->system == "sqlite") {
      
    } else {
      $this->error("Datenbank System ist nicht bekannt");
    }
  }
  
  function connect_db($database_name) {
    if ($this->system == "mysql") {
      if (!$this->database = mysql_select_db($database_name, $this->connection)) {
        $this->error("Keine Verbindung zur Datenbank moeglich!");
      }
    } elseif ($this->system == "sqlite") {
      if (!$this->database = new SQLite3($database_name)) {
        $this->error("Keine Verbindung zur Datenbank-File!");
      }
    }
  }
  
  function close() {
    if ($this->system == "mysql") {
      //mysql_close($this->connection);
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
    } else if ($this->system == "sqlite") {
      $sql_string = "SELECT * FROM sqlite_master";
      if ($query = $this->database->query($sql_string)) {
        while ($row =$query->fetchArray()) {
          if ($row['type'] == "table") {
            $return_array[] = $row['name'];
          }
        }
      }
    }
    return $return_array;
  }
  
  function create_table($table, $felder, $pkfeld) {
    $return_status=false;
    $sql_felder = "";
    
    if (!is_array($felder)){
      $this->error("<b>Format:</b> <i></i><br>Benötigt Array als Input!<br>");
      return $return_status;
    }
    
    foreach ($felder as $key => $value) {
      if ($sql_felder == "") {
        $sql_felder = "`".strtolower($key)."` ".$value;
        
      } else {
        $sql_felder.=', ' . "`".strtolower($key)."` ".$value;
        
      }
      if ($this->system!="mysql") {
        if ($key==$pkfeld){
          $sql_felder.=" PRIMARY KEY";
        }
      }
      
    }
    
    $sql_string=" CREATE TABLE ".strtolower($table)." (".$sql_felder.")";
    if ($this->system=="mysql") {
      $return_status=mysql_query($sql_string, $this->connection);
      $sql_string2="ALTER TABLE `".strtolower($table)."` ADD PRIMARY KEY(".$pkfeld.");";
      $return_status=mysql_query($sql_string2, $this->connection);
    } else if ($this->system=="sqlite"){
      $return_status=$this->database->exec($sql_string);
    }
    return $return_status;
  }
  
  function add_columns($tabelle, $felder){
    $return_status=true;
    
    if (!is_array($felder)){
      $this->error("<b>Format:</b> <i></i><br>Benötigt Array als Input!<br>");
      return false;
    }
    $tabelle=strtolower($tabelle);
    $isFelder=$this->sql_select($tabelle, "*", "true LIMIT 1", true);
    
    foreach ($felder as $key=>$value){
      $key=strtolower($key);
      $key=trim($key);
      if (!isset($isFelder[0][trim($key)])){
        $sql_string="ALTER TABLE ".$tabelle." ADD COLUMN `".$key."` ".$value.";";
        
        if ($this->system=="mysql") {
          $return_status=mysql_query($sql_string, $this->connection);
          $isFelder[0][$key]=$value;
          // Bei Duplicate column Name macht der Probleme... bei Sqlite klappte des -.-
          //if (!$return_status){
          //  $this->error("<b>Abfrage:</b> <i>" . $sql_string . "</i><br>Konnte nicht ausgeführt werden!<br>" . mysql_error());
          //}
        } else if ($this->system=="sqlite") {
          $return_status=$this->database->exec($sql_string);
          $isFelder[0][$key]=$value;
        }
      }
    }
    return $return_status;
  }
  
  function sql_select($tabelle, $felder = "*", $where_string = "", $show_empty = false) {
    $tabelle=strtolower($tabelle);
    $sql_felder = "";
    $return_array = array();
    if (is_array($felder)) {
      foreach ($felder as $key => $value) {
        $value=strtolower($value);
        if ($sql_felder == "") {
          $sql_felder = $value;
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
      //echo $sql_string.'<br>';
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
              $this->error("<b>Abfrage:</b> <i>" . $sql_string . "</i><br>Konnte nicht ausgeführt werden!<br>" . mysql_error());
            }
          }
        }
      } else {
        $this->error("<b>Abfrage:</b> <i>" . $sql_string . "</i><br>Konnte nicht ausgeführt werden!<br>" . mysql_error());
      }
    }
    if ($this->system == "sqlite") {
      if ($where_string != "") {
        $sql_string = "SELECT " . $sql_felder . " FROM " . $tabelle . " WHERE " . $where_string;
      } else {
        $sql_string = "SELECT " . $sql_felder . " FROM " . $tabelle;
      }
      if ($query =$this->database->query($sql_string)) {
        
        if ($query->numColumns()>0) {
          $tmp_array=null;
          while ($row = $query->fetchArray()) {
            $tmp_array[]=$row;
          }
          for ($i=0;$i<count($tmp_array);$i++) {
            foreach ($tmp_array[$i] as $tkey=>$tvalue) {
              if ($tkey!==(int)$tkey) {
                if ($tvalue==null) {$tvalue="null";}
                $return_array[$i][$tkey] = $tvalue;
              }
            }
          }
        }
      }
      if ((count($return_array)==0) && ($show_empty)) {
        $sql_string = "PRAGMA table_info('".$tabelle."')";
        if ($query =$this->database->query($sql_string)) {
          if ($query->numColumns()>0) {
            while ($row = $query->fetchArray()) {
              $return_array[0][$row['name']] = "";
              
            }
          }
        }
      }
    }
    return $return_array;
  }
  
  function sql_delete($tabelle, $where_string) {
    $tabelle=strtolower($tabelle);
    $return_bool = false;
    $sql_string = "DELETE FROM " . $tabelle . " WHERE " . $where_string;
    if ($this->system == "mysql") {
      if ($query = mysql_query($sql_string, $this->connection)) {
        $return_bool = true;
      }
    }
    if ($this->system == "sqlite") {
      if ($query = sqlite_query($this->database, $sql_string)) {
        $return_bool = true;
      }
    }
    return $return_bool;
  }
  
  function sql_droptable($tablename) {
    $tabelle=strtolower($tablename);
    $return_bool = false;
    $sql_string = "DROP TABLE " . $tabelle;
    if ($this->system == "mysql") {
      if ($query = mysql_query($sql_string, $this->connection)) {
        $return_bool = true;
      }
    }
    if ($this->system == "sqlite") {
      if ($query = sqlite_query($this->database, $sql_string)) {
        $return_bool = true;
      }
    }
    return $return_bool;
  }
  
  function sql_insert_update($tabelle, $felder_werte_array) {
    $tabelle=strtolower($tabelle);
    $sql_felder = "";
    $felder_list="";
    $value_list="";
    
    $return = false;
    if (!is_array($felder_werte_array)) {
      $this->error("<b>Programmfehler:</b><i>ID:10-T Fehler</i><br>Falsche Werte für INSERT Befehl!<br><pre>" . var_dump($felder_werte_array) . "</pre>");
    }
    foreach ($felder_werte_array as $key => $value) {
      if (get_magic_quotes_gpc()) {
        $value = stripslashes($value);
      }
      $key=strtolower($key);
      $value = str_replace("'", "", $value);
      //$value = utf8_decode($value);
      if ($sql_felder == "") {
        $sql_felder ="`".$key."`='" . $value . "'";
        $felder_list="`".$key."`";
        $value_list="'".$value."'";
      } else {
        $sql_felder.=", `".$key."`='" . $value . "'";
        $felder_list.=", `".$key."`";
        $value_list.=", '".$value."'";
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
    if ($this->system == "sqlite") {
      
      //get primary key
      $pk="";
      $sql_string = "PRAGMA table_info('".$tabelle."')";
      $query=$this->database->query($sql_string);
      while ($row=$query->fetchArray()) {
        if ($row["pk"]=="1"){
          $pk=$row["name"];
        }
      }
      if ($pk==""){$this->error("no pk");}
      
      // pk check
      if (!isset($felder_werte_array[$pk])) {$this->error("pk not in array");}
      
      // check exists
      $pkcheck=$this->sql_select($tabelle, $pk, $pk."='".$felder_werte_array[$pk]."' LIMIT 1",true);
      
      if ($pkcheck[0][$pk]==""){
        //insert
        $sql_string="INSERT INTO ".$tabelle." (".$felder_list.") VALUES (".$value_list.")";
      } else {
        //update
        $sql_string="UPDATE ".$tabelle." SET ".$sql_felder." WHERE ".$pk."='".$felder_werte_array[$pk]."'";
      }
      if (!$return=$this->database->exec($sql_string)) {
        $this->error("<b>Abfrage:</b> <i>" . $sql_string . "</i><br>Konnte nicht ausgefuehrt werden!<br>SQLite wird noch nicht unterstützt!<br>");
      }
    }
    return $return;
  }
  
}

?>
