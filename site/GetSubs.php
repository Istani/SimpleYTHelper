<?php

$subresult = $youtube->subscriptions->listSubscriptions("subscriberSnippet", array(/* 'channelId' => $KANALID,/ */"mySubscribers" => "true"));

echo "<pre>";
echo var_dump($subresult);
echo "</pre>";
?>