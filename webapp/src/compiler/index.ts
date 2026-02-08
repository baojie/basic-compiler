import { parse } from './parser';
import { transpileToJS } from './transpiler';
export { LexerError } from './lexer';
export { ParseError } from './parser';
export { parse } from './parser';
export { transpileToJS } from './transpiler';

export function compile(source: string): string {
  const program = parse(source);
  return transpileToJS(program);
}

export async function run(
  source: string,
  print: (s: string) => void,
  input: () => Promise<string>
): Promise<void> {
  const code = compile(source);
  const fn = new Function('__print', '__input', code);
  const promise = fn(print, input);
  if (promise && typeof promise.then === 'function') await promise;
}
