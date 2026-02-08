import type { Program, Stmt, Expr } from './ast';

export function transpileToJS(program: Program): string {
  const lines: string[] = [];
  const lineIndex: Record<number, number> = {};
  const blocks: { number: number | null; statements: Stmt[] }[] = [];

  program.lines.forEach((line) => {
    const idx = blocks.length;
    if (line.number != null) lineIndex[line.number] = idx;
    else lineIndex[idx] = idx;
    blocks.push({ number: line.number, statements: line.statements });
  });

  let indent = 0;
  function emit(s = '') {
    lines.push(s ? '  '.repeat(indent) + s : '');
  }
  function expr(e: Expr): string {
    switch (e.kind) {
      case 'number': return String(e.value);
      case 'string': return JSON.stringify(e.value);
      case 'var': return `_v("${e.name}")`;
      case 'unary': return `(${e.op}${expr(e.operand)})`;
      case 'binary': {
        const op = e.op === '=' ? '===' : e.op === '<>' ? '!==' : e.op;
        return `(${expr(e.left)} ${op} ${expr(e.right)})`;
      }
      case 'builtin':
        if (e.name === 'RND' && e.args.length === 1)
          return `Math.floor(Math.random() * _num(${expr(e.args[0])}))`;
        if (e.name === 'ABS' && e.args.length === 1) return `Math.abs(${expr(e.args[0])})`;
        return `_builtin("${e.name}", [${e.args.map(expr).join(', ')}])`;
      default: return '';
    }
  }
  function stmt(s: Stmt): void {
    switch (s.kind) {
      case 'print': {
        const parts = s.items.map((item) =>
          item.kind === 'string' ? `__print(${JSON.stringify(item.value)})` : `__print(String(${expr(item)}))`
        );
        emit(parts.join('; ') + '; __print("\\n")');
        return;
      }
      case 'let':
        emit(`_set("${s.name}", ${expr(s.value)})`);
        return;
      case 'input':
        for (const v of s.variables) emit(`_set("${v}", _num(await __input()))`);
        return;
      case 'if': {
        const op = s.relop === '=' ? '===' : s.relop === '<>' ? '!==' : s.relop;
        emit(`if (${expr(s.left)} ${op} ${expr(s.right)}) {`);
        indent++;
        stmt(s.then_stmt);
        indent--;
        if (s.else_stmt) {
          emit('} else {');
          indent++;
          stmt(s.else_stmt);
          indent--;
        }
        emit('}');
        return;
      }
      case 'goto':
        emit('_pc = _line_index[_num(' + expr(s.target) + ')] ?? _pc + 1; continue;');
        return;
      case 'gosub':
        emit('_gosub_stack.push(_pc + 1); _pc = _line_index[_num(' + expr(s.target) + ')] ?? _pc + 1; continue;');
        return;
      case 'return':
        emit('_pc = _gosub_stack.pop(); continue;');
        return;
      case 'for': {
        const stepVal = s.step ? expr(s.step) : '1';
        emit(`let __start = _num(${expr(s.start)}), __end = _num(${expr(s.end)}), __step = _num(${stepVal});`);
        emit('for (let __i = __start; (__step > 0 && __i <= __end) || (__step < 0 && __i >= __end); __i += __step) {');
        indent++;
        emit(`_set("${s.var}", __i);`);
        s.body.forEach(stmt);
        indent--;
        emit('}');
        return;
      }
      case 'next':
        emit('/* NEXT */');
        return;
      case 'end':
        emit('_pc = _blocks; continue;');
        return;
      case 'rem':
        emit(`/* REM ${s.text} */`);
        return;
    }
  }

  lines.push('return (async function() {');
  indent++;
  emit('const _v = (name) => _vars[name] ?? 0;');
  emit('const _set = (name, val) => { _vars[name] = val; };');
  emit('const _num = (x) => (typeof x === "number" && Number.isInteger(x)) ? x : Number(x);');
  emit('let _vars = {}, _line_index = ' + JSON.stringify(lineIndex) + ', _gosub_stack = [], _pc = 0, _blocks = ' + blocks.length + ';');
  emit('block: while (_pc < _blocks) {');
  indent++;
  blocks.forEach((block, i) => {
    emit(`if (_pc === ${i}) {`);
    indent++;
    block.statements.forEach(stmt);
    emit('_pc = ' + (i + 1) + '; continue block;');
    indent--;
    emit('}');
  });
  indent--;
  emit('}');
  indent--;
  lines.push('})();');
  return lines.join('\n');
}
