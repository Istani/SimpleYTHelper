<?php
$videos=$database->sql_select("videos_snippet LEFT JOIN videos_statistics ON videos_snippet.videoid=videos_statistics.videoid", "videos_snippet.*, videos_statistics.viewcount, videos_statistics.likecount", "channelid='".$_SESSION['user']['youtube_user']."' ORDER BY first_seen",true);

echo '<table class="videos with_borders">';
echo '<thead>';
echo '<tr>';
echo '<th>';
echo 'Lfd:';
echo '</th>';
echo '<th>';
echo 'Thumb:';
echo '</th>';
echo '<th>';
echo 'Title:';
echo '</th>';
echo '<th>';
echo 'Published on:';
echo '</th>';
echo '<th>';
echo 'Views:';
echo '</th>';
echo '<th>';
echo 'Likes:';
echo '</th>';
echo '</tr>';
echo '</thead>';
echo '<tbody>';

for ($count_videos=0;$count_videos<count($videos);$count_videos++) {
  $this_video=$videos[$count_videos];
  echo '<tr>';
  echo '<td>'.($count_videos+1).'</td>';
  echo '<td><img src="'.$this_video['thumbnail'].'"></td>';
  echo '<td>'.$this_video['title'].'</td>';
  echo '<td>'.date("d.m.Y",$this_video['first_seen']).'</td>';
  echo '<td>'.$this_video['viewcount'].'</td>';
  echo '<td>'.$this_video['likecount'].'</td>';
  echo '</tr>';
}
echo '</tbody>';
echo '</table>';
echo '<br>';
?>
<script>
$( document ).ready(function() {
  
  
  $('.videos').DataTable({
    "paging":   true,
    "pagingType": "full_numbers",
    "pageLength": 10,
    "ordering": true,
    "info":     false,
    "searching": false
  });
} );
</script>
