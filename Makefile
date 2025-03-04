all: build

setup: clean setup-web setup-py setup-docs ## Install dependencies

build: web py docs ## Build everything

clean: clean-docs clean-py clean-web ## Clean everything

setup-web: ## Install dependencies for web
	cd web && npm ci

.PHONY: web
web: ## Build web
	cd web && npm run build

clean-web: ## Clean web dependencies
	cd web && rm -rf build node_modules

setup-py: ## Install dependencies for Python
	cd py && $(MAKE) setup

.PHONY: py
py: ## Build Python
	cd py && $(MAKE) build

clean-py: ## Clean Python dependencies
	cd py && $(MAKE) clean

setup-docs: ## Set up docs for development mode
	mkdir -p tools/docs && cd tools/docs && python3 -m venv venv
	./tools/docs/venv/bin/python -m pip install --upgrade pip mkdocs-material

.PHONY: docs
docs: ## Build docs
	./tools/docs/venv/bin/mkdocs build

clean-docs: ## Clean docs
	rm -rf tools/docs/venv

serve-docs: # Launch docs in development mode
	./tools/docs/venv/bin/mkdocs serve

release: # Tag and release on Github
	git tag v$(VERSION)
	git push origin && git push origin --tags
	gh release create v$(VERSION) \
		py/dist/h2o_nitro-$(VERSION)-py3-none-any.whl \
		--prerelease \
		--notes "[Change Log](https://nitro.h2o.ai/change-log/)"

publish-py: ## Publish wheel to PyPI
	cd py && $(MAKE) publish

publish-docs: docs ## Publish docs
	aws s3 sync site s3://nitro.h2o.ai --delete
	aws cloudfront create-invalidation --distribution-id ${AWS_CLOUDFRONT_ID} --paths "/*"

help: ## List all make tasks
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

