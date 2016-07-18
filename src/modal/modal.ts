/// <reference path="../references.ts" />

var startProcessOut = function() {
    // The project ID is not required for a simple modal use
    var processOut = new ProcessOut.ProcessOut("");

    // Loop through each modal button
    var buttons = document.querySelectorAll(".processout-modal-button");
    for (var i in buttons) {
        var button = buttons[i];
        var loading   = false;
        var modal     = null;
        button.addEventListener("onmouseover", function() {
            if (loading || (modal != null && ! modal.isDeleted()))
                return;

            loading = true;
            modal   = processOut.newModal(button.getAttribute("href"), function(modal) {
                button.addEventListener("onclick", function() {
                    if (modal.isDeleted())
                        return;

                    loading = false;
                    document.body.style.cursor = "auto";
                    modal.show();
                });
            }, function(err) {
                console.log("Could not properly load the modal");
                button.addEventListener("onclick", function() {
                    loading = false;
                    document.body.style.cursor = "auto";
                    window.location.href = button.getAttribute("href");
                });
            });
        });

        button.addEventListener("onclick", function() {
            if (! loading)
                return false;

            document.body.style.cursor = "wait";
            setTimeout(function () {
                (<HTMLElement>button).click();
            }, 500);

            return false;
        });
    };
}
startProcessOut();
