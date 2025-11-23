# Documentation and Example Improvements

## Description

Expand the `formatr` documentation and examples to provide users with comprehensive, real-world guidance on using the library effectively. While the current README covers the basics, it lacks:

- **Real-world use case examples**: CLI logs, email templates, internationalization (i18n), nested contexts, form validation messages.
- **Advanced topics**: Custom filter development, integration with popular frameworks (React, Vue, Express), performance tuning.
- **More example scripts**: Additional runnable examples in the `examples/` directory demonstrating common patterns.
- **Docs site structure**: A foundation for a future documentation website with organized sections, search, and navigation.

Great documentation is essential for:
- **Onboarding**: New users can get started quickly and learn best practices.
- **Adoption**: Well-documented libraries are more likely to be adopted by the community.
- **Support**: Comprehensive docs reduce support requests and GitHub issues.
- **Showcase**: Examples demonstrate the library's capabilities and inspire users to build with it.

This feature fits naturally into the existing `formatr` project:
- The `examples/` directory already exists with basic examples (`basic.ts`, `intl.ts`).
- The README is well-structured but can be extended with more content.
- A minimal docs site can be scaffolded using static site generators (e.g., VitePress, Docusaurus) or even a simple `docs/` directory with markdown files.

### Example Usage

**New examples to add:**

**1. CLI logging with formatr:**
```typescript
// examples/cli-logging.ts
import { template } from "@timur_manjosov/formatr";

const logTemplate = template<{
  level: string;
  timestamp: Date;
  message: string;
  duration?: number;
}>(
  "[{timestamp|date:short}] [{level|pad:5}] {message} {duration|number}ms",
  { locale: "en-US" }
);

console.log(logTemplate({
  level: "INFO",
  timestamp: new Date(),
  message: "Server started",
}));
// → "[1/15/2025] [INFO ] Server started ms"

console.log(logTemplate({
  level: "ERROR",
  timestamp: new Date(),
  message: "Connection failed",
  duration: 1234,
}));
// → "[1/15/2025] [ERROR] Connection failed 1,234ms"
```

**2. Email templates:**
```typescript
// examples/email-templates.ts
import { template } from "@timur_manjosov/formatr";

const welcomeEmail = template<{
  user: { name: string; email: string };
  verifyUrl: string;
}>(
  `Hi {user.name|upper},

Welcome to our platform! Please verify your email address ({user.email}) by clicking the link below:

{verifyUrl}

Thanks,
The Team`
);

console.log(welcomeEmail({
  user: { name: "Alice", email: "alice@example.com" },
  verifyUrl: "https://example.com/verify/abc123",
}));
```

**3. Internationalization (i18n):**
```typescript
// examples/i18n.ts
import { template } from "@timur_manjosov/formatr";

const messages = {
  en: template<{ name: string; count: number }>(
    "Hello {name}, you have {count|plural:message,messages}",
    { locale: "en-US" }
  ),
  es: template<{ name: string; count: number }>(
    "Hola {name}, tienes {count|plural:mensaje,mensajes}",
    { locale: "es-ES" }
  ),
  de: template<{ name: string; count: number }>(
    "Hallo {name}, du hast {count|plural:Nachricht,Nachrichten}",
    { locale: "de-DE" }
  ),
};

const locale = "es";
console.log(messages[locale]({ name: "Carlos", count: 3 }));
// → "Hola Carlos, tienes mensajes"
```

**4. Form validation messages:**
```typescript
// examples/form-validation.ts
import { template } from "@timur_manjosov/formatr";

const validationMessages = {
  required: template<{ field: string }>("The {field} field is required."),
  minLength: template<{ field: string; min: number }>(
    "The {field} field must be at least {min} characters."
  ),
  maxLength: template<{ field: string; max: number }>(
    "The {field} field must not exceed {max} characters."
  ),
  email: template<{ field: string }>("The {field} field must be a valid email address."),
};

console.log(validationMessages.required({ field: "username" }));
// → "The username field is required."

console.log(validationMessages.minLength({ field: "password", min: 8 }));
// → "The password field must be at least 8 characters."
```

## Requirements

### README Enhancements
- [ ] Add a **"Real-World Use Cases"** section with examples for:
  - CLI logging
  - Email/SMS templates
  - i18n message catalogs
  - Form validation messages
  - API response formatting
- [ ] Add an **"Advanced Topics"** section covering:
  - Writing custom filters
  - Filter best practices (pure functions, error handling)
  - Integrating with frameworks (React, Vue, Express)
  - Performance considerations (caching, precompilation)
  - Using `analyze()` in build pipelines
- [ ] Add a **"Migration Guide"** section for users coming from similar libraries (e.g., Mustache, Handlebars, template literals).
- [ ] Add a **"FAQ"** section answering common questions:
  - When to use `formatr` vs. template literals?
  - How to handle missing keys?
  - How to debug template issues?
  - How to contribute?

### New Example Scripts
- [ ] `examples/cli-logging.ts` – Demonstrate structured logging with timestamps and log levels.
- [ ] `examples/email-templates.ts` – Demonstrate email formatting with nested contexts.
- [ ] `examples/i18n.ts` – Demonstrate building a simple i18n system with locale-specific templates.
- [ ] `examples/form-validation.ts` – Demonstrate generating validation messages.
- [ ] `examples/custom-filters.ts` – Demonstrate creating and using custom filters.
- [ ] `examples/api-responses.ts` – Demonstrate formatting JSON API responses or error messages.

### Docs Site Foundation (Optional)
- [ ] Create a `docs/` directory with markdown files:
  - `docs/README.md` – Landing page / introduction
  - `docs/getting-started.md` – Installation and quickstart
  - `docs/api-reference.md` – Complete API docs (template, analyze, options, filters)
  - `docs/filters.md` – Comprehensive filter documentation
  - `docs/examples.md` – Links to all example scripts
  - `docs/advanced.md` – Advanced topics (custom filters, performance, integrations)
  - `docs/faq.md` – Frequently asked questions
- [ ] Optionally scaffold a static site generator (VitePress, Docusaurus, MkDocs) for hosting on GitHub Pages.
- [ ] Add a `docs:dev` script to `package.json` for local docs development.

### Code Comments and JSDoc
- [ ] Add JSDoc comments to all public APIs in `src/api.ts`, `src/core/analyze.ts`.
- [ ] Add JSDoc comments to all filter functions in `src/filters/`.
- [ ] Ensure JSDoc comments include `@param`, `@returns`, and `@example` tags.

### Contributing Guidelines
- [ ] Create a `CONTRIBUTING.md` file with guidelines for:
  - Setting up the development environment
  - Running tests and linting
  - Submitting pull requests
  - Code style and conventions
  - Adding new filters or features

### Backwards Compatibility
- [ ] Documentation improvements do not change any code or APIs, so there are no compatibility concerns.

## Acceptance Criteria

### Implementation
- [ ] README includes a "Real-World Use Cases" section with at least 3 examples.
- [ ] README includes an "Advanced Topics" section covering custom filters and integrations.
- [ ] README includes a "FAQ" section with at least 5 questions.
- [ ] At least 4 new example scripts are added to the `examples/` directory.
- [ ] All example scripts are runnable with `tsx examples/<name>.ts`.
- [ ] Add an `examples` script to `package.json` that runs all examples.

### Testing
- [ ] All example scripts run without errors.
- [ ] Examples are tested manually to ensure output is correct and readable.

### Documentation
- [ ] All public APIs have JSDoc comments with examples.
- [ ] All filter functions have JSDoc comments.
- [ ] README is well-formatted, easy to read, and free of typos.
- [ ] Links in the README work correctly (internal links, npm badges, GitHub links).

### Optional: Docs Site
- [ ] If implemented, the docs site is hosted on GitHub Pages or another hosting platform.
- [ ] The docs site has a clear navigation structure and search functionality.
- [ ] The docs site is mobile-friendly and accessible.

### Developer Experience
- [ ] New users can get started quickly by following the README.
- [ ] Examples are clear, concise, and demonstrate best practices.
- [ ] Advanced topics provide deep insights without overwhelming beginners.

## Implementation Ideas

### Approach 1: Expand README Incrementally

Start by adding sections to the README in small, focused PRs:
1. Add "Real-World Use Cases" section with CLI logging example.
2. Add "Advanced Topics" section with custom filters guide.
3. Add "FAQ" section with common questions.
4. Add new example scripts and link to them from the README.

### Approach 2: Create Example Scripts

Add examples one at a time:
```bash
# Create new example files
touch examples/cli-logging.ts
touch examples/email-templates.ts
touch examples/i18n.ts
touch examples/form-validation.ts
touch examples/custom-filters.ts

# Update package.json
"scripts": {
  "examples": "tsx examples/basic.ts && tsx examples/intl.ts && tsx examples/cli-logging.ts && tsx examples/i18n.ts"
}
```

### Approach 3: Scaffold Docs Site (Optional)

Use VitePress (recommended for TypeScript projects):

```bash
pnpm add -D vitepress
mkdir docs
touch docs/index.md
touch docs/getting-started.md
touch docs/api-reference.md
```

Add to `package.json`:
```json
"scripts": {
  "docs:dev": "vitepress dev docs",
  "docs:build": "vitepress build docs",
  "docs:preview": "vitepress preview docs"
}
```

Create `docs/.vitepress/config.ts`:
```typescript
import { defineConfig } from "vitepress";

export default defineConfig({
  title: "formatr",
  description: "Elegant, typed string formatting for TypeScript",
  themeConfig: {
    nav: [
      { text: "Guide", link: "/getting-started" },
      { text: "API", link: "/api-reference" },
      { text: "Examples", link: "/examples" },
    ],
    sidebar: [
      { text: "Getting Started", link: "/getting-started" },
      { text: "API Reference", link: "/api-reference" },
      { text: "Filters", link: "/filters" },
      { text: "Examples", link: "/examples" },
      { text: "Advanced", link: "/advanced" },
      { text: "FAQ", link: "/faq" },
    ],
  },
});
```

### Approach 4: Add CONTRIBUTING.md

Create `CONTRIBUTING.md`:
```markdown
# Contributing to formatr

Thank you for your interest in contributing to formatr!

## Development Setup

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Run tests: `pnpm test`
4. Build: `pnpm build`

## Code Style

- Follow existing code style
- Use TypeScript strict mode
- Write tests for new features
- Add JSDoc comments for public APIs

## Submitting Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `pnpm check` to ensure all tests and lints pass
5. Submit a pull request

## Adding New Filters

1. Add the filter to `src/filters/text.ts` or `src/filters/intl.ts`
2. Export it from `src/filters/index.ts`
3. Add it to `builtinFilters`
4. Write unit tests in `test/`
5. Document it in the README

Thank you for contributing!
```

### Potential Pitfalls
- **Scope creep**: Documentation improvements can be endless; focus on the most impactful additions first.
- **Maintenance burden**: More examples mean more code to maintain; ensure examples are simple and unlikely to break.
- **Docs site complexity**: Building a full docs site can be time-consuming; start with markdown files in a `docs/` directory and upgrade later.

## Additional Notes

- **Related issues**: None directly, but good documentation supports all other features.
- **Future extensions**:
  - Add video tutorials or interactive demos.
  - Add a blog section with articles on advanced topics.
  - Add code sandboxes (CodeSandbox, StackBlitz) embedded in docs.
  - Add auto-generated API docs from JSDoc comments using TypeDoc.
- **Community feedback**: Encourage users to suggest new examples or documentation improvements via GitHub issues.

---
