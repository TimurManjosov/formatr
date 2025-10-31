export type Range = { start: number; end: number }; // [start, end)

export type TextNode = { kind: 'Text'; value: string; range: Range };

export type FilterCall = {
  name: string;
  args: string[];
  range: Range; // span of the filter, e.g. "|upper" or "|plural:one,two"
};

export type PlaceholderNode = {
  kind: 'Placeholder';
  path: string[]; // e.g., ["user","name"]
  filters?: FilterCall[];
  range: Range; // full span from "{" to "}"
};

export type Node = TextNode | PlaceholderNode;

export interface TemplateAST {
  nodes: Node[];
}
