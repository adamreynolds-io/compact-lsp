import { describe, it, expect } from 'vitest';
import { parse } from './parser';
import {
  CircuitDefinition,
  ExternalCircuit,
  LedgerDeclaration,
  WitnessDeclaration,
  StructDefinition,
  EnumDefinition,
  ModuleDefinition,
  ConstructorDeclaration,
  ConstDeclaration,
  ContractDeclaration,
  PragmaDeclaration,
  ImportDeclaration,
  IncludeDeclaration,
  ParameterizedType,
  TupleType,
  TypeReference,
  BinaryExpression,
  UnaryExpression,
  ConditionalExpression,
  CallExpression,
  MemberExpression,
  IndexExpression,
  IdentifierExpression,
  LiteralExpression,
  TupleLiteral,
  StructConstruction,
  CastExpression,
  ArrowFunction,
  AssignmentExpression,
  ReturnStatement,
  ConstStatement,
  IfStatement,
  ForStatement,
  AssertStatement,
  ExpressionStatement,
  BlockStatement,
} from './ast';

describe('Parser', () => {
  describe('circuit definition', () => {
    it('parses a basic circuit', () => {
      const result = parse('circuit add(x: Field, y: Field) : Field { }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      expect(decl.kind).toBe('CircuitDefinition');
      expect(decl.name).toBe('add');
      expect(decl.params).toHaveLength(2);
      expect(decl.params[0].name).toBe('x');
      expect((decl.params[0].typeAnnotation as TypeReference).name).toBe('Field');
      expect(decl.params[1].name).toBe('y');
      expect((decl.returnType as TypeReference).name).toBe('Field');
    });

    it('parses circuit with modifiers', () => {
      const result = parse('export pure circuit divide(a: Field, b: Field) : Field { }');
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      expect(decl.isExport).toBe(true);
      expect(decl.isPure).toBe(true);
      expect(decl.name).toBe('divide');
    });

    it('parses circuit with generics', () => {
      const result = parse('circuit identity<T>(x: T) : T { }');
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      expect(decl.generics).toEqual(['T']);
      expect(decl.name).toBe('identity');
    });
  });

  describe('external circuit', () => {
    it('parses external circuit (semicolon ending)', () => {
      const result = parse('circuit multiply(a: Field, b: Field) : Field;');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as ExternalCircuit;
      expect(decl.kind).toBe('ExternalCircuit');
      expect(decl.name).toBe('multiply');
      expect(decl.params).toHaveLength(2);
    });
  });

  describe('ledger declaration', () => {
    it('parses a ledger', () => {
      const result = parse('export sealed ledger myLedger : Field;');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as LedgerDeclaration;
      expect(decl.kind).toBe('LedgerDeclaration');
      expect(decl.name).toBe('myLedger');
      expect((decl.typeAnnotation as TypeReference).name).toBe('Field');
      expect(decl.isExport).toBe(true);
      expect(decl.isSealed).toBe(true);
    });
  });

  describe('witness declaration', () => {
    it('parses a witness', () => {
      const result = parse('witness myWitness(x: Field) : Field;');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as WitnessDeclaration;
      expect(decl.kind).toBe('WitnessDeclaration');
      expect(decl.name).toBe('myWitness');
      expect(decl.params).toHaveLength(1);
      expect((decl.returnType as TypeReference).name).toBe('Field');
    });
  });

  describe('struct definition', () => {
    it('parses a struct with fields', () => {
      const result = parse('struct Point { x: Field; y: Field; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as StructDefinition;
      expect(decl.kind).toBe('StructDefinition');
      expect(decl.name).toBe('Point');
      expect(decl.fields).toHaveLength(2);
      expect(decl.fields[0].name).toBe('x');
      expect(decl.fields[1].name).toBe('y');
    });

    it('parses a struct with generics', () => {
      const result = parse('struct Pair<A, B> { first: A; second: B; }');
      const decl = result.sourceFile.declarations[0] as StructDefinition;
      expect(decl.generics).toEqual(['A', 'B']);
    });
  });

  describe('enum definition', () => {
    it('parses an enum with variants', () => {
      const result = parse('enum Color { red, green, blue }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as EnumDefinition;
      expect(decl.kind).toBe('EnumDefinition');
      expect(decl.name).toBe('Color');
      expect(decl.variants).toHaveLength(3);
      expect(decl.variants.map((v) => v.name)).toEqual(['red', 'green', 'blue']);
    });
  });

  describe('module definition', () => {
    it('parses a module with nested declarations', () => {
      const result = parse('module Foo { circuit bar() : Field { } }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as ModuleDefinition;
      expect(decl.kind).toBe('ModuleDefinition');
      expect(decl.name).toBe('Foo');
      expect(decl.declarations).toHaveLength(1);
      expect(decl.declarations[0].kind).toBe('CircuitDefinition');
    });
  });

  describe('constructor', () => {
    it('parses a constructor', () => {
      const result = parse('constructor(x: Field) { }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as ConstructorDeclaration;
      expect(decl.kind).toBe('ConstructorDeclaration');
      expect(decl.params).toHaveLength(1);
      expect(decl.params[0].name).toBe('x');
    });
  });

  describe('const declaration', () => {
    it('parses const with type annotation', () => {
      const result = parse('const x: Field = 42;');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as ConstDeclaration;
      expect(decl.kind).toBe('ConstDeclaration');
      expect(decl.name).toBe('x');
      expect((decl.typeAnnotation as TypeReference).name).toBe('Field');
    });

    it('parses const without type annotation', () => {
      const result = parse('const x = 42;');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as ConstDeclaration;
      expect(decl.name).toBe('x');
      expect(decl.typeAnnotation).toBeUndefined();
    });
  });

  describe('contract declaration', () => {
    it('parses a contract with circuit signatures', () => {
      const result = parse('contract MyContract { circuit foo(x: Field) : Field; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as ContractDeclaration;
      expect(decl.kind).toBe('ContractDeclaration');
      expect(decl.name).toBe('MyContract');
      expect(decl.circuits).toHaveLength(1);
      expect(decl.circuits[0].name).toBe('foo');
    });
  });

  describe('pragma', () => {
    it('parses a pragma declaration', () => {
      const result = parse('pragma language_version 0.14.0;');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as PragmaDeclaration;
      expect(decl.kind).toBe('PragmaDeclaration');
      expect(decl.name).toBe('language_version');
    });
  });

  describe('import', () => {
    it('parses an import declaration', () => {
      const result = parse('import myModule;');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as ImportDeclaration;
      expect(decl.kind).toBe('ImportDeclaration');
      expect(decl.moduleName).toBe('myModule');
    });
  });

  describe('include', () => {
    it('parses an include declaration', () => {
      const result = parse('include "standard_library.compact";');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as IncludeDeclaration;
      expect(decl.kind).toBe('IncludeDeclaration');
      expect(decl.path).toBe('standard_library.compact');
    });
  });

  describe('type annotations', () => {
    it('parses simple type reference', () => {
      const result = parse('ledger x : Field;');
      const decl = result.sourceFile.declarations[0] as LedgerDeclaration;
      expect(decl.typeAnnotation.kind).toBe('TypeReference');
      expect((decl.typeAnnotation as TypeReference).name).toBe('Field');
    });

    it('parses parameterized built-in type', () => {
      const result = parse('ledger x : Uint<32>;');
      const decl = result.sourceFile.declarations[0] as LedgerDeclaration;
      const type = decl.typeAnnotation as ParameterizedType;
      expect(type.kind).toBe('ParameterizedType');
      expect(type.name).toBe('Uint');
      expect(type.args).toHaveLength(1);
      expect(type.args[0].kind).toBe('NumberArgument');
    });

    it('parses multi-arg parameterized type', () => {
      const result = parse('ledger x : Vector<10, Field>;');
      const decl = result.sourceFile.declarations[0] as LedgerDeclaration;
      const type = decl.typeAnnotation as ParameterizedType;
      expect(type.kind).toBe('ParameterizedType');
      expect(type.name).toBe('Vector');
      expect(type.args).toHaveLength(2);
    });

    it('parses user-defined generic type', () => {
      const result = parse('ledger x : MyType<Field>;');
      const decl = result.sourceFile.declarations[0] as LedgerDeclaration;
      const type = decl.typeAnnotation as ParameterizedType;
      expect(type.kind).toBe('ParameterizedType');
      expect(type.name).toBe('MyType');
    });

    it('parses tuple type', () => {
      const result = parse('ledger x : [Field, Boolean];');
      const decl = result.sourceFile.declarations[0] as LedgerDeclaration;
      const type = decl.typeAnnotation as TupleType;
      expect(type.kind).toBe('TupleType');
      expect(type.elements).toHaveLength(2);
    });
  });

  describe('body skipping', () => {
    it('skips circuit body with nested braces', () => {
      const result = parse('circuit test(x: Field) : Field { if (true) { return x; } }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      expect(decl.kind).toBe('CircuitDefinition');
      expect(decl.bodyRange).toBeDefined();
    });
  });

  describe('error recovery', () => {
    it('recovers from malformed declaration to valid one', () => {
      const result = parse('@@@ struct Point { x: Field; }');
      // Should have errors but still parse the struct
      expect(result.errors.length).toBeGreaterThan(0);
      const structs = result.sourceFile.declarations.filter((d) => d.kind === 'StructDefinition');
      expect(structs).toHaveLength(1);
    });

    it('reports missing semicolon', () => {
      const result = parse('ledger x : Field');
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('source positions', () => {
    it('all declarations have ranges', () => {
      const result = parse('circuit foo() : Field { }\nledger x : Field;\nstruct S { a: Field; }');
      for (const decl of result.sourceFile.declarations) {
        expect(decl.range).toBeDefined();
        expect(decl.range.start).toBeDefined();
        expect(decl.range.end).toBeDefined();
      }
    });
  });

  describe('multiple declarations', () => {
    it('parses multiple top-level declarations', () => {
      const source = `
        pragma language_version 0.14.0;
        include "standard_library.compact";
        export sealed ledger counter : Field;
        witness getSecret() : Field;
        export circuit increment(amount: Field) : Void { }
      `;
      const result = parse(source);
      expect(result.errors).toHaveLength(0);
      expect(result.sourceFile.declarations).toHaveLength(5);
    });
  });

  describe('expression parsing', () => {
    it('parses binary arithmetic with correct precedence (+ and *)', () => {
      const result = parse('circuit test() : Field { return x + y * z; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      expect(stmt.kind).toBe('ReturnStatement');
      const expr = stmt.value as BinaryExpression;
      expect(expr.kind).toBe('BinaryExpression');
      expect(expr.operator).toBe('+');
      const right = expr.right as BinaryExpression;
      expect(right.kind).toBe('BinaryExpression');
      expect(right.operator).toBe('*');
      expect((right.left as IdentifierExpression).name).toBe('y');
      expect((right.right as IdentifierExpression).name).toBe('z');
      expect((expr.left as IdentifierExpression).name).toBe('x');
    });

    it('parses logical operators with correct precedence (&& and ||)', () => {
      const result = parse('circuit test() : Boolean { return a && b || c; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      const expr = stmt.value as BinaryExpression;
      expect(expr.kind).toBe('BinaryExpression');
      expect(expr.operator).toBe('||');
      const left = expr.left as BinaryExpression;
      expect(left.kind).toBe('BinaryExpression');
      expect(left.operator).toBe('&&');
      expect((left.left as IdentifierExpression).name).toBe('a');
      expect((left.right as IdentifierExpression).name).toBe('b');
      expect((expr.right as IdentifierExpression).name).toBe('c');
    });

    it('parses equality comparison (==)', () => {
      const result = parse('circuit test() : Boolean { return a == b; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      const expr = stmt.value as BinaryExpression;
      expect(expr.kind).toBe('BinaryExpression');
      expect(expr.operator).toBe('==');
      expect((expr.left as IdentifierExpression).name).toBe('a');
      expect((expr.right as IdentifierExpression).name).toBe('b');
    });

    it('parses inequality comparison (!=)', () => {
      const result = parse('circuit test() : Boolean { return a != b; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      const expr = stmt.value as BinaryExpression;
      expect(expr.kind).toBe('BinaryExpression');
      expect(expr.operator).toBe('!=');
    });

    it('parses less-than comparison (<)', () => {
      const result = parse('circuit test() : Boolean { return a < b; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      const expr = stmt.value as BinaryExpression;
      expect(expr.kind).toBe('BinaryExpression');
      expect(expr.operator).toBe('<');
    });

    it('parses greater-than-or-equal comparison (>=)', () => {
      const result = parse('circuit test() : Boolean { return a >= b; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      const expr = stmt.value as BinaryExpression;
      expect(expr.kind).toBe('BinaryExpression');
      expect(expr.operator).toBe('>=');
    });

    it('parses unary negation (!)', () => {
      const result = parse('circuit test() : Boolean { return !flag; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      const expr = stmt.value as UnaryExpression;
      expect(expr.kind).toBe('UnaryExpression');
      expect(expr.operator).toBe('!');
      expect((expr.operand as IdentifierExpression).name).toBe('flag');
    });

    it('parses conditional (ternary) expression', () => {
      const result = parse('circuit test() : Field { return cond ? a : b; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      const expr = stmt.value as ConditionalExpression;
      expect(expr.kind).toBe('ConditionalExpression');
      expect((expr.condition as IdentifierExpression).name).toBe('cond');
      expect((expr.consequent as IdentifierExpression).name).toBe('a');
      expect((expr.alternate as IdentifierExpression).name).toBe('b');
    });

    it('parses function call expression', () => {
      const result = parse('circuit test() : Field { return add(x, y); }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      const expr = stmt.value as CallExpression;
      expect(expr.kind).toBe('CallExpression');
      expect((expr.callee as IdentifierExpression).name).toBe('add');
      expect(expr.args).toHaveLength(2);
      expect((expr.args[0] as IdentifierExpression).name).toBe('x');
      expect((expr.args[1] as IdentifierExpression).name).toBe('y');
    });

    it('parses member access expression', () => {
      const result = parse('circuit test() : Field { return point.x; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      const expr = stmt.value as MemberExpression;
      expect(expr.kind).toBe('MemberExpression');
      expect((expr.object as IdentifierExpression).name).toBe('point');
      expect(expr.property).toBe('x');
    });

    it('parses index access expression', () => {
      const result = parse('circuit test() : Field { return tuple[0]; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      const expr = stmt.value as IndexExpression;
      expect(expr.kind).toBe('IndexExpression');
      expect((expr.object as IdentifierExpression).name).toBe('tuple');
      const index = expr.index as LiteralExpression;
      expect(index.kind).toBe('LiteralExpression');
      expect(index.literalType).toBe('number');
      expect(index.value).toBe('0');
    });

    it('parses identifier expression', () => {
      const result = parse('circuit test() : Field { return x; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      const expr = stmt.value as IdentifierExpression;
      expect(expr.kind).toBe('IdentifierExpression');
      expect(expr.name).toBe('x');
    });

    it('parses numeric literal', () => {
      const result = parse('circuit test() : Field { return 42; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      const expr = stmt.value as LiteralExpression;
      expect(expr.kind).toBe('LiteralExpression');
      expect(expr.literalType).toBe('number');
      expect(expr.value).toBe('42');
    });

    it('parses boolean literal', () => {
      const result = parse('circuit test() : Boolean { return true; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      const expr = stmt.value as LiteralExpression;
      expect(expr.kind).toBe('LiteralExpression');
      expect(expr.literalType).toBe('boolean');
      expect(expr.value).toBe('true');
    });

    it('parses string literal', () => {
      const result = parse('circuit test() : Field { return "hello"; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      const expr = stmt.value as LiteralExpression;
      expect(expr.kind).toBe('LiteralExpression');
      expect(expr.literalType).toBe('string');
      expect(expr.value).toBe('"hello"');
    });

    it('parses tuple literal', () => {
      const result = parse('circuit test() : Field { return [a, b, c]; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      const expr = stmt.value as TupleLiteral;
      expect(expr.kind).toBe('TupleLiteral');
      expect(expr.elements).toHaveLength(3);
      expect((expr.elements[0] as IdentifierExpression).name).toBe('a');
      expect((expr.elements[1] as IdentifierExpression).name).toBe('b');
      expect((expr.elements[2] as IdentifierExpression).name).toBe('c');
    });

    it('parses struct construction', () => {
      const result = parse('circuit test() : Field { return Point { x: 1, y: 2 }; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      const expr = stmt.value as StructConstruction;
      expect(expr.kind).toBe('StructConstruction');
      expect(expr.structName).toBe('Point');
      expect(expr.fields).toHaveLength(2);
      expect(expr.fields[0].name).toBe('x');
      expect((expr.fields[0].value as LiteralExpression).value).toBe('1');
      expect(expr.fields[1].name).toBe('y');
      expect((expr.fields[1].value as LiteralExpression).value).toBe('2');
    });

    it('parses cast expression (as keyword)', () => {
      const result = parse('circuit test() : Uint<32> { return x as Uint<32>; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      const expr = stmt.value as CastExpression;
      expect(expr.kind).toBe('CastExpression');
      expect((expr.expression as IdentifierExpression).name).toBe('x');
      const targetType = expr.targetType as ParameterizedType;
      expect(targetType.kind).toBe('ParameterizedType');
      expect(targetType.name).toBe('Uint');
    });

    it('parses range expression (..)', () => {
      const result = parse('circuit test() : Field { return 0..10; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      const expr = stmt.value as BinaryExpression;
      expect(expr.kind).toBe('BinaryExpression');
      expect(expr.operator).toBe('..');
      expect((expr.left as LiteralExpression).value).toBe('0');
      expect((expr.right as LiteralExpression).value).toBe('10');
    });

    it('parses arrow function', () => {
      const result = parse('circuit test() : Field { return (x: Field) => x + 1; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      const expr = stmt.value as ArrowFunction;
      expect(expr.kind).toBe('ArrowFunction');
      expect(expr.params).toHaveLength(1);
      expect(expr.params[0].name).toBe('x');
      expect((expr.params[0].typeAnnotation as TypeReference).name).toBe('Field');
      const body = expr.body as BinaryExpression;
      expect(body.kind).toBe('BinaryExpression');
      expect(body.operator).toBe('+');
      expect((body.left as IdentifierExpression).name).toBe('x');
      expect((body.right as LiteralExpression).value).toBe('1');
    });

    it('parses assignment expression (+=)', () => {
      const result = parse('circuit test() : Void { counter += amount; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ExpressionStatement;
      expect(stmt.kind).toBe('ExpressionStatement');
      const expr = stmt.expression as AssignmentExpression;
      expect(expr.kind).toBe('AssignmentExpression');
      expect(expr.operator).toBe('+=');
      expect((expr.target as IdentifierExpression).name).toBe('counter');
      expect((expr.value as IdentifierExpression).name).toBe('amount');
    });

    it('parses parenthesized expression affecting precedence', () => {
      const result = parse('circuit test() : Field { return (a + b) * c; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      const expr = stmt.value as BinaryExpression;
      expect(expr.kind).toBe('BinaryExpression');
      expect(expr.operator).toBe('*');
      const left = expr.left as BinaryExpression;
      expect(left.kind).toBe('BinaryExpression');
      expect(left.operator).toBe('+');
      expect((left.left as IdentifierExpression).name).toBe('a');
      expect((left.right as IdentifierExpression).name).toBe('b');
      expect((expr.right as IdentifierExpression).name).toBe('c');
    });
  });

  describe('statement parsing', () => {
    it('parses const statement inside circuit body', () => {
      const result = parse('circuit test() : Field { const x: Field = 42; return x; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      expect(decl.body).toHaveLength(2);
      const stmt = decl.body[0] as ConstStatement;
      expect(stmt.kind).toBe('ConstStatement');
      expect(stmt.name).toBe('x');
      expect((stmt.typeAnnotation as TypeReference).name).toBe('Field');
      const init = stmt.initializer as LiteralExpression;
      expect(init.kind).toBe('LiteralExpression');
      expect(init.literalType).toBe('number');
      expect(init.value).toBe('42');
    });

    it('parses return statement with value', () => {
      const result = parse('circuit test() : Field { return x + y; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      expect(stmt.kind).toBe('ReturnStatement');
      expect(stmt.value).toBeDefined();
      const expr = stmt.value as BinaryExpression;
      expect(expr.kind).toBe('BinaryExpression');
      expect(expr.operator).toBe('+');
      expect((expr.left as IdentifierExpression).name).toBe('x');
      expect((expr.right as IdentifierExpression).name).toBe('y');
    });

    it('parses return statement without value', () => {
      const result = parse('circuit test() : Void { return; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ReturnStatement;
      expect(stmt.kind).toBe('ReturnStatement');
      expect(stmt.value).toBeUndefined();
    });

    it('parses if statement', () => {
      const result = parse('circuit test() : Void { if (cond) { doSomething; } }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as IfStatement;
      expect(stmt.kind).toBe('IfStatement');
      expect((stmt.condition as IdentifierExpression).name).toBe('cond');
      expect(stmt.consequent).toHaveLength(1);
      expect(stmt.alternate).toBeUndefined();
    });

    it('parses if-else statement', () => {
      const result = parse('circuit test() : Void { if (cond) { a; } else { b; } }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as IfStatement;
      expect(stmt.kind).toBe('IfStatement');
      expect((stmt.condition as IdentifierExpression).name).toBe('cond');
      expect(stmt.consequent).toHaveLength(1);
      const consequentExpr = (stmt.consequent[0] as ExpressionStatement)
        .expression as IdentifierExpression;
      expect(consequentExpr.name).toBe('a');
      expect(stmt.alternate).toBeDefined();
      expect(stmt.alternate).toHaveLength(1);
      const alternateExpr = (stmt.alternate![0] as ExpressionStatement)
        .expression as IdentifierExpression;
      expect(alternateExpr.name).toBe('b');
    });

    it('parses for statement', () => {
      const result = parse('circuit test() : Void { for (const i of items) { doSomething; } }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ForStatement;
      expect(stmt.kind).toBe('ForStatement');
      expect(stmt.variable).toBe('i');
      expect((stmt.iterable as IdentifierExpression).name).toBe('items');
      expect(stmt.body).toHaveLength(1);
    });

    it('parses assert statement', () => {
      const result = parse('circuit test() : Void { assert(condition); }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as AssertStatement;
      expect(stmt.kind).toBe('AssertStatement');
      expect((stmt.condition as IdentifierExpression).name).toBe('condition');
    });

    it('parses expression statement', () => {
      const result = parse('circuit test() : Void { counter += amount; }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as ExpressionStatement;
      expect(stmt.kind).toBe('ExpressionStatement');
      const expr = stmt.expression as AssignmentExpression;
      expect(expr.kind).toBe('AssignmentExpression');
      expect(expr.operator).toBe('+=');
    });

    it('parses nested block statement', () => {
      const result = parse('circuit test() : Void { { const x: Field = 1; } }');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = decl.body[0] as BlockStatement;
      expect(stmt.kind).toBe('BlockStatement');
      expect(stmt.statements).toHaveLength(1);
      const inner = stmt.statements[0] as ConstStatement;
      expect(inner.kind).toBe('ConstStatement');
      expect(inner.name).toBe('x');
    });

    it('recovers from errors in body and continues parsing', () => {
      const result = parse('circuit test() : Field { @@@ invalid; return 42; }');
      // Parser should report errors for the unknown @ tokens
      expect(result.errors.length).toBeGreaterThan(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      // The unknown tokens are consumed as synthetic expression statements,
      // followed by the valid return statement. The parser recovers and
      // still produces the ReturnStatement at the end.
      const returnStmts = decl.body.filter((s) => s.kind === 'ReturnStatement');
      expect(returnStmts).toHaveLength(1);
      const ret = returnStmts[0] as ReturnStatement;
      expect(ret.kind).toBe('ReturnStatement');
      const retVal = ret.value as LiteralExpression;
      expect(retVal.value).toBe('42');
    });
  });
});
