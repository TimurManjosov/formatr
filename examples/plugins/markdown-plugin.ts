// examples/plugins/markdown-plugin.ts
/**
 * Example: Markdown Plugin
 * 
 * This plugin demonstrates adding custom filters for Markdown processing.
 * Note: In a real implementation, you would import a markdown library like 'marked'.
 */

import { createPlugin, PluginManager } from '../../src/plugin';
import { template } from '../../src/api';

// Simple markdown-like formatting (demo only - use a real library in production)
function simpleMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\n/g, '<br>');
}

// Create the markdown plugin
const markdownPlugin = createPlugin({
  name: 'markdown',
  version: '1.0.0',
  description: 'Adds markdown formatting filters',
  author: 'formatr',
  
  filters: {
    // Full markdown processing
    markdown: (value: unknown) => simpleMarkdown(String(value)),
    
    // Shorthand alias
    md: (value: unknown) => simpleMarkdown(String(value)),
    
    // Inline markdown (no block elements)
    mdInline: (value: unknown) => {
      const text = String(value);
      return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>');
    },
    
    // Strip markdown formatting
    stripMd: (value: unknown) => {
      return String(value)
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .replace(/^#+\s*/gm, '');
    },
  },
});

// Usage demonstration
async function main() {
  console.log('=== Markdown Plugin Example ===\n');

  // Register the plugin
  const manager = new PluginManager();
  await manager.register(markdownPlugin);

  // Create templates with markdown filters
  const t1 = template('{content|markdown}', {
    filters: manager.collectFilters(),
  });

  const result1 = t1({
    content: '# Hello\n\nThis is **bold** and *italic* text with `code`.',
  });
  console.log('Markdown output:');
  console.log(result1);
  console.log();

  // Inline markdown
  const t2 = template('Message: {text|mdInline}', {
    filters: manager.collectFilters(),
  });

  const result2 = t2({ text: 'Use **bold** for emphasis' });
  console.log('Inline markdown:', result2);

  // Strip markdown
  const t3 = template('Plain: {text|stripMd}', {
    filters: manager.collectFilters(),
  });

  const result3 = t3({ text: '**Important** message with `code`' });
  console.log('Stripped markdown:', result3);
}

main().catch(console.error);
