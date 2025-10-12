// AST = the “shape” of a parsed template, independent of rendering.
export type TextNode = { kind: 'Text'; value: string };
export type PlaceholderNode = { kind: 'Placeholder'; key: string };

export type Node = TextNode | PlaceholderNode;

export interface TemplateAST {
  nodes: Node[];
}
