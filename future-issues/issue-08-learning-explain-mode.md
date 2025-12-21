# RFC: Learning/Explain Mode for Beginners (Issue #08)

**Status:** Draft  
**Created:** 2025-12-20  
**Author:** TimurManjosov

## Summary

This RFC proposes adding an interactive "Learning Mode" or "Explain Mode" to formatr that helps beginners understand how templates are processed, what filters do, how context is resolved, and provides real-time educational feedback during development.

## Motivation

Learning a new templating library can be challenging for beginners. Common pain points include:
- **Black box behavior**: Not understanding how templates transform into output
- **Filter confusion**: Unclear what filters do and how they chain
- **Context resolution**: Not knowing where values come from
- **Debugging difficulty**: Hard to trace errors in complex templates
- **Lack of guidance**: No educational feedback during development

An interactive learning mode would lower the barrier to entry and improve the developer experience for newcomers.

## Proposed Solution

### Core Features

1. **Step-by-Step Template Execution**
   ```
   Template: "Hello {{ name | uppercase | trim }}"
   Context: { name: "  alice  " }
   
   [Step 1] Resolve variable 'name' from context
   → Found: "  alice  "
   
   [Step 2] Apply filter 'uppercase'
   Input: "  alice  "
   Output: "  ALICE  "
   
   [Step 3] Apply filter 'trim'
   Input: "  ALICE  "
   Output: "ALICE"
   
   [Final] Substitute into template
   Result: "Hello ALICE"
   ```

2. **Interactive Playground with Explanations**
   ```
   ┌─────────────────────────────────────────┐
   │ Template Editor                         │
   │ Hello {{ name | uppercase }}!           │
   │                                         │
   │ Context (JSON)                          │
   │ { "name": "alice" }                     │
   │                                         │
   │ [Explain] [Run] [Share]                 │
   └─────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────┐
   │ Explanation                             │
   │ • Variable 'name' → "alice"             │
   │ • Filter 'uppercase' → "ALICE"          │
   │ • Result: "Hello ALICE!"                │
   └─────────────────────────────────────────┘
   ```

3. **Visual Filter Pipeline**
   ```
   name → "alice"
     ↓ uppercase
   "ALICE"
     ↓ trim
   "ALICE"
     ↓ length
   5
   ```

4. **Context Inspector**
   ```
   Available Context:
   ✓ user.name: "Alice"
   ✓ user.age: 30
   ✓ items: [...]  (array, 5 items)
   ✗ missing_var: undefined
   
   Template Variables:
   • {{ user.name }} → ✓ Available
   • {{ user.email }} → ✗ Not in context (will be empty)
   • {{ items | length }} → ✓ Available
   ```

5. **Filter Documentation Overlay**
   ```
   {{ text | markdown }}
            ^^^^^^^^
   Filter: markdown
   Description: Converts Markdown text to HTML
   Input: string
   Output: string (HTML)
   Example: "**bold**" → "<strong>bold</strong>"
   [View Full Docs]
   ```

6. **Error Explanations**
   ```
   ✗ Error: Unknown filter 'uppercas'
   
   Did you mean:
   • uppercase - Converts text to uppercase
   • lowercase - Converts text to lowercase
   
   Common filters:
   • trim, length, replace, split
   [View all filters]
   ```

7. **Performance Insights**
   ```
   Template Render Time: 2.3ms
   
   Performance Breakdown:
   • Parsing: 0.5ms
   • Variable resolution: 0.3ms
   • Filter execution: 1.2ms
   • Output generation: 0.3ms
   
   ⚠ Slow filter detected: 'complexCalculation' (1.1ms)
   Tip: Consider caching this value
   ```

### Implementation

#### Learning Mode API

```typescript
import { formatr } from '@formatr/core';

// Enable learning mode
formatr.setMode('learning');

// Or configure specific features
formatr.configure({
  learningMode: {
    enabled: true,
    features: {
      stepByStep: true,
      contextInspector: true,
      filterExplanations: true,
      performanceInsights: true,
    },
    verbosity: 'detailed', // 'minimal' | 'moderate' | 'detailed'
  },
});

// Render with explanations
const result = formatr.explain(template, context);
console.log(result.output);      // Final rendered output
console.log(result.steps);       // Array of execution steps
console.log(result.warnings);    // Any warnings or tips
console.log(result.performance); // Performance metrics
```

#### CLI Learning Mode

```bash
# Interactive learning mode
formatr learn

# Explain a specific template
formatr explain template.txt --context data.json

# Output explanations to file
formatr explain template.txt --context data.json --output explanation.html

# Step-by-step mode
formatr explain template.txt --context data.json --step-by-step
```

#### Browser-Based Playground

```html
<!DOCTYPE html>
<html>
<head>
  <script src="formatr-playground.js"></script>
  <link rel="stylesheet" href="formatr-playground.css">
</head>
<body>
  <div id="formatr-playground"></div>
  <script>
    FormatrPlayground.init({
      container: '#formatr-playground',
      mode: 'learning',
      defaultTemplate: 'Hello {{ name }}!',
      defaultContext: { name: 'World' },
    });
  </script>
</body>
</html>
```

#### Explanation Engine

```typescript
class ExplanationEngine {
  private steps: ExplanationStep[] = [];
  
  explainRender(template: string, context: any): ExplanationResult {
    this.steps = [];
    
    // Parse template
    this.addStep({
      type: 'parse',
      description: 'Parsing template',
      input: template,
      output: ast,
    });
    
    // Walk AST and explain each node
    this.walkAST(ast, context);
    
    // Generate final output
    const output = this.render(ast, context);
    
    return {
      output,
      steps: this.steps,
      warnings: this.collectWarnings(),
      performance: this.collectPerformanceMetrics(),
    };
  }
  
  private walkAST(node: ASTNode, context: any) {
    switch (node.type) {
      case 'variable':
        this.explainVariableResolution(node, context);
        break;
      case 'filter':
        this.explainFilterApplication(node, context);
        break;
      // ... other node types
    }
  }
  
  private explainVariableResolution(node: VariableNode, context: any) {
    const path = node.path;
    const value = resolvePath(context, path);
    
    this.addStep({
      type: 'variable',
      description: `Resolve variable '${path}'`,
      input: context,
      output: value,
      available: value !== undefined,
      suggestion: value === undefined ? this.suggestAlternatives(path, context) : null,
    });
  }
  
  private explainFilterApplication(node: FilterNode, context: any) {
    const filter = this.getFilter(node.name);
    const input = this.resolveInput(node.input, context);
    const output = filter.apply(input, node.args);
    
    this.addStep({
      type: 'filter',
      name: node.name,
      description: filter.description,
      input,
      output,
      documentation: filter.documentation,
      example: filter.example,
    });
  }
  
  private addStep(step: ExplanationStep) {
    this.steps.push({
      ...step,
      timestamp: Date.now(),
      duration: this.measureDuration(),
    });
  }
}
```

### Interactive Tutorial System

```typescript
// Built-in tutorials
const tutorials = {
  'basics': {
    title: 'formatr Basics',
    steps: [
      {
        title: 'Variables',
        template: 'Hello {{ name }}!',
        context: { name: 'World' },
        explanation: 'Variables are enclosed in {{ }}. They pull values from the context.',
        task: 'Change the name to your own name.',
      },
      {
        title: 'Filters',
        template: '{{ text | uppercase }}',
        context: { text: 'hello' },
        explanation: 'Filters transform values. Use the | symbol to apply them.',
        task: 'Add a "trim" filter after uppercase.',
      },
      // ... more steps
    ],
  },
  'filters': {
    title: 'Working with Filters',
    steps: [/* ... */],
  },
  'advanced': {
    title: 'Advanced Templates',
    steps: [/* ... */],
  },
};

// Run tutorial
formatr.tutorial('basics');
```

## Benefits

- **Lower barrier to entry**: Beginners can learn by doing with immediate feedback
- **Better debugging**: Understand what's happening at each step
- **Faster learning**: Visual explanations accelerate comprehension
- **Reduced support burden**: Self-service learning reduces support questions
- **Improved documentation**: Interactive examples are better than static docs
- **Community growth**: Easier onboarding attracts more users

## Drawbacks

- Development effort to build comprehensive learning features
- Maintenance burden for keeping tutorials and explanations up to date
- Potential performance overhead in learning mode
- May add significant code size if not properly tree-shaken
- Risk of overwhelming beginners with too much information

## Alternatives Considered

1. **Static documentation only**: Traditional docs with examples
   - Pro: Simpler to create and maintain
   - Con: Less engaging, harder to learn

2. **Video tutorials**: Screencasts and video courses
   - Pro: Very accessible
   - Con: Not interactive, hard to update

3. **Community-driven guides**: Let community create tutorials
   - Pro: Diverse perspectives, less core team burden
   - Con: Quality inconsistency, no integration with library

4. **External learning platform**: Partner with platforms like Scrimba or Codecademy
   - Pro: Professional production quality
   - Con: External dependency, not integrated

## Open Questions

1. Should learning mode be opt-in or opt-out?
2. How much performance overhead is acceptable in learning mode?
3. Should explanations be localized to different languages?
4. How do we balance verbosity with clarity?
5. Should we gamify the learning experience (badges, progress tracking)?
6. How do we collect feedback on tutorial effectiveness?

## Success Metrics

- Time to first successful template render for new users
- Reduction in "getting started" support questions
- Tutorial completion rates
- User satisfaction scores for learning experience
- Community contributions of tutorials and examples
- Adoption rate of formatr by beginners vs experts

## Timeline

- **Week 1-2:** Design and prototype explanation engine
- **Week 3-4:** Build CLI learning mode
- **Week 5-6:** Develop browser playground
- **Week 7-8:** Create interactive tutorials
- **Week 9-10:** Testing with real beginners, iterate on UX
- **Week 11-12:** Documentation and launch

## Prior Art

- **Vue.js Devtools**: Visual component inspection and debugging
- **React Developer Tools**: Component tree visualization
- **Rust Playground**: Interactive code execution with explanations
- **TypeScript Playground**: Real-time type checking with hover explanations
- **SQL Explain**: Query execution plan visualization
- **Regex101**: Step-by-step regex matching visualization

## References

- [Learning by Doing](https://en.wikipedia.org/wiki/Learning-by-doing)
- [Cognitive Load Theory](https://en.wikipedia.org/wiki/Cognitive_load)
- [Interactive Learning Research](https://www.edutopia.org/article/benefits-interactive-learning)

## Example Tutorial Flow

```
Welcome to formatr! Let's learn the basics.

─────────────────────────────────────────────
Lesson 1: Your First Template

Template: Hello {{ name }}!
Context:  { "name": "World" }

Try it yourself below:
┌─────────────────────────────────────────┐
│ Hello {{ name }}!                       │
└─────────────────────────────────────────┘

Output:
┌─────────────────────────────────────────┐
│ Hello World!                            │
└─────────────────────────────────────────┘

What happened?
• {{ name }} was replaced with "World"
• The value came from the context object

✓ Great! Now try changing "World" to your name.
[Next Lesson →]
─────────────────────────────────────────────
```

## Feedback

Please provide feedback on this RFC by commenting below or opening a discussion thread.

---

**Last Updated:** 2025-12-20