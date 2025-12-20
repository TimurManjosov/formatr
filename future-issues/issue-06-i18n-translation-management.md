# RFC: Add Versioned Translation Management (i18n) - Issue #06

**Status:** Draft  
**Created:** 2025-12-20  
**Author:** TimurManjosov

## Summary

This RFC proposes adding comprehensive internationalization (i18n) and translation management capabilities to formatr, enabling versioned translations, multi-language support, and efficient translation workflows.

## Motivation

As formatr grows and attracts a global user base, there's an increasing need to:
- Support multiple languages in formatted output
- Manage translations across different versions
- Provide translation workflow tools for contributors
- Ensure translation consistency and quality
- Handle locale-specific formatting rules

## Proposed Solution

### Core Features

1. **Versioned Translation Storage**
   - Store translations with version metadata
   - Support for translation fallbacks
   - Tracking of translation coverage per language

2. **Translation Management API**
   ```javascript
   formatr.i18n.addTranslation('en', 'greeting', 'Hello {name}');
   formatr.i18n.addTranslation('es', 'greeting', 'Hola {name}');
   formatr.i18n.setLocale('es');
   ```

3. **Locale-Specific Formatting**
   - Date and time formatting per locale
   - Number formatting (decimals, thousands separators)
   - Currency formatting
   - Pluralization rules

4. **Translation Workflow Tools**
   - Export translations for external tools
   - Import translations from standard formats (JSON, YAML, PO)
   - Missing translation detection
   - Translation validation

### Technical Design

#### Translation Storage Structure
```javascript
{
  "version": "1.0.0",
  "languages": {
    "en": {
      "messages": {
        "greeting": "Hello {name}",
        "farewell": "Goodbye {name}"
      },
      "metadata": {
        "coverage": 100,
        "lastUpdated": "2025-12-20"
      }
    },
    "es": {
      "messages": {
        "greeting": "Hola {name}",
        "farewell": "Adiós {name}"
      },
      "metadata": {
        "coverage": 100,
        "lastUpdated": "2025-12-20"
      }
    }
  }
}
```

#### API Interface
```typescript
interface I18nManager {
  setLocale(locale: string): void;
  getLocale(): string;
  addTranslation(locale: string, key: string, value: string): void;
  translate(key: string, params?: object): string;
  listLanguages(): string[];
  getTranslationCoverage(locale: string): number;
}
```

### Implementation Phases

**Phase 1: Core i18n Infrastructure**
- Basic translation storage
- Locale switching
- Simple key-value translation

**Phase 2: Advanced Formatting**
- Locale-specific number formatting
- Date/time formatting
- Pluralization support

**Phase 3: Workflow Tools**
- Translation import/export
- Coverage reporting
- Validation tools

**Phase 4: Integration**
- CLI support for translation management
- Documentation in multiple languages
- Community translation portal

## Benefits

- **Global Reach:** Enable formatr to serve international users
- **Maintainability:** Centralized translation management
- **Quality:** Built-in validation and coverage tracking
- **Community:** Enable community-driven translations
- **Consistency:** Ensure consistent terminology across languages

## Drawbacks

- Increased complexity in the codebase
- Additional maintenance burden for translations
- Potential performance impact for locale switching
- Need for translation review process

## Alternatives Considered

1. **Third-party i18n libraries:** Use existing solutions like i18next
   - Pro: Battle-tested, feature-rich
   - Con: Additional dependency, may be overkill

2. **Simple string replacement:** Basic key-value replacement without versioning
   - Pro: Simpler implementation
   - Con: Lacks advanced features, harder to maintain

3. **External translation service:** Use services like Crowdin or Lokalise
   - Pro: Professional translation management
   - Con: External dependency, potential cost

## Open Questions

1. Should we support right-to-left (RTL) languages from the start?
2. How should we handle translation updates across versions?
3. What file format should be the primary storage format?
4. Should translation files be bundled or loaded dynamically?
5. How do we handle translation contributions from the community?

## Success Metrics

- Number of supported languages
- Translation coverage percentage per language
- Community contribution rate
- Performance impact (< 5% overhead for locale switching)
- User adoption in non-English locales

## Timeline

- **Week 1-2:** Design finalization and community feedback
- **Week 3-4:** Phase 1 implementation
- **Week 5-6:** Phase 2 implementation
- **Week 7-8:** Phase 3 implementation
- **Week 9-10:** Testing and documentation
- **Week 11-12:** Community translation setup and Phase 4

## References

- [ICU MessageFormat](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [CLDR - Unicode Common Locale Data Repository](https://cldr.unicode.org/)
- [Mozilla L10n Guide](https://mozilla-l10n.github.io/localizers/)
- [i18next Documentation](https://www.i18next.com/)

## Feedback

Please provide feedback on this RFC by commenting on the related issue or pull request.

---

**Last Updated:** 2025-12-20 12:28:51 UTC
