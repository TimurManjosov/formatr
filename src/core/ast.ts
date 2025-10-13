export type TextNode = { kind: 'Text'; value: string };

export type FilterCall = {
  name: string;
  args: string[]; // raw string args (parsed as text, not JSON)
};

export type PlaceholderNode = {
  kind: 'Placeholder';
  key: string;
  filters?: FilterCall[]; // optional chain
};

export type Node = TextNode | PlaceholderNode;

export interface TemplateAST {
  nodes: Node[];
}
