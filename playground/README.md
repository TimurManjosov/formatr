# formatr Playground

An interactive web playground for experimenting with [formatr](https://github.com/TimurManjosov/formatr) templates.

## Features

- 🎮 **Live Editing**: Edit templates and see results in real-time
- 📝 **Monaco Editor**: Syntax highlighting for templates and JSON
- 🔍 **Diagnostics**: Real-time error detection and warnings
- 🌐 **i18n Support**: Test templates with different locales
- 🔗 **Shareable Links**: Share your templates via URL
- 📱 **Responsive**: Works on desktop, tablet, and mobile
- 💡 **Examples**: Pre-built examples to get started quickly

## Usage

Visit the live playground at: **[https://timurmanjosov.github.io/formatr/](https://timurmanjosov.github.io/formatr/)**

Or run it locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Architecture

The playground is built with:

- **React 19** - UI framework
- **Vite** - Build tool
- **Monaco Editor** - Code editor (VS Code's editor)
- **lz-string** - URL compression for shareable links
- **@timur_manjosov/formatr** - The formatr library

## Development

### Project Structure

```
playground/
├── src/
│   ├── App.tsx          # Main playground component
│   ├── App.css          # Playground styles
│   ├── main.tsx         # React entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── package.json         # Dependencies
└── vite.config.ts       # Vite configuration
```

### Adding Examples

Edit the `examples` object in `src/App.tsx`:

```typescript
const examples = {
  myExample: {
    name: "My Example",
    template: "{name|upper}",
    context: '{\n  "name": "Alice"\n}',
  },
  // ... more examples
};
```

### Deployment

The playground is automatically deployed to GitHub Pages when changes are pushed to the `main` branch via GitHub Actions (`.github/workflows/deploy-playground.yml`).

## License

MIT - See [LICENSE](../LICENSE) in the root directory.
