<?php
$Discord_CLIENT_ID     = '225365144497029125';
$Discord_CLIENT_SECRET = 'b56TWYePh_P664VWKi2Liz0NQuQciozv';

$redirect = filter_var('http://127.0.0.1/SimpleYTH/index.php?site=Discord_Auth', FILTER_SANITIZE_URL);
const AUTHORIZATION_ENDPOINT = 'https://graph.facebook.com/oauth/authorize';
const TOKEN_ENDPOINT         = 'https://graph.facebook.com/oauth/access_token';


?>
