export type TextNode = { kind: 'Text'; value: string };

export type FilterCall = {
  name: string;
  args: string[];
};

// CHANGE: key → path: string[]
export type PlaceholderNode = {
  kind: 'Placeholder';
  path: string[]; // e.g., ["user", "name"]
  filters?: FilterCall[];
};

export type Node = TextNode | PlaceholderNode;

export interface TemplateAST {
  nodes: Node[];
}
