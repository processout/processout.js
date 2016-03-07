var startProcessOut = function() {
    var processOut = new ProcessOut.ProcessOut('');

    (function( $ ) {
        // Loop through each modal button
        $('.processout-modal-button').each(function() {
            var button    = $(this);
            var loading   = false;
            var modal     = null;
            button.on('mouseover', function() {
                if (loading || (modal != null && ! modal.isDeleted()))
                    return;

                loading = true;
                modal   = processOut.urlModal(button.attr('href'), function(modal) {
                    button.on('click', function() {
                        if (modal.isDeleted())
                            return;

                        loading = false;
                        $('body').css('cursor', 'auto');
                        modal.show();
                    });
                }, function(err) {
                    console.log('Could not properly load the modal');
                    button.on('click', function() {
                        loading = false;
                        $('body').css('cursor', 'auto');
                        window.location.href = button.attr('href');
                    });
                });
            });

            button.on('click', function() {
                if (! loading)
                    return false;

                $('body').css('cursor', 'wait');
                setTimeout(function () {
                    button.trigger('click');
                }, 500);

                return false;
            });
        });

    }( jQuery ));
}
startProcessOut();
