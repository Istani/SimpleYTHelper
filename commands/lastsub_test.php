<?php

// Getting SUB count & last name
require 'inc/php_inc.php';

$database=new db("sqlite","");
$database->connect_db("data/".$KANALID.".sqlite3");

// default
$subcount = 0;
$subname = "Nobody";

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

$db_stats = $database->sql_select("channel_statistic", "*", "id='".$KANALID."'", true);
$subcount=$db_stats[0]["subscriberCount"];

echo "#" . $subcount . " - " . $arr_subs[count($arr_subs) - 1];
?>