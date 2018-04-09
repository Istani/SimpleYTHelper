<?php
if ($SimpleYTH_Developmentmode==true) {
  $redirect = filter_var('http://127.0.0.1/SimpleYTH/index.php?site=Twitch_Auth', FILTER_SANITIZE_URL);
} else {
  $redirect = filter_var('http://simpleyth.randompeople.de/index.php?site=Twitch_Auth', FILTER_SANITIZE_URL);
}
const AUTHORIZATION_ENDPOINT = 'https://id.twitch.tv/oauth2/authorize';
const TOKEN_ENDPOINT         = 'https://id.twitch.tv/oauth2/token';

$client = new OAuth2\Client($twitch_CLIENT_ID, $twitch_CLIENT_SECRET);
if (!isset($_GET['code']))
{
  $auth_url = $client->getAuthenticationUrl(AUTHORIZATION_ENDPOINT, $redirect, array(
    "scope"=>"user:edit clips:edit bits:read analytics:read:games"
  ));
  header('Location: ' . $auth_url);
  die('Redirect');
} else {
  $params = array('code' => $_GET['code'], 'redirect_uri' => $redirect);
  $response = $client->getAccessToken(TOKEN_ENDPOINT, 'authorization_code', $params);
  $response=$response['result'];
  $response['user']=$_SESSION['user']['email'];
  $response['service']="Twitch";
  $response['scope']=implode("+",$response['scope']);
  authtoken_save($database, $response);
  
  $client->setAccessToken($response['access_token']);
  $client->setAccessTokenType(1); //ACCESS_TOKEN_BEARER
  $response = $client->fetch('https://api.twitch.tv/helix/users');
  
  $new_feld['twitch_user']="TEXT";
  $database->add_columns("user", $new_feld);
  unset($new_feld);
  
  $_SESSION['user']['twitch_user']=$response['result']['data'][0]['id'];
  $database->sql_insert_update("user", $_SESSION['user']);
  
  if ($SimpleYTH_Developmentmode==true) {
    $redirect = filter_var('http://127.0.0.1/SimpleYTH/index.php?site=my_accounts', FILTER_SANITIZE_URL);
  } else {
    $redirect = filter_var('http://simpleyth.randompeople.de/index.php?site=my_accounts', FILTER_SANITIZE_URL);
  }
  header("Location: ".$redirect);
}
?>
