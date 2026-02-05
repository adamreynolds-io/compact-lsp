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
      const result = parse(
        'export pure circuit divide(a: Field, b: Field) : Field { }',
      );
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
      const result = parse(
        'circuit test(x: Field) : Field { if (true) { return x; } }',
      );
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
      const structs = result.sourceFile.declarations.filter(
        (d) => d.kind === 'StructDefinition',
      );
      expect(structs).toHaveLength(1);
    });

    it('reports missing semicolon', () => {
      const result = parse('ledger x : Field');
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('source positions', () => {
    it('all declarations have ranges', () => {
      const result = parse(
        'circuit foo() : Field { }\nledger x : Field;\nstruct S { a: Field; }',
      );
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
});
