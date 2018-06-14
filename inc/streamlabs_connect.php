<?php
if ($SimpleYTH_Developmentmode==true) {
  $redirect = filter_var('http://127.0.0.1/SimpleYTH/index.php?site=Streamlabs_Auth', FILTER_SANITIZE_URL);
} else {
  $redirect = filter_var('http://s.defender833.de/index.php?site=Streamlabs_Auth', FILTER_SANITIZE_URL);
}
const AUTHORIZATION_ENDPOINT = 'https://streamlabs.com/api/v1.0/authorize';
const TOKEN_ENDPOINT         = 'https://streamlabs.com/api/v1.0/token';

$client = new OAuth2\Client($streamlabs_CLIENT_ID, $streamlabs_CLIENT_SECRET);
if (!isset($_GET['code']))
{
  $auth_url = $client->getAuthenticationUrl(AUTHORIZATION_ENDPOINT, $redirect, array(
    "scope"=>"donations.create donations.read alerts.create points.read points.write alerts.write credits.write profiles.write jar.write wheel.write"
  ));
  header('Location: ' . $auth_url);
  die('Redirect');
} else {
  $params = array('code' => $_GET['code'], 'redirect_uri' => $redirect);
  $response = $client->getAccessToken(TOKEN_ENDPOINT, 'authorization_code', $params);
  $response=$response['result'];
  $response['user']=$_SESSION['user']['email'];
  $response['service']="Streamlabs";
  //$response['scope']=implode("+",$response['scope']);
  authtoken_save($database, $response);
  
  $client->setAccessToken($response['access_token']);
  $client->setAccessTokenType(1); //ACCESS_TOKEN_BEARER
  $response = $client->fetch('https://streamlabs.com/api/v1.0/user');
  
  $new_feld['streamlabs_user']="TEXT";
  $database->add_columns("user", $new_feld);
  unset($new_feld);
  
  $_SESSION['user']['streamlabs_user']=$response['result']["streamlabs"]["id"];
  $database->sql_insert_update("user", $_SESSION['user']);
  
  if ($SimpleYTH_Developmentmode==true) {
    $redirect = filter_var('http://127.0.0.1/SimpleYTH/index.php?site=my_accounts', FILTER_SANITIZE_URL);
  } else {
    $redirect = filter_var('http://s.defender833.de/index.php?site=my_accounts', FILTER_SANITIZE_URL);
  }
  header("Location: ".$redirect);
}
?>
