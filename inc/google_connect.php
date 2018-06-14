<?php
/* google connect */
$client = new Google_Client();

$client->setClientId($OAUTH2_CLIENT_ID);
$client->setClientSecret($OAUTH2_CLIENT_SECRET);
$client->setScopes('https://www.googleapis.com/auth/youtube');

if ($SimpleYTH_Developmentmode==true) {
  $redirect = filter_var('http://127.0.0.1/SimpleYTH/index.php?site=Google_Auth', FILTER_SANITIZE_URL);
} else {
  $redirect = filter_var('http://s.defender833.de/index.php?site=Google_Auth', FILTER_SANITIZE_URL);
}
$client->setRedirectUri($redirect);
$client->setAccessType('offline');
$youtube = new Google_Service_YouTube($client);


if (!isset($_GET['code']))
{
  /* Wird scheinbar schon in auth_google.php gemacht?!? */
  if (isset($_SESSION['user'])) {
    $tmp_response=$database->sql_select("authtoken", "*", "service='Google' AND user='".$_SESSION['user']['email']."' LIMIT 1", true);
    $response=$tmp_response[0];
    $client->setAccessToken($response);
  }
} else {
  $response = $client->authenticate($_GET['code']);
  $response['user']=$_SESSION['user']['email'];
  $response['service']="YouTube";
  //debug_log($response);
  authtoken_save($database, $response);
  $client->setAccessToken($response);
  header('Location: ' . $redirect);
}

?>
