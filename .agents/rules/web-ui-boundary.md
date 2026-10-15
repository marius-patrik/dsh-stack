# Web UI boundary

DSH owns the native UI runtime and composition slots. Stack packages
contribute features through those public slots and service contracts.
A component rendering the same concept in multiple placements has one
owner and accepts placement as configuration. No independent application shell
or duplicate tab/settings/sidebar runtime is introduced.
