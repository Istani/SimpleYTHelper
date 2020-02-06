$(document).ready(function() {
  $(".news_list-container").DataTable({
    ordering: false,
    info: false,
    searching: false,
    pageLength: 8,
    lengthChange: false,
    pagingType: "full_numbers",
    //stateSave: true,

    language: {
      url: "//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/German.json"
    }
  });

  $(".game_list-container").DataTable({
    ordering: false,
    info: false,
    searching: true,
    pageLength: 24,
    lengthChange: false,
    pagingType: "full_numbers",
    //stateSave: true,

    language: {
      url: "//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/German.json"
    }
  });

  document.getElementById("content").style.display = "block";
});
