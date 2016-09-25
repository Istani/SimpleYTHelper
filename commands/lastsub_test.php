<?php

// Getting SUB count & last name
// incs
require 'inc/php_inc.php';

// default
$subcount = 0;
$subname = "Nobody";

$client = new Google_Client();
$client->setClientId($OAUTH2_CLIENT_ID);
$client->setClientSecret($OAUTH2_CLIENT_SECRET);
$client->setDeveloperKey($DEV_KEY);
$client->setScopes('https: //www.googleapis.com/auth/youtube.readonly');

$accessToken = load_accesstoken($KANALID);
$client->setAccessToken($accessToken);
if ($client->isAccessTokenExpired()) {
    $client->refreshToken(load_refreshtoken($KANALID));
    save_accesstoken($KANALID, $client->getAccessToken());
}
$youtube = new Google_Service_YouTube($client);

$_tmp_tabellename="channels_statistics";
$database=new db("sqlite","");
$database->connect_db("data/".$KANALID.".sqlite3");

$check_table=$database->show_tables();

if(!in_array($_tmp_tabellename, $check_table)) {
$felder=null;
$felder["id"]="TEXT";
$felder["last_seen"]="TEXT";

$database->create_table($_tmp_tabellename, $felder, "id");
unset($felder);
}

//$new_feld["ignore"]="TEXT";
//$database->add_columns("channel_statistic", $new_feld);
//unset($new_feld);

$cstats = $database->sql_select($_tmp_tabellename, "*", "id='".$KANALID."' LIMIT 1", true);

$listResponse = $youtube->channels->listChannels('statistics', array('id' => $KANALID));
$subcount = $listResponse[0]["modelData"]["statistics"]["subscriberCount"];

$data4sql= $listResponse[0]["modelData"]["statistics"];
foreach ($data4sql as $key=>$value){
	$new_feld[$key]="TEXT";
	 $database->add_columns($_tmp_tabellename, $new_feld);
	 unset($new_feld);
	 $newData[$key]=$value;
}
$newData["id"]=$KANALID;
$newData["last_seen"]=time();
$database->sql_insert_update($_tmp_tabellename, $newData);
unset($newData);

if (!file_exists("token/" . $KANALID . ".BotSubscriber.refresh")) {
    save_refreshtoken($KANALID . ".BotSubscriber", "null");
}
if (!file_exists("data/" . $KANALID . ".subs")) {
    $tmp = fopen("data/" . $KANALID . ".subs", "w+");
    fclose($tmp);
}
$file = "data/" . $KANALID . ".subs";
$myfile = fopen($file, "r+") or die("Unable to load SubData!");
$file_subs = fread($myfile, filesize($file));
fclose($myfile);
$arr_subs = explode("|#*#|", $file_subs);

$refToken = load_refreshtoken($KANALID . ".BotSubscriber");
$req_count = 50;

if ($refToken == "null") {
    $subresult = $youtube->subscriptions->listSubscriptions("subscriberSnippet", array(/* 'channelId' => $KANALID, */"mySubscribers" => "true", "maxResults" => $req_count, "order" => "relevance"));
} else {
    $subresult = $youtube->subscriptions->listSubscriptions("subscriberSnippet", array(/* 'channelId' => $KANALID, */"mySubscribers" => "true", "maxResults" => $req_count, "order" => "relevance", "pageToken" => $refToken));
}
//debug_log($subresult);
for ($i = 0; $i < count($subresult["items"]); $i++) {
    $subname = $subresult["items"][$i]["subscriberSnippet"]["title"];
    //echo $subname."<br>";

    if (!in_array($subname, $arr_subs)) {
        $arr_subs[] = $subname;
    }
}

$text_sub = implode("|#*#|", $arr_subs);
$myfile = fopen($file, "w+") or die("Unable to save SubData!");
fwrite($myfile, $text_sub);
fclose($myfile);
save_refreshtoken($KANALID . ".BotSubscriber", $subresult["nextPageToken"]);

echo "#" . $subcount . " - " . $arr_subs[count($arr_subs) - 1];
?>