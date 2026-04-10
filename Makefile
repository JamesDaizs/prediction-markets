.PHONY: collect collect-surf collect-detailed collect-legacy process data dev build

# Collect data using surf CLI (fast)
collect:
	./scripts/collect_surf.sh

# Collect detailed data using surf CLI (Python)
collect-surf:
	cd scripts && python collect_surf.py

# Collect legacy data using internal API
collect-legacy:
	surf refresh
	cd scripts && uv run python collect.py

# Process raw data into dashboard-ready JSON
process:
	cd scripts && uv run python process.py

# Copy processed data to frontend public dir
copy:
	cp -r data/processed/* public/data/

# Full data pipeline: collect → process → copy
data: collect process copy

# Start dev server
dev:
	pnpm dev

# Production build
build:
	pnpm build
