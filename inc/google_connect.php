<?php
/* google connect */
$client = new Google_Client();

$client->setClientId($OAUTH2_CLIENT_ID);
$client->setClientSecret($OAUTH2_CLIENT_SECRET);
$client->setScopes('https://www.googleapis.com/auth/youtube');
$redirect = filter_var('http://' . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'], FILTER_SANITIZE_URL);

$redirect = filter_var('http://127.0.0.1/SimpleYTH/index.php?site=Google_Auth', FILTER_SANITIZE_URL);
//$redirect = filter_var('http://simpleyth.randompeople.de/index.php?site=Google_Auth', FILTER_SANITIZE_URL);
$client->setRedirectUri($redirect);

$client->setAccessType('offline');

$youtube = new Google_Service_YouTube($client);

if (isset($_GET['code'])) {
  if (strval($_SESSION['state']) !== strval($_GET['state'])) {
    die('The session state did not match.');
  }
  $temp = $client->authenticate($_GET['code']);
  
  //save_accesstoken($temp);
  $_SESSION['yt_token'] = $client->getAccessToken();
  $token_id=session_to_database($database, $_SESSION['yt_token']);
  $_tmp_tabellename="authtoken";
  $tmp_yt_tokens=$database->sql_select($_tmp_tabellename,"*","id=".$token_id." LIMIT 1",true);
  $_SESSION['yt_token'] = $tmp_yt_tokens[0];
  header('Location: ' . $redirect);
}
if (isset($_SESSION['yt_token'])) {
  $_tmp_tabellename="authtoken";
  $tmp_yt_tokens=$database->sql_select($_tmp_tabellename,"*","id=".$token_id." LIMIT 1",true);
  $_SESSION['yt_token'] = $tmp_yt_tokens[0];
  $client->setAccessToken($_SESSION['yt_token']);
}
?>
