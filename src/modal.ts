var startProcessOut = function() {
    var processOut = new ProcessOut.ProcessOut('');

    (function( $ ) {
        // Loop through each modal button
        $('.processout-modal-button').each(function() {
            var button  = $(this);

            button.on('click', function() {
                var oldCursor = $('body').css('cursor');
                $('body').css('cursor', 'wait');
                processOut.urlModal(button.attr('href'), function(modal) {
                    $('body').css('cursor', oldCursor);
                    modal.show();
                }, function(err) {
                    console.log('Could not properly load the modal');
                    window.location.href = button.attr('href');
                });

                return false;
            });
        });

    }( jQuery ));
}
startProcessOut();
