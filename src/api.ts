import { compile, type CompileOptions, type Ctx } from './core/compile';
import { parseTemplate } from './core/parser';

export function template<T extends Ctx = Ctx>(
  source: string,
  options: CompileOptions = {}
): (ctx: T) => string {
  const ast = parseTemplate(source);
  return compile(ast, options);
}
