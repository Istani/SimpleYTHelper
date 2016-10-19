<?php
  echo "DO";
  include("functions/func_token.php");
  $KANALID="UC5DOhI70dI3PnLPMkUsosgw";
  $token=load_accesstoken($KANALID);
  $token=json_encode($token);
  save_accesstoken($KANALID."2",$token);
  echo "DONE";
?>