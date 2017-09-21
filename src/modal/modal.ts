/// <reference path="../references.ts" />

(function() {
    // The projectID and resource ID are not required for a simple modal use
    var processOut = new ProcessOut.ProcessOut("", "");

    // Loop through each modal button
    var buttons = document.querySelectorAll(".processout-modal-button");
    for (var i = 0; i < buttons.length; i++) {
        var handleButton = function() {
            var button  = <HTMLElement>buttons[i];
            var loading = false;
            var modal   = null;

            var preclick = function() {
                if (!loading)
                    return false;

                document.body.style.cursor = "wait";
                setTimeout(function () {
                    (<HTMLElement>button).click();
                }, 500);

                return false;
            };

            button.onmouseover = function() {
                if (loading || (modal != null && !modal.isDeleted()))
                    return;

                var error = function(err) {
                    console.log("Could not properly load the modal");
                    console.log(err);
                    window.location.href = button.getAttribute("href");
                };

                loading = true;
                modal   = processOut.newModal({
                    url: button.getAttribute("href"),
                    onReady: function(modal) {
                        button.onclick = function() {
                            if (modal.isDeleted())
                                return false;
    
                            loading                    = false;
                            document.body.style.cursor = "auto";
                            modal.show({
                                onError: function(modal, err) {
                                    error(err);
                                }
                            });
    
                            button.onclick = preclick;
                            return false;
                        }
                    },
                    onError: error
                });
            }

            button.onclick = preclick;
        }
        handleButton();
    };
})();
