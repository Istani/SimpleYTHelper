<?php

// Getting SUB count & last name
require 'inc/php_inc.php';

$accessToken = load_accesstoken($KANALID);

$database=new db("sqlite","");
$database->connect_db("data/".$KANALID.".sqlite3");

// Google Verbindung
$client = new Google_Client();
$client->setClientId($OAUTH2_CLIENT_ID);
$client->setClientSecret($OAUTH2_CLIENT_SECRET);
$client->setDeveloperKey($DEV_KEY);
$client->setScopes('https: //www.googleapis.com/auth/youtube.readonly');

$client->setAccessToken($accessToken);
if ($client->isAccessTokenExpired()) {
  $client->refreshToken(load_refreshtoken($KANALID));
  save_accesstoken($KANALID, $client->getAccessToken());
}

$youtube = new Google_Service_YouTube($client);


//$broadcastsResponse = $youtube->channels->listChannels('contentDetails,id,localizations,snippet,statistics,status,topicDetails',array('mine' => 'true'));
$broadcastsResponse = $youtube-> search->listSearch('id', array('channelId'=>$KANALID, 'eventType'=>'live','type'=>'video'));

if (isset($broadcastsResponse["items"][0])) {
$BroadcastId=$broadcastsResponse["items"][0]["id"]["videoId"];

echo "BroadcastId:".$BroadcastId."\n\r";

$broadcastsResponse = $youtube->liveBroadcasts->listLiveBroadcasts('snippet',array('id'=>$BroadcastId));

$ChatId=$broadcastsResponse["items"][0]["snippet"]["liveChatId"];

echo "ChatId:".$ChatId."\n\r";

$broadcastsResponse = $youtube->liveChatMessages->listLiveChatMessages('snippet,authorDetails',array("liveChatId"=>$ChatId,"maxResults"=>2000));


debug_log($broadcastsResponse);
} else {
	echo "Kein Livestream gefunden!";
}
?>