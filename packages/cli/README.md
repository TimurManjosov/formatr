# @formatr/cli

Command Line Interface for the [formatr](https://github.com/TimurManjosov/formatr) template library.

## Installation

```bash
npm install -g @formatr/cli
# or
npm install --save-dev @formatr/cli
```

## Quick Start

```bash
# Render a template
echo "Hello {name}!" | formatr render --data '{"name":"World"}'

# Validate templates
formatr validate ./templates --recursive

# Start the playground
formatr playground
```

## Commands

### `formatr render`

Render templates with provided data.

```bash
# Render from file with JSON data
formatr render template.fmt --data data.json --output result.txt

# Render from stdin
echo "Hello {name}!" | formatr render --data '{"name":"World"}'

# Render with YAML data
formatr render template.fmt --data config.yaml

# Render multiple templates
formatr render ./templates --data data.json --output-dir ./dist --recursive

# Watch mode
formatr render template.fmt --data data.json --watch
```

### `formatr validate`

Validate template syntax and structure.

```bash
# Validate single template
formatr validate template.fmt

# Validate directory
formatr validate ./templates --recursive

# Validate with context (check placeholders exist)
formatr validate template.fmt --context data.json

# Strict mode (treat warnings as errors)
formatr validate template.fmt --strict

# Output as JSON for CI
formatr validate template.fmt --json
```

### `formatr analyze`

Analyze template complexity and characteristics.

```bash
# Analyze single template
formatr analyze template.fmt

# Analyze with detailed metrics
formatr analyze template.fmt --detailed

# Compare multiple templates
formatr analyze template-v1.fmt template-v2.fmt --compare

# Output as JSON with threshold for CI
formatr analyze template.fmt --json --threshold complexity=10
```

### `formatr benchmark`

Benchmark template rendering performance.

```bash
# Basic benchmark
formatr benchmark template.fmt --data data.json

# Multiple iterations
formatr benchmark template.fmt --data data.json --iterations 10000

# Compare implementations
formatr benchmark template-v1.fmt template-v2.fmt --data data.json

# Memory profiling
formatr benchmark template.fmt --data data.json --memory

# Generate HTML report
formatr benchmark template.fmt --data data.json --report benchmark.html
```

### `formatr report`

Generate reports from templates and data.

```bash
# Generate HTML report
formatr report --template report.fmt --data results.json --format html

# Generate markdown report
formatr report --template report.fmt --data results.json --format markdown

# Batch report generation
formatr report --template report.fmt --data-dir ./data --output-dir ./reports

# Custom styles
formatr report --template report.fmt --data data.json --format html --style custom.css
```

### `formatr watch`

Watch templates and data files for changes.

```bash
# Watch single template
formatr watch template.fmt --data data.json --output result.txt

# Watch directory
formatr watch ./templates --data-dir ./data --output-dir ./dist

# Watch with live reload server
formatr watch template.fmt --data data.json --serve --port 3000

# Watch with custom debounce
formatr watch template.fmt --data data.json --debounce 500
```

### `formatr init`

Initialize a new formatr project.

```bash
# Interactive initialization
formatr init

# Initialize with template
formatr init my-project --template basic

# Initialize TypeScript project
formatr init my-project --template typescript

# Create config file only
formatr init --config-only
```

Available templates:
- `basic` - Basic formatr project
- `typescript` - TypeScript project with types
- `advanced` - Advanced project with examples
- `documentation` - Documentation project

### `formatr format`

Format template files according to style guidelines.

```bash
# Format single file
formatr format template.fmt

# Format directory
formatr format ./templates --recursive

# Check only (don't modify)
formatr format template.fmt --check

# Format with specific style
formatr format template.fmt --style compact
```

### `formatr lint`

Lint templates for best practices and potential issues.

```bash
# Lint single template
formatr lint template.fmt

# Lint directory
formatr lint ./templates --recursive

# Fix auto-fixable issues
formatr lint template.fmt --fix

# Output as JSON for CI
formatr lint template.fmt --json
```

### `formatr playground`

Launch an interactive playground.

```bash
# Launch playground in browser
formatr playground

# Launch on custom port
formatr playground --port 8080

# Launch with initial template
formatr playground --template examples/basic.fmt

# Launch in CLI mode (REPL)
formatr playground --cli
```

## Configuration

The CLI supports configuration files in the following order of precedence:

1. `.formatrrc` (JSON)
2. `.formatrrc.json`
3. `.formatrrc.yaml` / `.formatrrc.yml`
4. `formatr.config.js` / `formatr.config.mjs` / `formatr.config.cjs`

Example `.formatrrc.json`:

```json
{
  "templateExtension": ".fmt",
  "outputDir": "./dist",
  "locale": "en-US",
  "lint": {
    "extends": "recommended",
    "rules": {
      "no-empty-placeholders": "error"
    }
  },
  "format": {
    "style": "expanded",
    "indentation": 2
  },
  "watch": {
    "debounce": 300,
    "extensions": [".fmt", ".json", ".yaml"]
  }
}
```

## Exit Codes

The CLI uses standard exit codes for CI/CD integration:

- `0` - Success
- `1` - Command failure (e.g., validation errors, render errors)
- `2` - Invalid usage (e.g., missing required arguments)

## Environment Variables

- `NO_COLOR` - Disable colored output
- `FORCE_COLOR` - Force colored output
- `DEBUG` - Enable debug logging

## CI/CD Integration

### GitHub Actions

```yaml
steps:
  - name: Validate templates
    run: formatr validate ./templates --recursive --json > validation.json
    
  - name: Lint templates
    run: formatr lint ./templates --recursive --json > lint.json
    
  - name: Check complexity
    run: formatr analyze ./templates --json --threshold complexity=10
```

### Pre-commit Hook

```json
{
  "scripts": {
    "precommit": "formatr lint ./templates --recursive && formatr format ./templates --check"
  }
}
```

## Troubleshooting

### Colors not displaying

Try setting `FORCE_COLOR=1` or ensure your terminal supports ANSI colors.

### YAML support not working

Install the optional `yaml` package:
```bash
npm install yaml
```

### Watch mode not working

Install the optional `chokidar` package:
```bash
npm install chokidar
```

### Interactive mode not working

Install the optional `inquirer` package:
```bash
npm install inquirer
```

## License

MIT
