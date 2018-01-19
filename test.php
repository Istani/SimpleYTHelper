<?php

require_once 'API/Amazon/lib/AmazonECS.class.php';
$client = new AmazonECS('AKIAI2IMWNO2X6FUNLOQ', '6h93VVOx39on/6tQSu/sIMq2DGmvq/kNWQNX1Im1', 'DE', 'istani0815-21');

$response  = $client->category('Books')->search('PHP 5');
var_dump($response);
?>
