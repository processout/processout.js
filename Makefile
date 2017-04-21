BINS=bin/forge.min.js bin/base64.polyfill.min.js bin/object.assign.polyfill.min.js
MODALJS=scripts/modal.js
PROCESSOUTJS=scripts/processout.js

.PHONY: build
build:
	tsc -p src/processout/
	tsc -p src/modal/
	mv ${MODALJS} ${MODALJS}_tmp
	cat ${BINS} ${MODALJS}_tmp > ${MODALJS}
	rm ${MODALJS}_tmp
	mv ${PROCESSOUTJS} ${PROCESSOUTJS}_tmp
	cat ${BINS} ${PROCESSOUTJS}_tmp > ${PROCESSOUTJS}
	rm ${PROCESSOUTJS}_tmp

.PHONY: test
test: ENV=testing
test: build clean

.PHONY: concourse
concourse:
	fly -t processout set-pipeline -p processoutjs -c ci/concourse.yml

.PHONY: clean
clean:
	rm -f scripts/*
