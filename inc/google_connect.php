<?php

/* google connect */
$client = new Google_Client();

$client->setClientId($OAUTH2_CLIENT_ID);
$client->setClientSecret($OAUTH2_CLIENT_SECRET);
$client->setScopes('https://www.googleapis.com/auth/youtube');
$redirect = filter_var('http://' . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'], FILTER_SANITIZE_URL);

$redirect = filter_var('http://simpleyth.randompeople.de' . $_SERVER["PHP_SELF"], FILTER_SANITIZE_URL);
$client->setRedirectUri($redirect);

$client->setAccessType('offline');

$youtube = new Google_Service_YouTube($client);

if (isset($_GET['code'])) {
  if (strval($_SESSION['state']) !== strval($_GET['state'])) {
    die('The session state did not match.');
  }
  $temp = $client->authenticate($_GET['code']);
  
  //save_accesstoken($temp);
  $_SESSION['token'] = $client->getAccessToken();
  
  header('Location: ' . $redirect);
}
if (isset($_SESSION['token'])) {
  $client->setAccessToken($_SESSION['token']);
}
?>
