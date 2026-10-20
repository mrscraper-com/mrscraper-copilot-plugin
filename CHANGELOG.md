# Changelog

## 0.1.0 - 2026-10-16

- First release of the MrScraper plugin for GitHub Copilot CLI, in the Agent
  Plugins 1.0 format.
- Hosted MCP server `https://mcp.mrscraper.com/mcp` (Streamable HTTP, OAuth 2.1
  with dynamic client registration) exposing `scraperAPI`, `webSearch`, and
  `status`.
- Skills: `mrscraper`, `mrscraper-fetch`, and `mrscraper-serp`.
- Marketplace file at `.github/plugin/marketplace.json` for
  `copilot plugin install mrscraper@mrscraper`.
- CI that validates the manifests, installs the plugin with Copilot CLI, and
  runs the awesome-copilot external plugin quality gates.
