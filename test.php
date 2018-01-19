<?php
require_once 'inc/php_inc.php';

require_once 'API/Amazon/lib/AmazonECS.class.php';
$client = new AmazonECS($amazon['API_KEY'], $amazon['API_Secret'], 'DE', 'istani0815-21');

$response  = $client->category('Books')->search('PHP 5');
debug_log($response);
?>
