# Diagnostic Suggestions for Filter Names

## Description

Enhance the `analyze()` function to provide **smart suggestions** when a user references an unknown filter. This improves developer experience by helping users quickly identify typos and discover available filters.

When a template contains an unknown filter (e.g., `{name|upperr}`), the analyzer should:
- Suggest similar filter names based on string distance (e.g., suggest `"upper"` for `"upperr"`).
- Use a simple heuristic (Levenshtein distance, Jaro-Winkler, or prefix matching) to find close matches.
- Limit suggestions to a reasonable number (e.g., top 3 matches).
- Provide suggestions in the diagnostic message and in structured metadata for tooling.

This feature is valuable for:
- **Developer productivity**: Reduce time spent debugging typos and discovering filter names.
- **Onboarding**: New users can quickly learn available filters through suggestions.
- **Editor integrations**: IDEs and editors can show suggestions as autocomplete or quick-fix actions.
- **Error messages**: More helpful error messages improve user satisfaction.

This feature fits naturally into the existing `formatr` architecture:
- The `analyze()` function already detects unknown filters and reports diagnostics.
- By adding a suggestion algorithm, we can enhance the `unknown-filter` diagnostic.
- The filter registry is already available during analysis, making it easy to compare filter names.

### Example Usage

**Current behavior:**
```typescript
import { analyze } from "@timur_manjosov/formatr";

const report = analyze("{name|upperr}");
console.log(report.messages);
// [
//   {
//     code: "unknown-filter",
//     message: 'Unknown filter "upperr"',
//     ...
//   }
// ]
```

**With suggestions:**
```typescript
import { analyze } from "@timur_manjosov/formatr";

const report = analyze("{name|upperr}");
console.log(report.messages);
// [
//   {
//     code: "unknown-filter",
//     message: 'Unknown filter "upperr". Did you mean "upper"?',
//     severity: "error",
//     range: { ... },
//     data: {
//       filter: "upperr",
//       suggestions: ["upper", "lower"]
//     }
//   }
// ]

const report2 = analyze("{price|currenc:USD}");
console.log(report2.messages);
// [
//   {
//     code: "unknown-filter",
//     message: 'Unknown filter "currenc". Did you mean "currency"?',
//     severity: "error",
//     range: { ... },
//     data: {
//       filter: "currenc",
//       suggestions: ["currency"]
//     }
//   }
// ]

const report3 = analyze("{text|nonexistent}");
console.log(report3.messages);
// [
//   {
//     code: "unknown-filter",
//     message: 'Unknown filter "nonexistent"',
//     severity: "error",
//     range: { ... },
//     data: {
//       filter: "nonexistent",
//       suggestions: [] // No close matches
//     }
//   }
// ]
```

## Requirements

### String Distance Algorithm
- [ ] Implement a string distance or similarity algorithm:
  - **Levenshtein distance**: Number of single-character edits (insertions, deletions, substitutions) needed to change one string into another.
  - **Jaro-Winkler distance**: Similarity metric that favors strings with matching prefixes.
  - **Prefix matching**: Simple heuristic that suggests filters starting with the same prefix.
- [ ] Choose an algorithm that is fast and produces good suggestions for typical typos.
- [ ] Consider using an existing library (e.g., `fastest-levenshtein`) or implementing a simple version in-house.

### Suggestion Logic
- [ ] When an unknown filter is detected, compute the distance between the unknown name and all known filter names.
- [ ] Rank filters by distance (or similarity score).
- [ ] Return the top 3 (or configurable number) closest matches.
- [ ] Only include suggestions with a distance below a threshold (e.g., distance ≤ 2 for Levenshtein) to avoid irrelevant suggestions.

### Diagnostic Updates
- [ ] Add a `suggestions: string[]` field to the `data` object in the `unknown-filter` diagnostic.
- [ ] Update the diagnostic message to include suggestions:
  - If 1 suggestion: `Unknown filter "upperr". Did you mean "upper"?`
  - If 2+ suggestions: `Unknown filter "curenc". Did you mean "currency" or "current"?`
  - If 0 suggestions: `Unknown filter "xyz"`
- [ ] Ensure the message is clear and not overly verbose.

### Performance
- [ ] Computing suggestions should be fast (sub-millisecond for typical templates).
- [ ] Avoid recomputing distances for every unknown filter; compute once and cache if needed.
- [ ] For large filter registries (e.g., 100+ filters), ensure the algorithm is efficient.

### Configuration (Optional)
- [ ] Consider adding an option to control suggestion behavior:
  - `suggestions: boolean` – Enable/disable suggestions (default: `true`).
  - `maxSuggestions: number` – Maximum number of suggestions to return (default: `3`).
  - `suggestionThreshold: number` – Maximum distance for suggestions (default: `2`).

### Backwards Compatibility
- [ ] Suggestions are added to existing diagnostics, so no breaking changes.
- [ ] Existing code that only checks `message` will see the enhanced message.
- [ ] Tooling that reads `data.suggestions` can provide richer experiences (e.g., quick fixes).

## Acceptance Criteria

### Implementation
- [ ] String distance algorithm is implemented (Levenshtein or similar).
- [ ] Suggestion logic is integrated into `analyze()` for `unknown-filter` diagnostics.
- [ ] Diagnostic messages include suggestions when available.
- [ ] `data.suggestions` field contains an array of suggested filter names.
- [ ] Suggestions are limited to a reasonable number (e.g., top 3).

### Testing
- [ ] Unit tests for string distance algorithm:
  - `distance("upper", "upperr")` → small distance
  - `distance("currency", "currenc")` → small distance
  - `distance("upper", "xyz")` → large distance
- [ ] Unit tests for suggestion logic:
  - `{name|upperr}` → suggest `"upper"`
  - `{price|currenc:USD}` → suggest `"currency"`
  - `{text|nonexistent}` → no suggestions (distance too large)
  - `{value|numb}` → suggest `"number"`
- [ ] Unit tests for diagnostic messages:
  - Verify that message includes suggestions.
  - Verify that `data.suggestions` is populated correctly.
- [ ] Unit tests for edge cases:
  - Empty filter name
  - Very long filter name
  - Filter registry with 100+ filters (performance test)

### Documentation
- [ ] Update README to mention diagnostic suggestions.
- [ ] Add an example showing how suggestions appear in diagnostics.
- [ ] Document the `data.suggestions` field for tooling authors.

### Integration
- [ ] Suggestions work with built-in filters.
- [ ] Suggestions work with custom filters provided via `options.filters`.
- [ ] Suggestions work with internationalization filters (`number`, `currency`, `date`, etc.).

### Performance
- [ ] Computing suggestions adds negligible overhead to `analyze()` (< 1ms for typical templates).
- [ ] Algorithm is efficient even with large filter registries.

### Developer Experience
- [ ] Suggestions help users quickly fix typos.
- [ ] Suggestions are relevant and not overwhelming (max 3).
- [ ] Error messages are clear and actionable.

## Implementation Ideas

### Approach 1: Levenshtein Distance

Implement a simple Levenshtein distance function:

```typescript
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}
```

### Approach 2: Generate Suggestions

Add a function to generate suggestions:

```typescript
function suggestFilters(
  unknownFilter: string,
  availableFilters: string[],
  maxSuggestions = 3,
  maxDistance = 2
): string[] {
  const suggestions: { name: string; distance: number }[] = [];
  
  for (const filter of availableFilters) {
    const distance = levenshteinDistance(unknownFilter.toLowerCase(), filter.toLowerCase());
    if (distance <= maxDistance) {
      suggestions.push({ name: filter, distance });
    }
  }
  
  // Sort by distance (ascending)
  suggestions.sort((a, b) => a.distance - b.distance);
  
  // Return top N suggestions
  return suggestions.slice(0, maxSuggestions).map(s => s.name);
}
```

### Approach 3: Update Analyze Function

Integrate suggestions into `src/core/analyze.ts`:

```typescript
for (const f of node.filters) {
  const fn = registry[f.name];
  if (!fn) {
    // Generate suggestions
    const availableFilters = Object.keys(registry);
    const suggestions = suggestFilters(f.name, availableFilters);
    
    // Build message
    let message = `Unknown filter "${f.name}"`;
    if (suggestions.length === 1) {
      message += `. Did you mean "${suggestions[0]}"?`;
    } else if (suggestions.length > 1) {
      const suggestionList = suggestions.slice(0, -1).map(s => `"${s}"`).join(", ");
      message += `. Did you mean ${suggestionList}, or "${suggestions[suggestions.length - 1]}"?`;
    }
    
    messages.push({
      code: "unknown-filter",
      message,
      severity: "error",
      range: astRangeToRange(source, f.range, lineStarts),
      data: {
        filter: f.name,
        suggestions,
      },
    });
    continue;
  }
  
  // ... existing argument checks ...
}
```

### Approach 4: Use External Library (Optional)

Use a well-tested library for string distance:

```bash
pnpm add fastest-levenshtein
```

```typescript
import { distance } from "fastest-levenshtein";

function suggestFilters(unknownFilter: string, availableFilters: string[]): string[] {
  const suggestions = availableFilters
    .map(filter => ({ name: filter, distance: distance(unknownFilter, filter) }))
    .filter(s => s.distance <= 2)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map(s => s.name);
  
  return suggestions;
}
```

### Potential Pitfalls
- **Performance**: Computing Levenshtein distance for every filter can be slow for large registries; consider optimizations (e.g., early exit, caching).
- **Irrelevant suggestions**: Very different filter names may be suggested if the threshold is too high; tune the threshold carefully.
- **Case sensitivity**: Ensure comparison is case-insensitive (e.g., `"Upper"` vs. `"upper"`).
- **Locale-specific suggestions**: Consider supporting locale-specific filter names in the future.
- **Dependencies**: Adding an external library (e.g., `fastest-levenshtein`) adds a dependency; weigh benefits vs. complexity.

## Additional Notes

- **Related issues**:
  - Issue #2 (Extended diagnostics) provides the foundation for structured diagnostics with `data` fields.
  - Issue #4 (Filter registry improvements) ensures that all filters are documented and easy to discover.
- **Future extensions**:
  - Support fuzzy matching for filter names (e.g., `"upp"` suggests `"upper"`).
  - Support aliases for filter names (e.g., `"uppercase"` as an alias for `"upper"`).
  - Integrate with editor autocomplete to show suggestions as users type.
  - Add a `--suggest-filters` CLI option to list all available filters.
- **Alternative algorithms**:
  - **Jaro-Winkler**: Better for short strings and prefix matching.
  - **Soundex**: Good for phonetic matching (e.g., `"currancy"` → `"currency"`).
  - **N-gram similarity**: Compare substrings of length N.

---
