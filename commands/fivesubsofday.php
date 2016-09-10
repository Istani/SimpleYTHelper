<?
// Getting Random SUB Name
	
	// incs
	require 'inc/php_inc.php';
	
	$time=time();
	$time_min=(int)$time/60;
	$time_std=(int)$time_min/60;
	$time_day=(int)$time_std/24;
	
	$output[0]=0;
	$output[1]="";
	$output[2]="";
	$output[3]="";
	$output[4]="";
	$output[5]="";
	
	$FiveSubs="data/".$KANALID.".5subs";
	
if(!file_exists($FiveSubs)) {
	 $tmp=fopen($FiveSubs,"w+");
	 	$text_sub=implode("|#*#|",$output);
	 	 fwrite($tmp, $text_sub);
	fclose($tmp);
}

$tmp = fopen($FiveSubs,"r+") or die("Unable to load SubData!");
		$file_subs = fread($tmp,filesize($FiveSubs));
		fclose($tmp);
		$fsinput=explode( "|#*#|", $file_subs);
	
if ($fsinput[0]<$time_day) {

if(!file_exists("data/".$KANALID.".subs")){
	$tmp=fopen("data/".$KANALID.".subs","w+");
	fclose($tmp);
}
$file="data/".$KANALID.".subs";
$myfile = fopen($file,"r+") or die("Unable to load SubData!");
		$file_subs = fread($myfile,filesize($file));
		fclose($myfile);
		$arr_subs=explode( "|#*#|", $file_subs);

	shuffle($arr_subs);
	$output[0]=$time_day;
	$output[1]=$arr_subs[0];
	$output[2]=$arr_subs[1];
	$output[3]=$arr_subs[2];
	$output[4]=$arr_subs[3];
	$output[5]=$arr_subs[4];
	
	 $tmp=fopen($FiveSubs,"w+");
	 	$text_sub=implode("|#*#|",$output);
	 	 fwrite($tmp, $text_sub);
	fclose($tmp);
	 $fsinput=$output;
	}
	
	for ($i=1;$i<=5;$i++) {
		echo $fsinput[$i].", ";
	}
	
?>