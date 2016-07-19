.PHONY: build
build:
	echo "build"

.PHONY: test
test: ENV=testing
test:
	echo "test"

.PHONY: concourse
concourse:
	fly -t processout set-pipeline -p processoutks -c ci/concourse.yml --load-vars-from ci/concourse-secret.yml


.PHONY: clean
clean:
	rm -f scripts/*
