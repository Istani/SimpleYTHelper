<?
$state = mt_rand();
$client->setState($state);
$_SESSION['state'] = $state;

$authUrl = $client->createAuthUrl();
header("Location: ".$authUrl);
?>
