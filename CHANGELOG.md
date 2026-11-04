# Changelog

## 0.2.0 - 2026-11-02

- Reworded search as web search in the plugin and marketplace descriptions,
  README, and skills.
- Updated the `mrscraper-serp` skill for MrScraper MCP server 0.3.0, which
  moved `webSearch` to MrScraper's new web search endpoint. Results are a
  ranked list (rank, title, url, description, source); `region` sets the
  results' country and the new `num_results` asks for 10 to 100 results. The
  `raw`, `format`, `language`, `page`, and `render_js` options are gone, and
  so is the search results URL example.
- Corrected the scopes in the `mrscraper` skill and README: `scraperAPI` needs
  `scrape:write`, `webSearch` needs `scrape:read`, and `status` needs
  `account:read`.
- The skills now match the MrScraper Claude plugin 0.3.0 apart from link style.

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
