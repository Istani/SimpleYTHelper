<?php
if ($SimpleYTH_Developmentmode==true) {
  $redirect = filter_var('http://127.0.0.1/SimpleYTH/index.php?site=Discord_Auth', FILTER_SANITIZE_URL);
} else {
  $redirect = filter_var('http://simpleyth.randompeople.de/index.php?site=Discord_Auth', FILTER_SANITIZE_URL);
}
const AUTHORIZATION_ENDPOINT = 'https://discordapp.com/api/oauth2/authorize';
const TOKEN_ENDPOINT         = 'https://discordapp.com/api/oauth2/token';

$client = new OAuth2\Client($Discord_CLIENT_ID, $Discord_CLIENT_SECRET);
if (!isset($_GET['code']))
{
  $auth_url = $client->getAuthenticationUrl(AUTHORIZATION_ENDPOINT, $redirect, array("scope"=>"identify"));
  header('Location: ' . $auth_url);
  die('Redirect');
} else {
  $params = array('code' => $_GET['code'], 'redirect_uri' => $redirect);
  $response = $client->getAccessToken(TOKEN_ENDPOINT, 'authorization_code', $params);
  $response=$response['result'];
  $response['user']=$_SESSION['user']['email'];
  $response['service']="Discord";
  authtoken_save($database, $response);
  
  $client->setAccessToken($response['access_token']);
  $client->setAccessTokenType(1); //ACCESS_TOKEN_BEARER
  $response = $client->fetch('https://discordapp.com/api/users/@me');
  $_SESSION['user']['discord_user']=$response['result']['id'];
  $database->sql_insert_update("user", $_SESSION['user']);
  
  if ($SimpleYTH_Developmentmode==true) {
    $redirect = filter_var('http://127.0.0.1/SimpleYTH/index.php?site=my_accounts', FILTER_SANITIZE_URL);
  } else {
    $redirect = filter_var('http://simpleyth.randompeople.de/index.php?site=my_accounts', FILTER_SANITIZE_URL);
  }
  header("Location: ".$redirect);
}
?>
