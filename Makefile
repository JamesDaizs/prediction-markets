.PHONY: collect process data dev build

# Refresh Surf token and collect all data
collect:
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
