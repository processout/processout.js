ProcessOut.js
=====================

Dependencies
------------

* jQuery 2.*

-------------------------


Modal
----------------

The ProcessOut Javascript modal allows developers to directly integrate the ProcessOut
payment gateways into their pages. Instead of redirecting to a new checkout page,
customers are prompted with a great modal box, making their experience more
fluid.

The integration of this modal has been made very easy to ensure that the customer's
checkout flow stays as fluid as possible.

### Prerequisites

#### Add the ProcessOut script tag
``` html
<script src="https://cdn.processout.com/modal-min.js"></script>
```

Make sure that jQuery is also included (on top of the ProcessOut script tag)
``` html
<script src="https://code.jquery.com/jquery-2.1.3.min.js"></script>
```

### Usage

The href attribute of your elements is used to generate the modal, which makes
it very easy to support invoices, tailored invoices, recurring invoices
and authorization modals.

Add the `processout-modal-button` to automatically bind the click event to
the ProcessOut modal.

``` html
<a class="processout-modal-button"
	href="https://checkout.processout.com/c5e71254-866e-45ed-9b85-8f8aa7b6044d">
		Pay now a simple invoice!
</a>
<a class="processout-modal-button"
	href="https://checkout.processout.com/t-c5e71254-866e-45ed-9b85-8f8aa7b6044d">
		Pay now a tailored invoice!
</a>
<a class="processout-modal-button"
	href="https://checkout.processout.com/recurring-invoice/c5e71254-866e-45ed-9b85-8f8aa7b6044d">
		Pay now a recurring invoice!
</a>
<a class="processout-modal-button"
	href="https://checkout.processout.com/authorization/c5e71254-866e-45ed-9b85-8f8aa7b6044d/customers/c5e71254-866e-45ed-9b85-8f8aa7b6044d">
		Authorize now!
</a>
```

ProcessOut.js
-------------

### Prerequisites

#### Add the ProcessOut script tag
``` html
<script src="https://cdn.processout.com/processout-min.js"></script>
```

Make sure that jQuery is also included (on top of the ProcessOut script tag)
``` html
<script src="https://code.jquery.com/jquery-2.1.3.min.js"></script>
```

### Usage

The modal previously seen is directly built on ProcessOut.js, which helps you directly interact with the modal.

#### Creating a ProcessOut instance

```js
var processOut = new ProcessOut.ProcessOut('projectID');
```

#### Create a modal object and interact with it

```js
processOut.newModal('https://checkout.processout.com/uid',
function(modal) {
	// The modal is now ready, we may show it to the customer
	modal.show();

	// callbacks may also be passed to show():
	modal.show(function(m) {
		// On Shown

	}, function(m) {
		// On hidden

	}, function(e) {
		// Error

	})

	// ...
	// For some reason, we want to hide the modal from the customer
	modal.hide();

}, function(err) {

});
```

#### White-label integration

ProcessOut.js also provides you with a way to completely blend your ProcessOut integration in your website, without any ProcessOut branding.

```js
// We are going to have two gateways with forms: Stripe, Gocardless
// Stripe: cc-name, cc-number, cc-expiry, cc-cvv
// Gocardless: IBAN
// and the rest is going to be links

processOut.setTemplates({
	'credit-card': '...',
	'sepa': '...',
	'link': '<a href="#">{gateway_name}</a>'
});

function success(gatewayName) {
	alert('Payment success for gateway: '+gatewayName);
}

function error() {
	alert('Oops.. an error occurred during the customer checkout.');
}

processOut.findInvoice('uid', function(invoice) {
	var gateways = invoice.gateway();
	for (i = 0; i < gateways.length; i++) {
		var form = gateways[i].appendTo($('#gateways-wrapper'));
		gateways[i].hook(form, success, error);
	}
});
```

-------------------------

Full API documentation
----------------------

### Apiary

The ProcessOut's full API documentation can be found on [Apiary](http://docs.processout.apiary.io). It contains all the needed information, including callback data, and much more.
