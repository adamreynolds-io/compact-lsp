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
  NewTypeDeclaration,
  ExportList,
  ParameterizedType,
  TupleType,
  TypeReference,
  RangeArgument,
  StringArgument,
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
  SpreadExpression,
  BytesLiteral,
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

    it('extracts exact languageVersion onto SourceFile', () => {
      const result = parse('pragma language_version 0.14.0;');
      expect(result.sourceFile.languageVersion).toBe('0.14.0');
      expect(result.sourceFile.languageVersionOperator).toBe('=');
    });

    it('extracts >= languageVersion onto SourceFile', () => {
      const result = parse('pragma language_version >= 0.14.0;');
      expect(result.sourceFile.languageVersion).toBe('0.14.0');
      expect(result.sourceFile.languageVersionOperator).toBe('>=');
    });

    it('leaves languageVersion undefined when no pragma', () => {
      const result = parse('circuit foo() : Field { return 1; }');
      expect(result.sourceFile.languageVersion).toBeUndefined();
      expect(result.sourceFile.languageVersionOperator).toBeUndefined();
    });

    it('uses first pragma language_version when multiple exist', () => {
      const result = parse('pragma language_version 0.14.0;\npragma language_version 0.20.0;');
      expect(result.sourceFile.languageVersion).toBe('0.14.0');
      expect(result.sourceFile.languageVersionOperator).toBe('=');
    });

    it('ignores non-language_version pragmas', () => {
      const result = parse('pragma other_thing 1.0;');
      expect(result.sourceFile.languageVersion).toBeUndefined();
      expect(result.sourceFile.languageVersionOperator).toBeUndefined();
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

  describe('selective imports', () => {
    it('parses import { name } from Module', () => {
      const result = parse('import { foo } from MyModule;');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as ImportDeclaration;
      expect(decl.kind).toBe('ImportDeclaration');
      expect(decl.moduleName).toBe('MyModule');
      expect(decl.specifiers).toHaveLength(1);
      expect(decl.specifiers![0].name).toBe('foo');
      expect(decl.specifiers![0].alias).toBeUndefined();
    });

    it('parses import { name as alias } from Module', () => {
      const result = parse('import { foo as bar, baz } from MyModule;');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as ImportDeclaration;
      expect(decl.specifiers).toHaveLength(2);
      expect(decl.specifiers![0].name).toBe('foo');
      expect(decl.specifiers![0].alias).toBe('bar');
      expect(decl.specifiers![1].name).toBe('baz');
    });

    it('parses prefix import: import Module prefix P$', () => {
      const result = parse('import MyModule prefix M$;');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as ImportDeclaration;
      expect(decl.moduleName).toBe('MyModule');
      expect(decl.prefix).toBe('M$');
    });

    it('parses string-path import', () => {
      const result = parse('import "path/to/Module" prefix P$;');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as ImportDeclaration;
      expect(decl.source).toBe('path/to/Module');
      expect(decl.prefix).toBe('P$');
    });
  });

  describe('export list', () => {
    it('parses export { name1, name2 }', () => {
      const result = parse('export { foo, bar };');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as ExportList;
      expect(decl.kind).toBe('ExportList');
      expect(decl.names).toHaveLength(2);
      expect(decl.names[0].name).toBe('foo');
      expect(decl.names[1].name).toBe('bar');
    });
  });

  describe('new type declaration', () => {
    it('parses new type Name = TypeExpr', () => {
      const result = parse('new type MyBool = Boolean;');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as NewTypeDeclaration;
      expect(decl.kind).toBe('NewTypeDeclaration');
      expect(decl.name).toBe('MyBool');
      expect((decl.typeExpr as TypeReference).name).toBe('Boolean');
    });

    it('parses export new type with generics', () => {
      const result = parse('export new type Pair<#A, #B> = [A, B];');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as NewTypeDeclaration;
      expect(decl.isExport).toBe(true);
      expect(decl.name).toBe('Pair');
      expect(decl.generics).toEqual(['A', 'B']);
      expect(decl.typeExpr.kind).toBe('TupleType');
    });
  });

  describe('generic type alias', () => {
    it('parses type Name<#A> = TypeExpr', () => {
      const result = parse('type Wrapper<#T> = T;');
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as ConstDeclaration;
      expect(decl.name).toBe('Wrapper');
    });
  });

  describe('Bytes literal', () => {
    it('parses Bytes[1, 2, 3]', () => {
      const result = parse('circuit f() : Void { const a = Bytes[1, 2, 3]; }');
      expect(result.errors).toHaveLength(0);
      const circuit = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = circuit.body[0] as ConstStatement;
      expect(stmt.initializer.kind).toBe('BytesLiteral');
      const lit = stmt.initializer as BytesLiteral;
      expect(lit.elements).toHaveLength(3);
    });

    it('parses empty Bytes[]', () => {
      const result = parse('circuit f() : Void { const a = Bytes[]; }');
      expect(result.errors).toHaveLength(0);
      const circuit = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = circuit.body[0] as ConstStatement;
      const lit = stmt.initializer as BytesLiteral;
      expect(lit.elements).toHaveLength(0);
    });
  });

  describe('spread expressions', () => {
    it('parses spread in tuple literal', () => {
      const result = parse('circuit f() : Void { const a = [...b, 1]; }');
      expect(result.errors).toHaveLength(0);
      const circuit = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = circuit.body[0] as ConstStatement;
      const tuple = stmt.initializer as TupleLiteral;
      expect(tuple.elements[0].kind).toBe('SpreadExpression');
    });

    it('parses spread in struct construction', () => {
      const result = parse('circuit f() : Void { const a = S { ...s1, x: 1 }; }');
      expect(result.errors).toHaveLength(0);
      const circuit = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = circuit.body[0] as ConstStatement;
      const struct = stmt.initializer as StructConstruction;
      expect(struct.spread).toBeDefined();
      expect(struct.spread!.kind).toBe('SpreadExpression');
    });
  });

  describe('struct field shorthand', () => {
    it('parses Point { x, y }', () => {
      const result = parse('circuit f() : Void { const a = Point { x, y }; }');
      expect(result.errors).toHaveLength(0);
      const circuit = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = circuit.body[0] as ConstStatement;
      const struct = stmt.initializer as StructConstruction;
      expect(struct.fields).toHaveLength(2);
      expect(struct.fields[0].isShorthand).toBe(true);
      expect(struct.fields[0].name).toBe('x');
      expect(struct.fields[1].isShorthand).toBe(true);
    });

    it('parses mixed shorthand and explicit', () => {
      const result = parse('circuit f() : Void { const a = Point { x, y: z }; }');
      expect(result.errors).toHaveLength(0);
      const circuit = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = circuit.body[0] as ConstStatement;
      const struct = stmt.initializer as StructConstruction;
      expect(struct.fields[0].isShorthand).toBe(true);
      expect(struct.fields[1].isShorthand).toBeUndefined();
      expect(struct.fields[1].name).toBe('y');
    });
  });

  describe('multiple const bindings', () => {
    it('parses const a = 1, b = 2', () => {
      const result = parse('circuit f() : Void { const a = 1, b = 2; }');
      expect(result.errors).toHaveLength(0);
      const circuit = result.sourceFile.declarations[0] as CircuitDefinition;
      expect(circuit.body).toHaveLength(2);
      expect((circuit.body[0] as ConstStatement).name).toBe('a');
      expect((circuit.body[1] as ConstStatement).name).toBe('b');
    });
  });

  describe('assert with message', () => {
    it('parses assert(cond, "msg")', () => {
      const result = parse('circuit f() : Void { assert(x == 0, "x must be zero"); }');
      expect(result.errors).toHaveLength(0);
      const circuit = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = circuit.body[0] as AssertStatement;
      expect(stmt.message).toBeDefined();
      expect((stmt.message as LiteralExpression).literalType).toBe('string');
    });

    it('parses assert without message', () => {
      const result = parse('circuit f() : Void { assert(x == 0); }');
      expect(result.errors).toHaveLength(0);
      const circuit = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = circuit.body[0] as AssertStatement;
      expect(stmt.message).toBeUndefined();
    });
  });

  describe('arrow functions with block bodies', () => {
    it('parses (x) => { return x; }', () => {
      const result = parse('circuit f() : Void { const a = (x: Field) => { return x; }; }');
      expect(result.errors).toHaveLength(0);
      const circuit = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = circuit.body[0] as ConstStatement;
      const arrow = stmt.initializer as ArrowFunction;
      expect(Array.isArray(arrow.body)).toBe(true);
      const body = arrow.body as ReturnStatement[];
      expect(body).toHaveLength(1);
      expect(body[0].kind).toBe('ReturnStatement');
    });

    it('expression body still works', () => {
      const result = parse('circuit f() : Void { const a = (x: Field) => x + 1; }');
      expect(result.errors).toHaveLength(0);
      const circuit = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = circuit.body[0] as ConstStatement;
      const arrow = stmt.initializer as ArrowFunction;
      expect(Array.isArray(arrow.body)).toBe(false);
    });
  });

  describe('range type arguments', () => {
    it('parses Uint<0..4294967295>', () => {
      const result = parse('circuit f(x: Uint<0..4294967295>) : Void { }');
      expect(result.errors).toHaveLength(0);
      const circuit = result.sourceFile.declarations[0] as CircuitDefinition;
      const paramType = circuit.params[0].typeAnnotation as ParameterizedType;
      expect(paramType.args[0].kind).toBe('RangeArgument');
      const range = paramType.args[0] as RangeArgument;
      expect(range.low).toBe('0');
      expect(range.high).toBe('4294967295');
    });
  });

  describe('destructuring', () => {
    it('parses tuple destructuring: const [a, b] = expr', () => {
      const result = parse('circuit f() : Void { const [a, b] = pair; }');
      expect(result.errors).toHaveLength(0);
      const circuit = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = circuit.body[0] as ConstStatement;
      expect(stmt.pattern).toBeDefined();
      expect(stmt.pattern!.kind).toBe('TuplePattern');
      expect(stmt.pattern!.elements).toEqual(['a', 'b']);
    });

    it('parses struct destructuring: const {a, b: alias} = expr', () => {
      const result = parse('circuit f() : Void { const {a, b: c} = point; }');
      expect(result.errors).toHaveLength(0);
      const circuit = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = circuit.body[0] as ConstStatement;
      expect(stmt.pattern).toBeDefined();
      expect(stmt.pattern!.kind).toBe('StructPattern');
    });

    it('parses skipped elements: const [x, , , y] = expr', () => {
      const result = parse('circuit f() : Void { const [x, , , y] = tup; }');
      expect(result.errors).toHaveLength(0);
      const circuit = result.sourceFile.declarations[0] as CircuitDefinition;
      const stmt = circuit.body[0] as ConstStatement;
      expect(stmt.pattern!.kind).toBe('TuplePattern');
      expect(stmt.pattern!.elements).toEqual(['x', null, null, 'y']);
    });

    it('parses destructuring in parameter position', () => {
      const result = parse('circuit f([x, y]: [Field, Field]) : Void { }');
      expect(result.errors).toHaveLength(0);
      const circuit = result.sourceFile.declarations[0] as CircuitDefinition;
      expect(circuit.params[0].pattern).toBeDefined();
      expect(circuit.params[0].pattern!.kind).toBe('TuplePattern');
    });
  });

  describe('resource limits', () => {
    it('parses normal-depth expressions without errors', () => {
      // Nesting depth of 10 — well within limits
      const expr = '((((((((((x))))))))))';
      const result = parse(`circuit f() : Field { return ${expr}; }`);
      expect(result.errors).toHaveLength(0);
    });

    it('reports error for deeply nested expressions exceeding depth limit', () => {
      // Build nesting depth > 200 using nested parentheses
      const depth = 210;
      const open = '('.repeat(depth);
      const close = ')'.repeat(depth);
      const expr = `${open}x${close}`;
      const result = parse(`circuit f() : Field { return ${expr}; }`);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.message.includes('too deeply nested'))).toBe(true);
    });

    it('does not crash on deeply nested expressions', () => {
      // Use depth 250 — exceeds the 200 limit but the depth check prevents stack overflow
      const depth = 250;
      const open = '('.repeat(depth);
      const close = ')'.repeat(depth);
      const expr = `${open}x${close}`;
      // Should not throw — depth limit catches it before stack overflow
      const result = parse(`circuit f() : Field { return ${expr}; }`);
      expect(result).toBeDefined();
      expect(result.errors.some((e) => e.message.includes('too deeply nested'))).toBe(true);
    });

    it('looksLikeArrowFunction returns false when lookahead limit is exceeded', () => {
      // Create a ( followed by many tokens without a closing ) — triggers lookahead
      // Use identifiers separated by commas to trigger the ident-followed-by-comma path
      const manyParams = Array(600).fill('x').join(', ');
      const source = `circuit f() : Field { const a = (${manyParams}); }`;
      const result = parse(source);
      // Should not hang — the parse may produce errors but must complete
      expect(result).toBeDefined();
    });

    it('error recovery in body does not crash on garbage tokens inside circuit', () => {
      // Random invalid tokens inside a circuit body — exercises the statement-level
      // catch block and body-level fallback brace matching
      const source = 'circuit f() : Field { @@@ $$$ %%% }';
      const result = parse(source);
      expect(result).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('error recovery handles unclosed braces in circuit body', () => {
      // Missing closing brace — the parser tolerates EOF without crashing
      const source = 'circuit f() : Field { return x;';
      const result = parse(source);
      expect(result).toBeDefined();
      // Parser may or may not produce errors for unclosed brace at EOF,
      // but it must not crash
      expect(result.sourceFile).toBeDefined();
    });
  });

  describe('string type arguments', () => {
    it('parses Opaque<"string"> as return type', () => {
      const source = 'ledger myLedger : Opaque<"CoinInfo">;';
      const result = parse(source);
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as LedgerDeclaration;
      const type = decl.typeAnnotation as ParameterizedType;
      expect(type.kind).toBe('ParameterizedType');
      expect(type.name).toBe('Opaque');
      expect(type.args).toHaveLength(1);
      expect(type.args[0].kind).toBe('StringArgument');
      expect((type.args[0] as StringArgument).value).toBe('"CoinInfo"');
    });

    it('parses nested string type arg: Map<Uint<128>, Opaque<"string">>', () => {
      const source = 'ledger m : Map<Uint<128>, Opaque<"string">>;';
      const result = parse(source);
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as LedgerDeclaration;
      const type = decl.typeAnnotation as ParameterizedType;
      expect(type.name).toBe('Map');
      expect(type.args).toHaveLength(2);
      const opaqueArg = type.args[1] as ParameterizedType;
      expect(opaqueArg.name).toBe('Opaque');
      expect(opaqueArg.args[0].kind).toBe('StringArgument');
      expect((opaqueArg.args[0] as StringArgument).value).toBe('"string"');
    });

    it('parses default<Opaque<"string">> in expression position', () => {
      const source = 'circuit f() : Opaque<"test"> { const x = default(Opaque<"test">); }';
      const result = parse(source);
      // Should parse without OOM/infinite loop; may have minor errors but no crash
      expect(result).toBeDefined();
      expect(result.sourceFile).toBeDefined();
    });
  });

  describe('block comments in source', () => {
    it('code with block comments produces no errors', () => {
      const source = `
        /** This is a doc comment */
        circuit add(x: Field, y: Field) : Field {
          /* inline */ const z = x;
          return z;
        }
      `;
      const result = parse(source);
      expect(result.errors).toHaveLength(0);
      const decl = result.sourceFile.declarations[0] as CircuitDefinition;
      expect(decl.kind).toBe('CircuitDefinition');
      expect(decl.name).toBe('add');
    });
  });
});
