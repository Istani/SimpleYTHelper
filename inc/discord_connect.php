<?php
$redirect = filter_var('http://127.0.0.1/SimpleYTH/index.php?site=Discord_Auth', FILTER_SANITIZE_URL);
const AUTHORIZATION_ENDPOINT = 'https://discordapp.com/api/oauth2/authorize';
const TOKEN_ENDPOINT         = 'https://discordapp.com/api/oauth2/token';

$client = new OAuth2\Client($Discord_CLIENT_ID, $Discord_CLIENT_SECRET);
if (!isset($_GET['code']))
{
  $auth_url = $client->getAuthenticationUrl(AUTHORIZATION_ENDPOINT, $redirect, array("scope"=>"identify"));
  header('Location: ' . $auth_url);
  die('Redirect');
}
else
{
  $params = array('code' => $_GET['code'], 'redirect_uri' => $redirect);
  $response = $client->getAccessToken(TOKEN_ENDPOINT, 'authorization_code', $params);
  var_dump($response);
  $info=$response['result'];
  echo '<hr>';
  $client->setAccessToken($info['access_token']);
  $response = $client->fetch('https://discordapp.com/api/users/@me');
  var_dump($response);
}
?>
