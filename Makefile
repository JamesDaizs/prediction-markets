.PHONY: collect dev build install

# Refresh static dashboard data via the Surf CLI.
# Requires `surf` installed and `surf login` completed.
# See https://docs.asksurf.ai for installation.
collect:
	./scripts/collect_surf.sh

install:
	pnpm install

# Start dev server
dev:
	pnpm dev

# Production build
build:
	pnpm build
