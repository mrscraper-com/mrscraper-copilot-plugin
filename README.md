# MrScraper for GitHub Copilot CLI

MrScraper connects [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-cli)
to a hosted MCP server that retrieves public web pages as HTML, Markdown, or
screenshots, discovers pages through Google search, and reports account usage.
The plugin also includes three skills that tell the agent which tool to use and
to keep the raw page content as the source for summaries and local extraction.

## What this plugin adds

- The `mrscraper` MCP server: Streamable HTTP at `https://mcp.mrscraper.com/mcp`.
- OAuth 2.1 sign-in through Copilot CLI's MCP client, with dynamic client
  registration. This repository stores no credentials.
- Skills: `mrscraper`, `mrscraper-fetch`, and `mrscraper-serp`.

The plugin uses the [Agent Plugins 1.0](https://agent-plugins.org/specification)
layout: `plugin.json`, `mcp.json`, and `skills/` in `plugins/mrscraper`.

## When to use it

Copilot CLI's built-in `web_fetch` tool and web search are enough for many
public pages. This plugin helps when a task needs more control over retrieval:

- Pages that render their content with JavaScript, or that need a CSS selector
  to appear before the content is read.
- Content that differs by country, with retries and a per-request token cap.
- A screenshot of the page saved as an image file.
- Google results as structured JSON (organic results, related questions, and
  pagination) for a chosen region, language, and results page.

It retrieves pages; it does not drive a browser session. For clicking, form
filling, or signed-in flows, use Playwright or another browser automation tool.

## Requirements

- GitHub Copilot CLI. Installation was tested with 1.0.98.
- A [MrScraper](https://app.mrscraper.com) account.
- A local browser for the OAuth sign-in.
- Permission to access and process the target content.

## Install

```bash
copilot plugin marketplace add mrscraper-com/mrscraper-copilot-plugin
copilot plugin install mrscraper@mrscraper
```

Confirm what the plugin loaded:

```bash
copilot plugin list
copilot mcp list      # Plugin servers: mrscraper (http)
copilot skill list    # mrscraper, mrscraper-fetch, mrscraper-serp
```

In an interactive session, `/plugin list`, `/mcp list`, and `/skills list` show
the same information.

## Sign in

Start `copilot` and run:

```text
/mcp auth mrscraper
```

Copilot CLI discovers MrScraper's authorization server, registers itself, and
opens your browser. Approve access on the MrScraper consent page; Copilot CLI
stores and refreshes the tokens. Until you sign in, Copilot CLI reports that
the `mrscraper` server requires authentication. Never paste OAuth tokens or API
keys into the chat.

`/mcp show mrscraper` then lists these tools:

| Tool | Purpose |
| --- | --- |
| `scraperAPI` | Retrieve a known page as HTML, Markdown, a screenshot, or a combination. |
| `webSearch` | Discover public pages through Google. |
| `status` | Inspect subscription status, token usage, and remaining tokens. |

The OAuth scopes are `scrape:read` (`scraperAPI` and `webSearch`) and
`account:read` (`status`).

## Try it

```text
Fetch https://www.scrapethissite.com/pages/simple/ as Markdown and list the five most populous countries.
```

```text
Search Google for open source web scraping libraries and compare the top five results.
```

```text
How many MrScraper tokens do I have left this month?
```

Copilot CLI asks for approval before it runs MCP tools. To approve the
MrScraper tools for one non-interactive run, pass `--allow-tool='mrscraper'`:

```bash
copilot -p "Fetch https://example.com as Markdown and summarize it." --allow-tool='mrscraper'
```

## Retrieve-first routing

When a public URL is already known, the skills direct the agent to retrieve it
with `scraperAPI` first and treat the raw response as the source of truth. The
agent can then read, summarize, compare, or derive structured output locally
without losing details. When no URL is known, `webSearch` finds candidate pages
first.

## API key fallback

Use OAuth whenever possible. If OAuth cannot complete, for example on a machine
without a browser, create an [API key](https://app.mrscraper.com/api-tokens),
export it as `MRSCRAPER_API_KEY`, add a user-level server under a different
name, and disable the plugin's OAuth server so the tools are not listed twice:

```bash
copilot mcp add --transport http \
  --header "Authorization: Bearer $MRSCRAPER_API_KEY" \
  mrscraper-api-key https://mcp.mrscraper.com/mcp
copilot mcp disable mrscraper
```

The skills match tools by name, so they keep working with either server. An
API key carries full account authority, and `copilot mcp add` writes the header
to `~/.copilot/mcp-config.json` in plain text; never add it to a project's
`.mcp.json` or `.github/mcp.json` that is committed. To return to OAuth, run
`copilot mcp remove mrscraper-api-key` and `copilot mcp enable mrscraper`.

## Data and permissions

The plugin sends MCP tool inputs, including target URLs and search queries, to
MrScraper's hosted service. Page responses and tool results are then available
to the agent for the requested task. Use it only with public or otherwise
authorized content, and follow the target site's requirements.

Review MrScraper's [MCP documentation](https://docs.mrscraper.com/docs/getting-started/mcp-server),
[Privacy Policy](https://mrscraper.com/privacy-policy),
[Terms of Use](https://mrscraper.com/terms-of-use), and
[Acceptable Use Policy](https://mrscraper.com/acceptable-use-policy) before use.

## Update or remove

```bash
copilot plugin update mrscraper
copilot plugin uninstall mrscraper
copilot plugin marketplace remove mrscraper
```

## Support and security

- Product help: [MrScraper MCP documentation](https://docs.mrscraper.com/docs/getting-started/mcp-server)
- Bugs and feature requests: [GitHub Issues](https://github.com/mrscraper-com/mrscraper-copilot-plugin/issues)
- Account help: [support@mrscraper.com](mailto:support@mrscraper.com)
- Security reports: see [SECURITY.md](SECURITY.md)

## Development

```text
.github/plugin/marketplace.json   marketplace with one plugin entry
plugins/mrscraper/plugin.json     Agent Plugins 1.0 manifest
plugins/mrscraper/mcp.json        hosted MCP server (Streamable HTTP, OAuth)
plugins/mrscraper/skills/         mrscraper, mrscraper-fetch, mrscraper-serp
.github/scripts/check-plugin.mjs  repository checks used by CI
```

Install a local checkout and confirm that it loads:

```bash
copilot plugin marketplace add ./
copilot plugin install mrscraper@mrscraper
copilot mcp get mrscraper
copilot skill list
node .github/scripts/check-plugin.mjs .
```

A plugin installed from a local marketplace is loaded live from the checkout,
so edits take effect in the next session. CI validates `plugin.json` and
`mcp.json` against the Agent Plugins 1.0 schemas, runs the repository checks,
installs the plugin with Copilot CLI, and runs the
[awesome-copilot](https://github.com/github/awesome-copilot) external plugin
quality gates (spec compliance, `vally lint`, install smoke test, and version
match).

The skills are copied from the canonical MrScraper MCP skills, with links to
sibling skills written as skill names because `vally lint` only accepts file
references inside a skill's own directory. Keep the version in `plugin.json`
and `.github/plugin/marketplace.json` in step, and record user-visible changes
in [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE)
