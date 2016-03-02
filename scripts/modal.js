var startProcessOut = function () {
    var processOut = new ProcessOut.ProcessOut('');
    (function ($) {
        // Loop through each modal button
        $('.processout-modal-button').each(function () {
            var button = $(this);
            var loading = true;
            processOut.urlModal(button.attr('href'), function (modal) {
                button.on('click', function () {
                    loading = false;
                    modal.show();
                    return false;
                });
            }, function (err) {
                loading = false;
                window.location.href = button.attr('href');
            });
            button.on('click', function () {
                // We want to retry until the iframe finished loading, or failed
                // to load
                if (loading)
                    setTimeout(function () {
                        button.trigger('click');
                    }, 500);
                return false;
            });
        });
    }(jQuery));
};
startProcessOut();
