SHELL := /bin/sh

NPM ?= npm
PYTHON ?= python3
LAB_RUNNER := $(PYTHON) scripts/lab.py

.DEFAULT_GOAL := help

.PHONY: help install dev build preview lint test verify audit \
	doctor lab-setup lab-setup-local lab-quickstart seed dbt-run dbt-test \
	dbt-build docs services-up services-down postgres-build mysql-pipeline \
	uci-import uci-build uci-sample synthetic status clean

help: ## Show the available commands
	@awk 'BEGIN {FS = ":.*## "; printf "DBT Forge commands:\n\n"} /^[a-zA-Z0-9_-]+:.*## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install frontend dependencies
	$(NPM) install

dev: ## Start the Vite development server
	$(NPM) run dev

build: ## Create the production frontend build
	$(NPM) run build

preview: build ## Preview the production frontend build
	$(NPM) run preview

lint: ## Run TypeScript validation
	$(NPM) run lint

test: ## Run the frontend and course-contract tests
	$(NPM) test

verify: lint test build ## Run all frontend quality gates
	docker compose config --quiet

audit: ## Check installed npm dependencies for known vulnerabilities
	$(NPM) audit --audit-level=high

doctor: ## Check Docker/dbt lab prerequisites
	$(LAB_RUNNER) doctor

lab-setup: ## Build the Docker dbt image and install packages
	$(LAB_RUNNER) setup

lab-setup-local: ## Create a local Python environment for dbt
	$(LAB_RUNNER) setup --local

lab-quickstart: ## Prepare and build the default DuckDB course project
	$(LAB_RUNNER) quickstart

seed: ## Load the deterministic course seeds
	$(LAB_RUNNER) seed

dbt-run: ## Run dbt models; optionally pass SELECT=model+
	$(LAB_RUNNER) run $(if $(SELECT),--select "$(SELECT)",)

dbt-test: ## Run dbt tests; optionally pass SELECT=model+
	$(LAB_RUNNER) test $(if $(SELECT),--select "$(SELECT)",)

dbt-build: ## Build the dbt graph; optionally pass SELECT=model+
	$(LAB_RUNNER) build $(if $(SELECT),--select "$(SELECT)",)

docs: ## Generate and serve dbt documentation
	$(LAB_RUNNER) docs-generate
	$(LAB_RUNNER) docs-serve

services-up: ## Start PostgreSQL and MySQL lab services
	$(LAB_RUNNER) services-up

services-down: ## Stop PostgreSQL and MySQL lab services
	$(LAB_RUNNER) services-down

postgres-build: ## Build the complete dbt project in PostgreSQL
	$(LAB_RUNNER) postgres-build

mysql-pipeline: ## Load MySQL, extract it, and build the DuckDB warehouse
	$(LAB_RUNNER) load-mysql
	$(LAB_RUNNER) extract-mysql
	$(LAB_RUNNER) build-extract

uci-import: ## Download and prepare the full UCI Online Retail dataset
	$(LAB_RUNNER) import-uci

uci-build: ## Build models from the downloaded full UCI dataset
	$(LAB_RUNNER) build-uci

uci-sample: ## Build models from the bundled 750-row UCI sample
	$(LAB_RUNNER) build-uci-sample

synthetic: ## Regenerate the deterministic synthetic commerce fixtures
	$(LAB_RUNNER) generate-synthetic

status: ## Show the current lab database status
	$(LAB_RUNNER) status

clean: ## Remove generated dbt artifacts and the DuckDB warehouse
	$(LAB_RUNNER) clean
