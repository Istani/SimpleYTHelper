<?php
class SimpleYTH_Shortcuts {
  var $db;
  
  function __destruct() {
    
  }
  
  function SimpleYTH_Shortcuts($datenbank) {
    $this->db = $datenbank;
  }
  
  function get_timestamp($type='sekunde',$get_as_seconds=false, $addvalue=0,$returnvalue=-1) {
    if ($returnvalue==-1) {
      $returnvalue=time();
    }
    $time['sekunde']=$returnvalue;
    $time['minute']=(int)($time['sekunde']/60);
    $time['stunde']=(int)($time['minute']/60);
    $time['tag']=(int)($time['stunde']/24);
    
    if (isset($time[$type])) {
      $returnvalue=$time[$type];
    }
    $returnvalue+=$addvalue;
    
    if ($get_as_seconds==true) {
      while ($type!='sekunde') {
        switch ($type) {
          case 'tag':
          $returnvalue=$returnvalue*24;
          $type='stunde';
          break;
          case 'stunde':
          $returnvalue=$returnvalue*60;
          $type='minute';
          break;
          case 'minute':
          $returnvalue=$returnvalue*60;
          $type='sekunde';
          break;
          default:
          return $returnvalue;
        }
      }
    }
    return $returnvalue;
  }
  
  function get_rights($simple_yth_user) {
    $return = null;
    $activity_check=time()-(1*24*60*60);
    // Wo darf der User seine Videos Posten?
    $user_accounts=$this->db->sql_select('`user`', "*","email='".$simple_yth_user."'", true);
    
    // alle _user abfragen, aber momentan macht nur discord sinn!
    if ($user_accounts[0]['discord_user']!="") {
      $user['service']='Discord';
      $user['account']=$user_accounts[0]['discord_user'];
      $user_is_in=$this->db->sql_select('`bot_chatuser`', "host","user='".$user['account']."' AND last_seen>".$activity_check." AND service='".$user['service']."' GROUP BY host");
      for ($cnt_isin=0;$cnt_isin<count($user_is_in);$cnt_isin++) {
        $user['host']=$user_is_in[$cnt_isin]['host'];
        $user_roles=$this->db->sql_select("`bot_chatuser_roles`", "role", "user='".$user['account']."' AND service='".$user['service']."' and host='".$user['host']."'");
        for ($cnt_roles=0;$cnt_roles<count($user_roles);$cnt_roles++) {
          $roles_rechte=$this->db->sql_select("`bot_chatroles`","*","role='".$user_roles[$cnt_roles]['role']."' AND service='".$user['service']."' and host='".$user['host']."'");
          for ($cnt_rr=0;$cnt_rr<count($roles_rechte);$cnt_rr++) {
            $diese_rolle=$roles_rechte[$cnt_rr];
            foreach ($diese_rolle as $key => $value) {
              if (isset($user['rolle'][$key])) {
                if ($user['rolle'][$key]<$value) {
                  $user['rolle'][$key]=$value;
                }
              } else {
                $user['rolle'][$key]=$value;
              }
            }
          }
          unset($user['rolle']['service']);
          unset($user['rolle']['host']);
          unset($user['rolle']['role']);
        }
        $return[$user['service']][$user['host']]=$user['rolle'];
        unset($user['rolle']);
      }
    }
    
    
    return $return;
  }
  
  function may_post_videos_on($simple_yth_user) {
    $return = null;
    $tmp=$this->get_rights($simple_yth_user);
    foreach ($tmp as $t_service => $tmp2) {
      foreach ($tmp2 as $t_host => $tmp3) {
        foreach ($tmp3 as $t_recht => $is) {
          if ($t_recht=='recht_own_videos' && $is==1) {
            $return[$t_service][$t_host]="0";
            $tmp_channel_to_post=$this->db->sql_select("`bot_chathosts`","channel_video","service='".$t_service."' AND host='".$t_host."'");
            if ($tmp_channel_to_post[0]['channel_video']!="") {
              $return[$t_service][$t_host]=$tmp_channel_to_post[0]['channel_video'];
            }
          }
        }
      }
    }
    return $return;
  }
  
  function multiarray2array($array, $last_key="") {
    //$return_array=array();
    
    foreach ($array as $key => $value) {
      if (is_array($value)) {
        $temp_array=$this->multiarray2array($value, $key);
        foreach ($temp_array as $tkey => $tvalue) {
          if ($last_key!="") {
            $return_array[$last_key.'_'.$tkey]=$tvalue;
          } else {
            $return_array[$tkey]=$tvalue;
          }
        }
      } else {
        if ($last_key!="") {
          $return_array[$last_key.'_'.$key]=$value;
        } else {
          $return_array[$key]=$value;
        }
      }
    }
    return $return_array;
  }
}
?>
