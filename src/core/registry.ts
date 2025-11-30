// src/core/registry.ts

/**
 * Global template registry for storing and retrieving reusable templates.
 * Templates are stored by name and can be referenced using the {> templateName} syntax.
 */
const templateRegistry = new Map<string, string>();

/**
 * Registers a reusable template by name.
 * 
 * @param name - The template name (e.g., "greeting" or "layout.header")
 * @param source - The template source string
 * 
 * @example
 * registerTemplate("greeting", "Hello {name|upper}!");
 * registerTemplate("layout.header", "=== {title|upper} ===");
 */
export function registerTemplate(name: string, source: string): void {
  templateRegistry.set(name, source);
}

/**
 * Retrieves a registered template by name.
 * 
 * @param name - The template name to look up
 * @returns The template source string, or undefined if not found
 */
export function getTemplate(name: string): string | undefined {
  return templateRegistry.get(name);
}

/**
 * Clears all registered templates from the registry.
 * Useful for testing or resetting state.
 */
export function clearTemplates(): void {
  templateRegistry.clear();
}

/**
 * Checks if a template is registered.
 * 
 * @param name - The template name to check
 * @returns true if the template is registered, false otherwise
 */
export function hasTemplate(name: string): boolean {
  return templateRegistry.has(name);
}

/**
 * Returns a list of all registered template names.
 * 
 * @returns Array of template names
 */
export function listTemplates(): string[] {
  return Array.from(templateRegistry.keys());
}
