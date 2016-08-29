<?php
// Check to ensure that the access token was successfully acquired.

		// Call the channels.list method to retrieve information about the
		// currently authenticated user's channel.
		$channelsResponse = $youtube->channels->listChannels('id, snippet, statistics, brandingSettings', array('mine' => 'true',));
		
		$htmlBody = '';
		foreach ($channelsResponse['items'] as $channel) { 
			//$channel["id"]="UC5DOhI70dI3PnLPMkUsosgw";
			//echo "<pre>".var_dump($channel)."</pre>";
			
			echo "<h2>".$channel["snippet"]["title"]." (".$channel["id"].")</h2>";
			//echo "<center>";
			//echo "<img src='".$channel["brandingSettings"]["image"]["bannerTvImageUrl"]."'><br><br>";
			//echo "<img src='".$channel["brandingSettings"]["image"]["bannerMobileImageUrl"]."'><br><br>";
			//echo "</center>";
			$playlistsResponse = $youtube->playlists->listPlaylists('snippet', array('channelId' => $channel["id"],'maxResults' => 50));
		
		foreach ($playlistsResponse["items"] as $playlist) {
			//echo "<u>";
			//echo $playlist["id"];
			//echo " - ";
			//echo $playlist["snippet"]["title"];
			//echo "</u><br>";
			
			$playlistItemsResponse = $youtube->playlistItems->listPlaylistItems('snippet', array('playlistId' => $playlist["id"] ,'maxResults' => 50));
			 
			//echo "<table>";
			foreach ($playlistItemsResponse['items'] as $playlistItem) {
				 $videoResponse = $youtube->videos->listVideos("snippet, statistics" , array('id' => $playlistItem['snippet']['resourceId']['videoId']));
				 
				 $tmp_pl[$playlist["id"]]["time"]=0;
				 $tmp_pl[$playlist["id"]]["name"]=$playlist["snippet"]["title"];
				 //echo "<pre>";
				 //echo var_dump( $videoResponse["items"] );
				 //echo "</pre>";
				 foreach ($videoResponse["items"] as $video) {
				 	if ( $tmp_pl[$playlist["id"]]["time"]<= strtotime($video["snippet"]["publishedAt"]) ) {
				 		 $tmp_pl[$playlist["id"]]["time"]=strtotime($video["snippet"]["publishedAt"]) ;
				 		 $tmp_pl[$playlist["id"]]["thumb"]=$video["snippet"]["thumbnails"]["default"]["url"];
				 	}
				 	/*echo "<tr>";
					echo "<td>".$video ["snippet"] ["title"]."</td>";
					echo "<td>".$video["snippet"]["publishedAt"]."</td>";   
					echo "<td>".strtotime($video["snippet"]["publishedAt"])."</td>";
					echo "<td><img src='".$video["snippet"]["thumbnails"]["default"]["url"]."'></td>";
					echo "</tr>"; */
				 }
			}
			//echo '</table>';
			}
			$stdpl[0]["time"]=0;
			$stdpl[1]["time"]=0;
			$stdpl[2]["time"]=0;
			$stdpl[3]["time"]=0;
			foreach ($tmp_pl as $pl) {
				$pl_tmp=$pl;
				for ($i=0;$i<4;$i++) {
					if ($pl_tmp["time"]>$stdpl[$i]["time"]) {
						$pltmp=$stdpl[$i];
						$stdpl[$i]=$pl_tmp;
						$pl_tmp=$pltmp;
						unset($pltmp);
					}
				}
			}
			
			@unlink("img/".$channel["id"]."_channel.png");
			//@unlink("img/".$channel["id"]."_pl1.png");
			//@unlink("img/".$channel["id"]."_pl2.png");
			//@unlink("img/".$channel["id"]."_pl3.png");
			//@unlink("img/".$channel["id"]."_pl4.png");
			
			$contents=file_get_contents($channel["brandingSettings"]["image"]["bannerTvImageUrl"]);
			$savefile = fopen("img/".$channel["id"]."_channel.png", "w");
			fwrite($savefile, $contents);
			fclose($savefile);
			/*
			foreach ($stdpl as $key => $value) {
				if ($value["time"]>0) {
					$contents=file_get_contents($value["thumb"]);
					$savefile = fopen("img/".$channel["id"]."_pl".($key+1).".png", "w");
					fwrite($savefile, $contents);
					fclose($savefile);
					//echo "<img src='img/".$channel["id"]."_pl".($key+1).".png'>&nbsp;";
				}
			}
			*/
			
			/*echo "<pre>";
			echo var_dump( gd_info() );
			echo "</pre>";*/
			
			/*
			$nb = imagecreatefromstring ('img/'.$channel["id"].'_channel.png');
			//$plsrc = ImageCreateFromPNG ('img/pl1.png');

			imagecopymerge($nb, $plsrc, 10, 10, 0, 0, 100, 47, 75);
			
			imagepng($nb, "img/".$channel["id"]."_channel.new.png");
			echo "<img src='img/".$channel["id"]."_channel.new.png'>";
			*/
			
			//$img1 = new \Imagick();
			$img1 = new Imagick('img/'.$channel["id"].'_channel.png');
			/*$img2 = new Imagick('img/'.$channel["id"].'_pl1.png');
			$img3 = new Imagick('img/'.$channel["id"].'_pl2.png');
			$img4 = new Imagick('img/'.$channel["id"].'_pl3.png');
			$img5 = new Imagick('img/'.$channel["id"].'_pl4.png');*/
			
			$bereich["width"]=1280;
			$bereich["height"]=350;
			//$img1->getImageWidth();
			
			$begin_mobile["x"]=$img1->getImageWidth()/2-$bereich["width"]/2;
			$begin_mobile["y"]=$img1->getImageHeight()/2-$bereich["height"]/2;
			
			$end_mobile["x"]=$begin_mobile["x"]+$bereich["width"]/*-$img2->getImageWidth()*/;
			$end_mobile["y"]=$begin_mobile["y"]+$bereich["height"]/*-$img2->getImageHeight()*/;
			
			
			/*$img1->compositeImage($img2, \Imagick::COMPOSITE_ATOP, $begin_mobile["x"], $begin_mobile["y"]);
			$img1->compositeImage($img3, \Imagick::COMPOSITE_ATOP, $end_mobile["x"], $begin_mobile["y"]);
			$img1->compositeImage($img4, \Imagick::COMPOSITE_ATOP, $begin_mobile["x"], $end_mobile["y"]);
			$img1->compositeImage($img5, \Imagick::COMPOSITE_ATOP, $end_mobile["x"], $end_mobile["y"]);*/
			
			$draw = new ImagickDraw();
			$draw->setStrokeColor("white");
			$draw->setFillColor("black");
			
			$draw->setStrokeWidth(1);
			$draw->setFontSize(40);
			
			$text = "Aktuelle Projekte \n- ". $stdpl[0]["name"]."\n- ". $stdpl[1]["name"]."\n- ". $stdpl[2]["name"]."\n- ". $stdpl[3]["name"] ;
			//$draw->setFont("../fonts/Arial.ttf");
			
			$img1->annotateimage($draw, $begin_mobile["x"]+15, $end_mobile["y"]/*+$img2->getImageHeight()*/+45, 0, $text);
			
			$img1->cropImage($bereich["width"]-1, $bereich["height"]+230, $begin_mobile["x"], $begin_mobile["y"]);
			$img1->scaleImage(720, 0);

			$img1->writeImage("img/".$channel["id"]."_channel.new.png");
			
			 echo "<br><br><img src='img/".$channel["id"]."_channel.new.png'><br>";
		}
?>