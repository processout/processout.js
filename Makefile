.PHONY: build
build:
	tsc -p src/processout/
	tsc -p src/modal/

.PHONY: test
test: ENV=testing
test: build clean

.PHONY: concourse
concourse:
	fly -t processout set-pipeline -p processoutks -c ci/concourse.yml --load-vars-from ci/concourse-secret.yml

.PHONY: clean
clean:
	rm -f scripts/*
