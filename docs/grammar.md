# BASIC Subset Grammar (BNF)

Based on Tiny BASIC with extensions (FOR-NEXT, REM).

## Terminals

- `number`: integer or float literal
- `string`: quoted string `"..."`
- `ident`: letter or letter followed by alphanumeric (variable name)
- `linenum`: line number at start of line (integer)
- Keywords: PRINT, LET, INPUT, IF, THEN, ELSE, END, GOTO, GOSUB, RETURN, FOR, TO, STEP, NEXT, REM
- Operators: + - * / = < <= > >= <>
- Punctuation: ( ) , newline

## Grammar

```
program     ::= line (newline line)* newline? eof
line        ::= linenum? statement (':' statement)*
linenum     ::= number

statement   ::= print_stmt
              | let_stmt
              | input_stmt
              | if_stmt
              | goto_stmt
              | gosub_stmt
              | return_stmt
              | for_stmt
              | next_stmt
              | end_stmt
              | rem_stmt

print_stmt  ::= PRINT expr_list
expr_list   ::= (string | expression) (',' (string | expression))*

let_stmt    ::= LET ident '=' expression
input_stmt  ::= INPUT ident (',' ident)*
if_stmt     ::= IF expression relop expression THEN statement (ELSE statement)?
goto_stmt   ::= GOTO expression
gosub_stmt  ::= GOSUB expression
return_stmt ::= RETURN
for_stmt    ::= FOR ident '=' expression TO expression (STEP expression)?
next_stmt   ::= NEXT ident?
end_stmt    ::= END
rem_stmt    ::= REM (any rest of line)

expression  ::= ('+' | '-')? term (('+' | '-') term)*
term        ::= factor (('*' | '/') factor)*
factor      ::= ident
              | number
              | '(' expression ')'
              | builtin_call

builtin_call ::= ident '(' expression ')'   // e.g. RND(1), ABS(x)

relop       ::= '<' | '<=' | '>' | '>=' | '=' | '<>'
```

## Notes

- Line numbers are optional; when present they identify the line for GOTO/GOSUB.
- Multiple statements per line are separated by `:`.
- REM consumes the rest of the line.
- Variable names are case-insensitive for keywords; identifiers are single letters A–Z or extended alphanumeric.
