<?php
    $get_owner=$database->sql_select("bot_chathosts","*","host='".$this_msg['host']."'",true)[0]['owner'];
    $owner_user=$database->sql_select("user","*","discord_user='".$get_owner."' or youtube_user='".$get_owner."'",true)[0];
    if (!isset($owner_user['ad_status'])) {
        $owner_user['ad_status']=1;
        $new_feld['ad_status']="TEXT";
        $database->add_columns("user", $new_feld);
    }
    if ($get_owner=="") {
        $owner_user['ad_status']=1;
    }

    if ($owner_user['ad_status']==1) {
        $ad_where="ispremium='1' AND type NOT LIKE 'Link' AND link NOT LIKE '' AND premcount!='0'";
    } else {
        $ad_where="owner='".$owner_user['email']."' AND type NOT LIKE 'Link' AND link NOT LIKE ''";
    }
    $get_min_counter=$database->sql_select("user_ads","MIN(count) as min_counter",$ad_where,true)[0]['min_counter'];
    if ($get_min_counter=="") {
        $get_min_counter=0;
    }

    $get_ad=$database->sql_select("user_ads","*, md5(concat(owner,link)) AS hash",$ad_where." AND count='".$get_min_counter."' ORDER BY RAND() LIMIT 1",true)[0];



    debug_log($get_owner);
    debug_log($owner_user);
    debug_log($get_ad);




    $result = ob_get_contents();
    ob_end_clean();
    $result = replace_html2markdown($result);
    echo $result;
    die();
?>