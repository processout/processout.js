.PHONY: build
build:
	tsc -p src/processout/
	tsc -p src/modal/
	mv scripts/modal.js scripts/modal.js_tmp
	cat bin/forge.min.js scripts/modal.js_tmp > scripts/modal.js
	rm scripts/modal.js_tmp
	mv scripts/processout.js scripts/processout.js_tmp
	cat bin/forge.min.js scripts/processout.js_tmp > scripts/processout.js
	rm scripts/processout.js_tmp

.PHONY: test
test: ENV=testing
test: build clean

.PHONY: concourse
concourse:
	fly -t processout set-pipeline -p processoutjs -c ci/concourse.yml

.PHONY: clean
clean:
	rm -f scripts/*
