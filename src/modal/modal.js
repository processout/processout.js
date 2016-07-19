/// <reference path="../references.ts" />
(function () {
    // The project ID is not required for a simple modal use
    var processOut = new ProcessOut.ProcessOut("");
    // Loop through each modal button
    var buttons = document.querySelectorAll(".processout-modal-button");
    for (var i = 0; i < buttons.length; i++) {
        var handleButton = function () {
            var button = buttons[i];
            var loading = false;
            var modal = null;
            var preclick = function () {
                if (!loading)
                    return false;
                document.body.style.cursor = "wait";
                setTimeout(function () {
                    button.click();
                }, 500);
                return false;
            };
            button.onmouseover = function () {
                if (loading || (modal != null && !modal.isDeleted()))
                    return;
                var error = function (err) {
                    console.log("Could not properly load the modal");
                    console.log(err);
                    window.location.href = button.getAttribute("href");
                };
                loading = true;
                modal = processOut.newModal(button.getAttribute("href"), function (modal) {
                    button.onclick = function () {
                        if (modal.isDeleted())
                            return false;
                        loading = false;
                        document.body.style.cursor = "auto";
                        modal.show();
                        button.onclick = preclick;
                        return false;
                    };
                }, error);
            };
            button.onclick = preclick;
        };
        handleButton();
    }
    ;
})();
