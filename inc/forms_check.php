<?php
if (isset($_POST['login'])) {
  if ($_POST['email']!="" && $_POST['passwort']!="") {
    // lgoin Check
    // TODO: Password Hashen
    $user_rows=$database->sql_select("user", "*", "email='".$_POST['email']."' AND password='".$_POST['passwort']."'",true);
    if ($user_rows[0]['email']==$_POST['email']) {
      if (isset($new_data)) {
        unset($new_data);
      }
      $new_data['email']=$_POST['email'];
      $new_data['last_login']=time();
      $database->sql_insert_update("user", $new_data);
      $_SESSION['user']=$user_rows[0];
      $_GET['site']="my_accounts";
    } else {
      if (isset($new_data)) {
        unset($new_data);
      }
      $new_data['email']=$_POST['email'];
      $new_data['password']=$_POST['passwort'];
      $new_data['last_login']=time();
      $database->sql_insert_update("user", $new_data);
      $user_rows=$database->sql_select("user", "*", "email='".$_POST['email']."' AND password='".$_POST['passwort']."'",true);
      if ($user_rows[0]['email']==$_POST['email']) {
        $_SESSION['user']=$user_rows[0];
        $_GET['site']="my_accounts";
      }
    }
  }
}
?>
