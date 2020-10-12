# ProcessOut.js
=====================

The ProcessOut's full API documentation can be found on [our documentation](https://docs.processout.com).
You can also find ProcessOut.js specific documentation for [card fields](https://docs.processout.com/payments/processoutjs/) and [modals](https://docs.processout.com/payments/payment-modal/).

## Building

To compile the code in this repository you will need ensure Node, NPM, TypeScript and Uglify are installed on your machine. This can be done by running the following commands on your terminal:

``` bash
brew install node
node -v
npm -v

sudo npm install typescript uglify-js -g
tsc -v
```

After that, changes to the code can be compiled with the command `make build`. **This should be done before changes are merged into master**.
