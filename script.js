// JavaScript source code

$("button").click(function () {
    $.ajax({
        type: "GET",
        url: "https://app.ticketmaster.com/discovery/v2/events.json?size=1&apikey=cjVxEkmYOiybMcalEsVx4GuYP3EC1Xns",
        async: true,
        dataType: "json",
        success: function (json) {
            console.log(json);
            // Parse the response.
            // Do other things.
        },
        error: function (xhr, status, err) {
            // This time, we do not end up here!
        }
    });
});