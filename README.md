ProcessOut.js
=====================

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
<script src="https://js.processout.com/modal.js"></script>
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
<script src="https://js.processout.com/processout.js"></script>
```

### Usage

The modal previously seen is directly built on ProcessOut.js, which helps you directly interact with the modal.

#### Creating a ProcessOut instance

The resource ID may be of an invoice (`iv_*`), subscription (`sub_*`) or authorization request (`auth_req_*`).
The resource ID may also be left empty if none is needed.

```js
var processOut = new ProcessOut.ProcessOut("resource-id");
```

#### Create a modal object and interact with it

```js
processOut.newModal('https://checkout.processout.com/uid',
function(modal) {
	// The modal is now ready, we may show it to the customer
	modal.show();

	// callbacks may also be passed to show():
	modal.show(function(modal) {
		// On Shown

	}, function(modal) {
		// On hidden

	}, function(error) {
		// Error

	})

	// ...
	// For some reason, we want to hide the modal from the customer
	modal.hide();

}, function(err) {

});
```

-------------------------

Full API documentation
----------------------

### Apiary

The ProcessOut's full API documentation can be found on [our documentation](https://docs.processout.com). It contains all the needed information, including callback data, and much more.
