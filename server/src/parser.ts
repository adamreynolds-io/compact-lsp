import { Token, TokenKind, tokenize } from './lexer';
import {
  SourceFile,
  Declaration,
  CircuitDefinition,
  ExternalCircuit,
  LedgerDeclaration,
  WitnessDeclaration,
  StructDefinition,
  StructField,
  EnumDefinition,
  EnumVariant,
  ModuleDefinition,
  ConstructorDeclaration,
  ConstDeclaration,
  ContractDeclaration,
  PragmaDeclaration,
  ImportDeclaration,
  ImportSpecifier,
  IncludeDeclaration,
  NewTypeDeclaration,
  ExportList,
  ErrorNode,
  TypeNode,
  TypeReference,
  ParameterizedType,
  TupleType,
  TypeArgument,
  NumberArgument,
  RangeArgument,
  Parameter,
  SourceRange,
  ParseError,
  ParseResult,
  Expression,
  Statement,
  TuplePattern,
  StructPattern,
  DestructurePattern,
} from './ast';

const DECLARATION_KEYWORDS = new Set<TokenKind>([
  TokenKind.Circuit,
  TokenKind.Ledger,
  TokenKind.Witness,
  TokenKind.Struct,
  TokenKind.Enum,
  TokenKind.Module,
  TokenKind.Export,
  TokenKind.Pure,
  TokenKind.Sealed,
  TokenKind.Const,
  TokenKind.Constructor,
  TokenKind.Contract,
  TokenKind.Pragma,
  TokenKind.Import,
  TokenKind.Include,
  TokenKind.Type,
  TokenKind.New,
]);

// Precedence levels for Pratt parser (low to high)
const enum Precedence {
  None = 0,
  Assignment = 1, // = += -=
  Ternary = 2, // ? :
  Or = 3, // ||
  And = 4, // &&
  Equality = 5, // == !=
  Comparison = 6, // < > <= >=
  Range = 7, // ..
  Additive = 8, // + -
  Multiplicative = 9, // *
  Cast = 10, // as
  Unary = 11, // !
  Postfix = 12, // . [] ()
}

function getInfixPrecedence(kind: TokenKind): Precedence {
  switch (kind) {
    case TokenKind.Equals:
    case TokenKind.PlusEquals:
    case TokenKind.MinusEquals:
      return Precedence.Assignment;
    case TokenKind.Question:
      return Precedence.Ternary;
    case TokenKind.Or:
      return Precedence.Or;
    case TokenKind.And:
      return Precedence.And;
    case TokenKind.DoubleEquals:
    case TokenKind.NotEquals:
      return Precedence.Equality;
    case TokenKind.LessThan:
    case TokenKind.GreaterThan:
    case TokenKind.LessEquals:
    case TokenKind.GreaterEquals:
      return Precedence.Comparison;
    case TokenKind.DotDot:
      return Precedence.Range;
    case TokenKind.Plus:
    case TokenKind.Minus:
      return Precedence.Additive;
    case TokenKind.Star:
      return Precedence.Multiplicative;
    case TokenKind.As:
      return Precedence.Cast;
    case TokenKind.Dot:
    case TokenKind.OpenBracket:
    case TokenKind.OpenParen:
      return Precedence.Postfix;
    default:
      return Precedence.None;
  }
}

class Parser {
  private tokens: Token[];
  private pos: number = 0;
  private errors: ParseError[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ParseResult {
    const startPos = this.current().pos;
    const declarations = this.parseDeclarations();
    const endPos = this.current().pos;
    const sourceFile: SourceFile = {
      kind: 'SourceFile',
      declarations,
      range: { start: startPos, end: endPos },
    };
    return { sourceFile, errors: this.errors };
  }

  private parseDeclarations(): Declaration[] {
    const declarations: Declaration[] = [];
    while (!this.isAtEnd()) {
      const decl = this.parseDeclaration();
      if (decl) {
        declarations.push(decl);
      }
    }
    return declarations;
  }

  private parseDeclaration(): Declaration | null {
    // Collect modifiers
    let isExport = false;
    let isPure = false;
    let isSealed = false;
    const modStart = this.current().pos;

    while (
      this.check(TokenKind.Export) ||
      this.check(TokenKind.Pure) ||
      this.check(TokenKind.Sealed)
    ) {
      if (this.check(TokenKind.Export)) {
        isExport = true;
        this.advance();
      }
      if (this.check(TokenKind.Pure)) {
        isPure = true;
        this.advance();
      }
      if (this.check(TokenKind.Sealed)) {
        isSealed = true;
        this.advance();
      }
    }

    if (this.isAtEnd()) return null;

    const kind = this.current().kind;

    // Handle `export { ... }` as export list
    if (isExport && this.check(TokenKind.OpenBrace)) {
      return this.parseExportList(modStart);
    }

    switch (kind) {
      case TokenKind.Circuit:
        return this.parseCircuit(isExport, isPure, modStart);
      case TokenKind.Ledger:
        return this.parseLedger(isExport, isSealed, modStart);
      case TokenKind.Witness:
        return this.parseWitness(isExport, modStart);
      case TokenKind.Struct:
        return this.parseStruct(isExport, modStart);
      case TokenKind.Enum:
        return this.parseEnum(isExport, modStart);
      case TokenKind.Module:
        return this.parseModule(isExport, modStart);
      case TokenKind.Constructor:
        return this.parseConstructor(modStart);
      case TokenKind.Const:
        return this.parseConst(isExport, modStart);
      case TokenKind.Contract:
        return this.parseContract(isExport, modStart);
      case TokenKind.Pragma:
        return this.parsePragma(modStart);
      case TokenKind.Import:
        return this.parseImport(modStart);
      case TokenKind.Include:
        return this.parseInclude(modStart);
      case TokenKind.Type:
        return this.parseTypeAlias(isExport, modStart);
      case TokenKind.New:
        return this.parseNewType(isExport, modStart);
      default:
        return this.recoverToNextDeclaration();
    }
  }

  private parseCircuit(
    isExport: boolean,
    isPure: boolean,
    startPos: { line: number; column: number; offset: number },
  ): CircuitDefinition | ExternalCircuit {
    this.expect(TokenKind.Circuit); // consume 'circuit'
    const name = this.expectIdentifier();
    const generics = this.parseOptionalGenerics();
    const params = this.parseParameterList();

    let returnType: TypeNode | undefined;
    if (this.check(TokenKind.Colon)) {
      this.advance();
      returnType = this.parseType();
    }

    // External circuit: ends with semicolon
    if (this.check(TokenKind.Semicolon)) {
      const endPos = this.current().pos;
      this.advance();
      return {
        kind: 'ExternalCircuit',
        name,
        params,
        returnType,
        generics,
        isExport,
        isPure,
        range: { start: startPos, end: endPos },
      };
    }

    // Circuit with body
    const { bodyRange, statements } = this.parseBody();
    const endPos = this.previousPos();

    return {
      kind: 'CircuitDefinition',
      name,
      params,
      returnType,
      generics,
      isExport,
      isPure,
      bodyRange,
      body: statements,
      range: { start: startPos, end: endPos },
    };
  }

  private parseLedger(
    isExport: boolean,
    isSealed: boolean,
    startPos: { line: number; column: number; offset: number },
  ): LedgerDeclaration {
    this.expect(TokenKind.Ledger); // consume 'ledger'
    const name = this.expectIdentifier();
    this.expect(TokenKind.Colon);
    const typeAnnotation = this.parseType();
    const endPos = this.current().pos;
    this.expect(TokenKind.Semicolon);

    return {
      kind: 'LedgerDeclaration',
      name,
      typeAnnotation,
      isExport,
      isSealed,
      range: { start: startPos, end: endPos },
    };
  }

  private parseWitness(
    isExport: boolean,
    startPos: { line: number; column: number; offset: number },
  ): WitnessDeclaration {
    this.expect(TokenKind.Witness); // consume 'witness'
    const name = this.expectIdentifier();
    const generics = this.parseOptionalGenerics();
    const params = this.parseParameterList();

    let returnType: TypeNode | undefined;
    if (this.check(TokenKind.Colon)) {
      this.advance();
      returnType = this.parseType();
    }

    const endPos = this.current().pos;
    this.expect(TokenKind.Semicolon);

    return {
      kind: 'WitnessDeclaration',
      name,
      params,
      returnType,
      generics,
      isExport,
      range: { start: startPos, end: endPos },
    };
  }

  private parseStruct(
    isExport: boolean,
    startPos: { line: number; column: number; offset: number },
  ): StructDefinition {
    this.expect(TokenKind.Struct); // consume 'struct'
    const name = this.expectIdentifier();
    const generics = this.parseOptionalGenerics();
    this.expect(TokenKind.OpenBrace);

    const fields: StructField[] = [];
    while (!this.check(TokenKind.CloseBrace) && !this.isAtEnd()) {
      const fieldStart = this.current().pos;
      const fieldName = this.expectIdentifier();
      this.expect(TokenKind.Colon);
      const fieldType = this.parseType();
      const fieldEnd = this.current().pos;
      // semicolon or comma after field
      if (this.check(TokenKind.Semicolon) || this.check(TokenKind.Comma)) {
        this.advance();
      }
      fields.push({
        name: fieldName,
        typeAnnotation: fieldType,
        range: { start: fieldStart, end: fieldEnd },
      });
    }

    const endPos = this.current().pos;
    this.expect(TokenKind.CloseBrace);

    return {
      kind: 'StructDefinition',
      name,
      fields,
      generics,
      isExport,
      range: { start: startPos, end: endPos },
    };
  }

  private parseEnum(
    isExport: boolean,
    startPos: { line: number; column: number; offset: number },
  ): EnumDefinition {
    this.expect(TokenKind.Enum); // consume 'enum'
    const name = this.expectIdentifier();
    this.expect(TokenKind.OpenBrace);

    const variants: EnumVariant[] = [];
    while (!this.check(TokenKind.CloseBrace) && !this.isAtEnd()) {
      const varStart = this.current().pos;
      const varName = this.expectIdentifier();
      const varEnd = this.previousPos();
      variants.push({
        name: varName,
        range: { start: varStart, end: varEnd },
      });
      if (this.check(TokenKind.Comma)) {
        this.advance();
      }
    }

    const endPos = this.current().pos;
    this.expect(TokenKind.CloseBrace);

    return {
      kind: 'EnumDefinition',
      name,
      variants,
      isExport,
      range: { start: startPos, end: endPos },
    };
  }

  private parseModule(
    isExport: boolean,
    startPos: { line: number; column: number; offset: number },
  ): ModuleDefinition {
    this.expect(TokenKind.Module); // consume 'module'
    const name = this.expectIdentifier();
    const generics = this.parseOptionalGenerics();
    this.expect(TokenKind.OpenBrace);

    const declarations: Declaration[] = [];
    while (!this.check(TokenKind.CloseBrace) && !this.isAtEnd()) {
      const decl = this.parseDeclaration();
      if (decl) {
        declarations.push(decl);
      }
    }

    const endPos = this.current().pos;
    this.expect(TokenKind.CloseBrace);

    return {
      kind: 'ModuleDefinition',
      name,
      declarations,
      generics,
      isExport,
      range: { start: startPos, end: endPos },
    };
  }

  private parseConstructor(startPos: {
    line: number;
    column: number;
    offset: number;
  }): ConstructorDeclaration {
    this.expect(TokenKind.Constructor);
    const params = this.parseParameterList();
    const { bodyRange, statements } = this.parseBody();
    const endPos = this.previousPos();

    return {
      kind: 'ConstructorDeclaration',
      params,
      bodyRange,
      body: statements,
      range: { start: startPos, end: endPos },
    };
  }

  private parseConst(
    isExport: boolean,
    startPos: { line: number; column: number; offset: number },
  ): ConstDeclaration {
    this.expect(TokenKind.Const);
    const name = this.expectIdentifier();

    let typeAnnotation: TypeNode | undefined;
    if (this.check(TokenKind.Colon)) {
      this.advance();
      typeAnnotation = this.parseType();
    }

    // Skip initializer: consume until semicolon
    if (this.check(TokenKind.Equals)) {
      this.advance();
      this.skipUntilSemicolon();
    }

    const endPos = this.current().pos;
    this.expect(TokenKind.Semicolon);

    return {
      kind: 'ConstDeclaration',
      name,
      typeAnnotation,
      isExport,
      range: { start: startPos, end: endPos },
    };
  }

  private parseContract(
    isExport: boolean,
    startPos: { line: number; column: number; offset: number },
  ): ContractDeclaration {
    this.expect(TokenKind.Contract);
    const name = this.expectIdentifier();
    this.expect(TokenKind.OpenBrace);

    const circuits: ExternalCircuit[] = [];
    while (!this.check(TokenKind.CloseBrace) && !this.isAtEnd()) {
      // Contract body contains circuit signatures (external circuits)
      let circuitExport = false;
      let circuitPure = false;
      const circuitStart = this.current().pos;

      while (this.check(TokenKind.Export) || this.check(TokenKind.Pure)) {
        if (this.check(TokenKind.Export)) {
          circuitExport = true;
          this.advance();
        }
        if (this.check(TokenKind.Pure)) {
          circuitPure = true;
          this.advance();
        }
      }

      if (this.check(TokenKind.Circuit)) {
        const circuit = this.parseCircuit(circuitExport, circuitPure, circuitStart);
        if (circuit.kind === 'ExternalCircuit') {
          circuits.push(circuit);
        } else {
          // Treat it as an external circuit anyway (contract bodies shouldn't have full circuits)
          circuits.push({
            kind: 'ExternalCircuit',
            name: circuit.name,
            params: circuit.params,
            returnType: circuit.returnType,
            generics: circuit.generics,
            isExport: circuit.isExport,
            isPure: circuit.isPure,
            range: circuit.range,
          });
        }
      } else {
        // Skip unknown tokens in contract body
        this.advance();
      }
    }

    const endPos = this.current().pos;
    this.expect(TokenKind.CloseBrace);

    return {
      kind: 'ContractDeclaration',
      name,
      circuits,
      isExport,
      range: { start: startPos, end: endPos },
    };
  }

  private parsePragma(startPos: {
    line: number;
    column: number;
    offset: number;
  }): PragmaDeclaration {
    this.expect(TokenKind.Pragma);
    const name = this.expectIdentifier();
    let value = '';
    // Consume until semicolon
    while (!this.check(TokenKind.Semicolon) && !this.isAtEnd()) {
      value += this.current().text;
      this.advance();
    }
    const endPos = this.current().pos;
    this.expect(TokenKind.Semicolon);

    return {
      kind: 'PragmaDeclaration',
      name,
      value: value.trim(),
      range: { start: startPos, end: endPos },
    };
  }

  private parseImport(startPos: {
    line: number;
    column: number;
    offset: number;
  }): ImportDeclaration {
    this.expect(TokenKind.Import);

    // Selective import: import { name, name as alias } from Module;
    if (this.check(TokenKind.OpenBrace)) {
      return this.parseSelectiveImport(startPos);
    }

    // String-path import: import "path/to/Module" prefix P$;
    if (this.check(TokenKind.StringLiteral)) {
      const source = this.current().text.slice(1, -1); // strip quotes
      this.advance();
      let prefix: string | undefined;
      if (this.check(TokenKind.Identifier) && this.current().text === 'prefix') {
        this.advance(); // consume 'prefix'
        prefix = this.expectIdentifier();
      }
      const endPos = this.current().pos;
      this.expect(TokenKind.Semicolon);
      return {
        kind: 'ImportDeclaration',
        moduleName: source,
        source,
        prefix,
        range: { start: startPos, end: endPos },
      };
    }

    // Standard or prefix import: import Module; or import Module prefix P$;
    const moduleName = this.expectIdentifier();

    let prefix: string | undefined;
    if (this.check(TokenKind.Identifier) && this.current().text === 'prefix') {
      this.advance(); // consume 'prefix'
      prefix = this.expectIdentifier();
    }

    const endPos = this.current().pos;
    this.expect(TokenKind.Semicolon);

    return {
      kind: 'ImportDeclaration',
      moduleName,
      prefix,
      range: { start: startPos, end: endPos },
    };
  }

  private parseSelectiveImport(startPos: {
    line: number;
    column: number;
    offset: number;
  }): ImportDeclaration {
    this.expect(TokenKind.OpenBrace);
    const specifiers: ImportSpecifier[] = [];

    while (!this.check(TokenKind.CloseBrace) && !this.isAtEnd()) {
      const specStart = this.current().pos;
      const name = this.expectIdentifier();
      let alias: string | undefined;
      if (this.check(TokenKind.As)) {
        this.advance(); // consume 'as'
        alias = this.expectIdentifier();
      }
      const specEnd = this.previousPos();
      specifiers.push({ name, alias, range: { start: specStart, end: specEnd } });
      if (this.check(TokenKind.Comma)) {
        this.advance();
      }
    }
    this.expect(TokenKind.CloseBrace);

    // Expect 'from' (contextual keyword — treated as identifier)
    if (this.check(TokenKind.Identifier) && this.current().text === 'from') {
      this.advance();
    } else {
      this.expect(TokenKind.Identifier); // will emit error "Expected identifier"
    }

    const moduleName = this.expectIdentifier();
    const endPos = this.current().pos;
    this.expect(TokenKind.Semicolon);

    return {
      kind: 'ImportDeclaration',
      moduleName,
      specifiers,
      range: { start: startPos, end: endPos },
    };
  }

  private parseExportList(startPos: {
    line: number;
    column: number;
    offset: number;
  }): ExportList {
    this.expect(TokenKind.OpenBrace);
    const names: { name: string; range: SourceRange }[] = [];

    while (!this.check(TokenKind.CloseBrace) && !this.isAtEnd()) {
      const nameStart = this.current().pos;
      const name = this.expectIdentifier();
      const nameEnd = this.previousPos();
      names.push({ name, range: { start: nameStart, end: nameEnd } });
      if (this.check(TokenKind.Comma)) {
        this.advance();
      }
    }
    this.expect(TokenKind.CloseBrace);
    const endPos = this.current().pos;
    this.expect(TokenKind.Semicolon);

    return {
      kind: 'ExportList',
      names,
      range: { start: startPos, end: endPos },
    };
  }

  private parseInclude(startPos: {
    line: number;
    column: number;
    offset: number;
  }): IncludeDeclaration {
    this.expect(TokenKind.Include);
    let path = '';
    if (this.check(TokenKind.StringLiteral)) {
      path = this.current().text;
      // Remove quotes
      path = path.slice(1, -1);
      this.advance();
    }
    const endPos = this.current().pos;
    this.expect(TokenKind.Semicolon);

    return {
      kind: 'IncludeDeclaration',
      path,
      range: { start: startPos, end: endPos },
    };
  }

  private parseTypeAlias(
    isExport: boolean,
    startPos: { line: number; column: number; offset: number },
  ): ConstDeclaration {
    // type alias: `type Foo = Bar;` or `type Foo<#A, #B> = [A, B];`
    this.expect(TokenKind.Type);
    const name = this.expectIdentifier();

    // Skip optional generics for type aliases: <#A, #B>
    if (this.check(TokenKind.LessThan)) {
      this.parseOptionalGenericsWithHash();
    }

    let typeAnnotation: TypeNode | undefined;
    if (this.check(TokenKind.Equals)) {
      this.advance();
      typeAnnotation = this.parseType();
    }

    const endPos = this.current().pos;
    this.expect(TokenKind.Semicolon);

    return {
      kind: 'ConstDeclaration',
      name,
      typeAnnotation,
      isExport,
      range: { start: startPos, end: endPos },
    };
  }

  private parseNewType(
    isExport: boolean,
    startPos: { line: number; column: number; offset: number },
  ): NewTypeDeclaration {
    this.expect(TokenKind.New);
    this.expect(TokenKind.Type);
    const name = this.expectIdentifier();
    const generics = this.parseOptionalGenericsWithHash();

    this.expect(TokenKind.Equals);
    const typeExpr = this.parseType();

    const endPos = this.current().pos;
    this.expect(TokenKind.Semicolon);

    return {
      kind: 'NewTypeDeclaration',
      name,
      generics,
      typeExpr,
      isExport,
      range: { start: startPos, end: endPos },
    };
  }

  // Parse generics with # prefix: <#A, #B>
  private parseOptionalGenericsWithHash(): string[] {
    if (!this.check(TokenKind.LessThan)) return [];
    this.advance(); // consume '<'

    const generics: string[] = [];
    while (!this.check(TokenKind.GreaterThan) && !this.isAtEnd()) {
      if (this.check(TokenKind.Hash)) {
        this.advance(); // consume '#'
      }
      generics.push(this.expectIdentifierOrType());
      if (this.check(TokenKind.Comma)) {
        this.advance();
      }
    }

    this.expect(TokenKind.GreaterThan);
    return generics;
  }

  // Type parsing
  private parseType(): TypeNode {
    // Tuple type: [T1, T2]
    if (this.check(TokenKind.OpenBracket)) {
      return this.parseTupleType();
    }

    const startPos = this.current().pos;
    const name = this.expectTypeName();

    // Check for generic args: <...>
    if (this.check(TokenKind.LessThan)) {
      return this.parseParameterizedType(name, startPos);
    }

    return {
      kind: 'TypeReference',
      name,
      range: { start: startPos, end: this.previousPos() },
    } as TypeReference;
  }

  private parseParameterizedType(
    name: string,
    startPos: { line: number; column: number; offset: number },
  ): ParameterizedType {
    this.expect(TokenKind.LessThan);
    const args: TypeArgument[] = [];

    while (!this.check(TokenKind.GreaterThan) && !this.isAtEnd()) {
      if (this.check(TokenKind.NumberLiteral)) {
        const numStart = this.current().pos;
        const value = this.current().text;
        this.advance();
        // Check for range: m..n
        if (this.check(TokenKind.DotDot)) {
          this.advance(); // consume '..'
          const highValue = this.current().text;
          this.advance();
          args.push({
            kind: 'RangeArgument',
            low: value,
            high: highValue,
            range: { start: numStart, end: this.previousPos() },
          } as RangeArgument);
        } else {
          args.push({
            kind: 'NumberArgument',
            value,
            range: { start: numStart, end: this.previousPos() },
          } as NumberArgument);
        }
      } else {
        args.push(this.parseType());
      }

      if (this.check(TokenKind.Comma)) {
        this.advance();
      }
    }

    const endPos = this.current().pos;
    this.expect(TokenKind.GreaterThan);

    return {
      kind: 'ParameterizedType',
      name,
      args,
      range: { start: startPos, end: endPos },
    };
  }

  private parseTupleType(): TupleType {
    const startPos = this.current().pos;
    this.expect(TokenKind.OpenBracket);
    const elements: TypeNode[] = [];

    while (!this.check(TokenKind.CloseBracket) && !this.isAtEnd()) {
      elements.push(this.parseType());
      if (this.check(TokenKind.Comma)) {
        this.advance();
      }
    }

    const endPos = this.current().pos;
    this.expect(TokenKind.CloseBracket);

    return {
      kind: 'TupleType',
      elements,
      range: { start: startPos, end: endPos },
    };
  }

  // Parameter parsing
  private parseParameterList(): Parameter[] {
    if (!this.check(TokenKind.OpenParen)) return [];
    this.expect(TokenKind.OpenParen);

    const params: Parameter[] = [];
    while (!this.check(TokenKind.CloseParen) && !this.isAtEnd()) {
      const paramStart = this.current().pos;

      // Destructured parameter: [x, y] or {a, b}
      if (this.check(TokenKind.OpenBracket)) {
        const pattern = this.parseParamTuplePattern();
        let typeAnnotation: TypeNode | undefined;
        if (this.check(TokenKind.Colon)) {
          this.advance();
          typeAnnotation = this.parseType();
        }
        const paramEnd = this.previousPos();
        params.push({
          kind: 'Parameter',
          name: '<destructure>',
          pattern,
          typeAnnotation,
          range: { start: paramStart, end: paramEnd },
        });
      } else if (this.check(TokenKind.OpenBrace)) {
        const pattern = this.parseParamStructPattern();
        let typeAnnotation: TypeNode | undefined;
        if (this.check(TokenKind.Colon)) {
          this.advance();
          typeAnnotation = this.parseType();
        }
        const paramEnd = this.previousPos();
        params.push({
          kind: 'Parameter',
          name: '<destructure>',
          pattern,
          typeAnnotation,
          range: { start: paramStart, end: paramEnd },
        });
      } else {
        const paramName = this.expectIdentifier();
        let typeAnnotation: TypeNode | undefined;
        if (this.check(TokenKind.Colon)) {
          this.advance();
          typeAnnotation = this.parseType();
        }
        const paramEnd = this.previousPos();
        params.push({
          kind: 'Parameter',
          name: paramName,
          typeAnnotation,
          range: { start: paramStart, end: paramEnd },
        });
      }

      if (this.check(TokenKind.Comma)) {
        this.advance();
      }
    }

    this.expect(TokenKind.CloseParen);
    return params;
  }

  private parseParamTuplePattern(): TuplePattern {
    const start = this.current().pos;
    this.expect(TokenKind.OpenBracket);
    const elements: (string | null)[] = [];
    while (!this.check(TokenKind.CloseBracket) && !this.isAtEnd()) {
      if (this.check(TokenKind.Comma)) {
        elements.push(null);
      } else {
        elements.push(this.expectIdentifier());
      }
      if (this.check(TokenKind.Comma)) {
        this.advance();
      }
    }
    const end = this.current().pos;
    this.expect(TokenKind.CloseBracket);
    return { kind: 'TuplePattern', elements, range: { start, end } };
  }

  private parseParamStructPattern(): StructPattern {
    const start = this.current().pos;
    this.expect(TokenKind.OpenBrace);
    const fields: { key: string; alias?: string }[] = [];
    while (!this.check(TokenKind.CloseBrace) && !this.isAtEnd()) {
      const key = this.expectIdentifier();
      let alias: string | undefined;
      if (this.check(TokenKind.Colon)) {
        this.advance();
        alias = this.expectIdentifier();
      }
      fields.push({ key, alias });
      if (this.check(TokenKind.Comma)) {
        this.advance();
      }
    }
    const end = this.current().pos;
    this.expect(TokenKind.CloseBrace);
    return { kind: 'StructPattern', fields, range: { start, end } };
  }

  // Generics parsing
  private parseOptionalGenerics(): string[] {
    if (!this.check(TokenKind.LessThan)) return [];
    this.advance(); // consume '<'

    const generics: string[] = [];
    while (!this.check(TokenKind.GreaterThan) && !this.isAtEnd()) {
      generics.push(this.expectIdentifierOrType());
      if (this.check(TokenKind.Comma)) {
        this.advance();
      }
    }

    this.expect(TokenKind.GreaterThan);
    return generics;
  }

  private collectStatement(statements: Statement[]): void {
    const result = this.parseStatement();
    if (result) {
      if (Array.isArray(result)) {
        statements.push(...result);
      } else {
        statements.push(result);
      }
    }
  }

  // Body parsing — replaces skipBody for circuit and constructor bodies
  private parseBody(): { bodyRange: SourceRange | undefined; statements: Statement[] } {
    if (!this.check(TokenKind.OpenBrace)) {
      return { bodyRange: undefined, statements: [] };
    }

    const startPos = this.current().pos;
    this.advance(); // consume '{'

    const statements: Statement[] = [];
    try {
      while (!this.check(TokenKind.CloseBrace) && !this.isAtEnd()) {
        this.collectStatement(statements);
      }
    } catch {
      // Fallback to brace matching on unrecoverable error
      this.fallbackBraceMatch();
      const endPos = this.current().pos;
      if (this.check(TokenKind.CloseBrace)) {
        this.advance();
      }
      return {
        bodyRange: { start: startPos, end: endPos },
        statements,
      };
    }

    const endPos = this.current().pos;
    if (this.check(TokenKind.CloseBrace)) {
      this.advance();
    }

    return {
      bodyRange: { start: startPos, end: endPos },
      statements,
    };
  }

  // Fallback brace matching — used when statement parser hits unrecoverable errors
  private fallbackBraceMatch(): void {
    let depth = 1;
    while (depth > 0 && !this.isAtEnd()) {
      if (this.check(TokenKind.OpenBrace)) depth++;
      if (this.check(TokenKind.CloseBrace)) depth--;
      if (depth > 0) this.advance();
    }
  }

  // Body skipping — kept for contract bodies etc. that don't need parsing
  private skipBody(): SourceRange | undefined {
    if (!this.check(TokenKind.OpenBrace)) return undefined;
    const startPos = this.current().pos;
    this.advance(); // consume '{'

    let depth = 1;
    while (depth > 0 && !this.isAtEnd()) {
      if (this.check(TokenKind.OpenBrace)) depth++;
      if (this.check(TokenKind.CloseBrace)) depth--;
      if (depth > 0) this.advance();
    }

    const endPos = this.current().pos;
    if (this.check(TokenKind.CloseBrace)) {
      this.advance();
    }

    return { start: startPos, end: endPos };
  }

  // Statement parsing
  private parseStatement(): Statement | Statement[] | null {
    const startPos = this.current().pos;

    try {
      switch (this.current().kind) {
        case TokenKind.Const:
          return this.parseConstStatement();
        case TokenKind.Return:
          return this.parseReturnStatement();
        case TokenKind.If:
          return this.parseIfStatement();
        case TokenKind.For:
          return this.parseForStatement();
        case TokenKind.Assert:
          return this.parseAssertStatement();
        case TokenKind.OpenBrace:
          return this.parseBlockStatement();
        default:
          return this.parseExpressionStatement();
      }
    } catch {
      // Statement-level error recovery: synchronize at ; or }
      return this.recoverToStatementBoundary(startPos);
    }
  }

  private parseConstStatement(): Statement | Statement[] {
    const startPos = this.current().pos;
    this.expect(TokenKind.Const);

    const bindings: Statement[] = [];
    // Parse first binding
    bindings.push(this.parseConstBinding(startPos));

    // Parse additional bindings separated by commas: const a = 1, b = 2;
    while (this.check(TokenKind.Comma)) {
      this.advance(); // consume ','
      const bindStart = this.current().pos;
      bindings.push(this.parseConstBinding(bindStart));
    }

    const endPos = this.current().pos;
    this.expect(TokenKind.Semicolon);

    // Update ranges to include the semicolon
    for (const binding of bindings) {
      binding.range.end = endPos;
    }

    if (bindings.length === 1) {
      return bindings[0];
    }
    return bindings;
  }

  private parseConstBinding(startPos: {
    line: number;
    column: number;
    offset: number;
  }): Statement {
    // Check for destructuring: [a, b] or {a, b}
    if (this.check(TokenKind.OpenBracket)) {
      return this.parseTupleDestructuring(startPos);
    }
    if (this.check(TokenKind.OpenBrace)) {
      return this.parseStructDestructuring(startPos);
    }

    const name = this.expectIdentifier();

    let typeAnnotation: TypeNode | undefined;
    if (this.check(TokenKind.Colon)) {
      this.advance();
      typeAnnotation = this.parseType();
    }

    this.expect(TokenKind.Equals);
    const initializer = this.parseExpression(Precedence.None);

    return {
      kind: 'ConstStatement',
      name,
      typeAnnotation,
      initializer,
      range: { start: startPos, end: initializer.range.end },
    };
  }

  private parseTupleDestructuring(startPos: {
    line: number;
    column: number;
    offset: number;
  }): Statement {
    const patternStart = this.current().pos;
    this.expect(TokenKind.OpenBracket);
    const elements: (string | null)[] = [];

    while (!this.check(TokenKind.CloseBracket) && !this.isAtEnd()) {
      if (this.check(TokenKind.Comma)) {
        // Skipped element
        elements.push(null);
      } else {
        elements.push(this.expectIdentifier());
      }
      if (this.check(TokenKind.Comma)) {
        this.advance();
      }
    }
    const patternEnd = this.current().pos;
    this.expect(TokenKind.CloseBracket);

    const pattern: TuplePattern = {
      kind: 'TuplePattern',
      elements,
      range: { start: patternStart, end: patternEnd },
    };

    let typeAnnotation: TypeNode | undefined;
    if (this.check(TokenKind.Colon)) {
      this.advance();
      typeAnnotation = this.parseType();
    }

    this.expect(TokenKind.Equals);
    const initializer = this.parseExpression(Precedence.None);

    return {
      kind: 'ConstStatement',
      name: '<destructure>',
      pattern,
      typeAnnotation,
      initializer,
      range: { start: startPos, end: initializer.range.end },
    };
  }

  private parseStructDestructuring(startPos: {
    line: number;
    column: number;
    offset: number;
  }): Statement {
    const patternStart = this.current().pos;
    this.expect(TokenKind.OpenBrace);
    const fields: { key: string; alias?: string }[] = [];

    while (!this.check(TokenKind.CloseBrace) && !this.isAtEnd()) {
      const key = this.expectIdentifier();
      let alias: string | undefined;
      if (this.check(TokenKind.Colon)) {
        this.advance();
        alias = this.expectIdentifier();
      }
      fields.push({ key, alias });
      if (this.check(TokenKind.Comma)) {
        this.advance();
      }
    }
    const patternEnd = this.current().pos;
    this.expect(TokenKind.CloseBrace);

    const pattern: StructPattern = {
      kind: 'StructPattern',
      fields,
      range: { start: patternStart, end: patternEnd },
    };

    let typeAnnotation: TypeNode | undefined;
    if (this.check(TokenKind.Colon)) {
      this.advance();
      typeAnnotation = this.parseType();
    }

    this.expect(TokenKind.Equals);
    const initializer = this.parseExpression(Precedence.None);

    return {
      kind: 'ConstStatement',
      name: '<destructure>',
      pattern,
      typeAnnotation,
      initializer,
      range: { start: startPos, end: initializer.range.end },
    };
  }

  private parseReturnStatement(): Statement {
    const startPos = this.current().pos;
    this.expect(TokenKind.Return);

    let value: Expression | undefined;
    if (!this.check(TokenKind.Semicolon) && !this.check(TokenKind.CloseBrace) && !this.isAtEnd()) {
      value = this.parseExpression(Precedence.None);
    }

    const endPos = this.current().pos;
    this.expect(TokenKind.Semicolon);

    return {
      kind: 'ReturnStatement',
      value,
      range: { start: startPos, end: endPos },
    };
  }

  private parseIfStatement(): Statement {
    const startPos = this.current().pos;
    this.expect(TokenKind.If);
    this.expect(TokenKind.OpenParen);
    const condition = this.parseExpression(Precedence.None);
    this.expect(TokenKind.CloseParen);

    this.expect(TokenKind.OpenBrace);
    const consequent: Statement[] = [];
    while (!this.check(TokenKind.CloseBrace) && !this.isAtEnd()) {
      this.collectStatement(consequent);
    }
    this.expect(TokenKind.CloseBrace);

    let alternate: Statement[] | undefined;
    if (this.check(TokenKind.Else)) {
      this.advance();
      if (this.check(TokenKind.If)) {
        // else if — wrap as single-element array
        const elseIf = this.parseIfStatement();
        if (elseIf) alternate = [elseIf];
      } else {
        this.expect(TokenKind.OpenBrace);
        alternate = [];
        while (!this.check(TokenKind.CloseBrace) && !this.isAtEnd()) {
          this.collectStatement(alternate);
        }
        this.expect(TokenKind.CloseBrace);
      }
    }

    const endPos = this.previousPos();
    return {
      kind: 'IfStatement',
      condition,
      consequent,
      alternate,
      range: { start: startPos, end: endPos },
    };
  }

  private parseForStatement(): Statement {
    const startPos = this.current().pos;
    this.expect(TokenKind.For);
    this.expect(TokenKind.OpenParen);

    // for (const i of items)
    this.expect(TokenKind.Const);
    const variable = this.expectIdentifier();
    this.expect(TokenKind.Of);
    const iterable = this.parseExpression(Precedence.None);
    this.expect(TokenKind.CloseParen);

    this.expect(TokenKind.OpenBrace);
    const body: Statement[] = [];
    while (!this.check(TokenKind.CloseBrace) && !this.isAtEnd()) {
      this.collectStatement(body);
    }
    this.expect(TokenKind.CloseBrace);

    const endPos = this.previousPos();
    return {
      kind: 'ForStatement',
      variable,
      iterable,
      body,
      range: { start: startPos, end: endPos },
    };
  }

  private parseAssertStatement(): Statement {
    const startPos = this.current().pos;
    this.expect(TokenKind.Assert);
    this.expect(TokenKind.OpenParen);
    const condition = this.parseExpression(Precedence.None);

    let message: Expression | undefined;
    if (this.check(TokenKind.Comma)) {
      this.advance(); // consume ','
      message = this.parseExpression(Precedence.None);
    }

    this.expect(TokenKind.CloseParen);
    const endPos = this.current().pos;
    this.expect(TokenKind.Semicolon);

    return {
      kind: 'AssertStatement',
      condition,
      message,
      range: { start: startPos, end: endPos },
    };
  }

  private parseBlockStatement(): Statement {
    const startPos = this.current().pos;
    this.expect(TokenKind.OpenBrace);
    const statements: Statement[] = [];
    while (!this.check(TokenKind.CloseBrace) && !this.isAtEnd()) {
      this.collectStatement(statements);
    }
    const endPos = this.current().pos;
    this.expect(TokenKind.CloseBrace);

    return {
      kind: 'BlockStatement',
      statements,
      range: { start: startPos, end: endPos },
    };
  }

  private parseExpressionStatement(): Statement {
    const startPos = this.current().pos;
    const expression = this.parseExpression(Precedence.None);
    const endPos = this.current().pos;
    this.expect(TokenKind.Semicolon);

    return {
      kind: 'ExpressionStatement',
      expression,
      range: { start: startPos, end: endPos },
    };
  }

  // Statement-level error recovery
  private recoverToStatementBoundary(startPos: {
    line: number;
    column: number;
    offset: number;
  }): Statement {
    const message = `Unexpected token '${this.current().text}'`;
    this.errors.push({
      message,
      range: { start: startPos, end: this.current().pos },
    });

    // Synchronize at ; or }
    while (!this.isAtEnd()) {
      if (this.check(TokenKind.Semicolon)) {
        this.advance();
        break;
      }
      if (this.check(TokenKind.CloseBrace)) {
        break; // don't consume — let the parent handle it
      }
      this.advance();
    }

    return {
      kind: 'ErrorStatement',
      message,
      range: { start: startPos, end: this.previousPos() },
    };
  }

  // Pratt expression parser
  private parseExpression(minPrec: Precedence): Expression {
    let left = this.parsePrefixExpression();

    while (!this.isAtEnd()) {
      const prec = getInfixPrecedence(this.current().kind);
      if (prec <= minPrec) break;

      left = this.parseInfixExpression(left, prec);
    }

    return left;
  }

  private parsePrefixExpression(): Expression {
    const startPos = this.current().pos;

    switch (this.current().kind) {
      case TokenKind.Identifier: {
        const token = this.advance();
        // Bytes[...] literal
        if (token.text === 'Bytes' && this.check(TokenKind.OpenBracket)) {
          return this.parseBytesLiteral(startPos);
        }
        const identExpr: Expression = {
          kind: 'IdentifierExpression',
          name: token.text,
          range: {
            start: startPos,
            end: {
              line: startPos.line,
              column: startPos.column + token.text.length,
              offset: startPos.offset + token.text.length,
            },
          },
        };
        // Check for struct construction: Name { field: value, ... }
        if (this.check(TokenKind.OpenBrace) && this.looksLikeStructConstruction()) {
          return this.parseStructConstruction(token.text, startPos);
        }
        return identExpr;
      }

      case TokenKind.TypeKeyword: {
        const token = this.advance();
        // Bytes[...] literal
        if (token.text === 'Bytes' && this.check(TokenKind.OpenBracket)) {
          return this.parseBytesLiteral(startPos);
        }
        return {
          kind: 'IdentifierExpression',
          name: token.text,
          range: {
            start: startPos,
            end: {
              line: startPos.line,
              column: startPos.column + token.text.length,
              offset: startPos.offset + token.text.length,
            },
          },
        };
      }

      case TokenKind.NumberLiteral: {
        const token = this.advance();
        return {
          kind: 'LiteralExpression',
          value: token.text,
          literalType: 'number',
          range: {
            start: startPos,
            end: {
              line: startPos.line,
              column: startPos.column + token.text.length,
              offset: startPos.offset + token.text.length,
            },
          },
        };
      }

      case TokenKind.StringLiteral: {
        const token = this.advance();
        return {
          kind: 'LiteralExpression',
          value: token.text,
          literalType: 'string',
          range: {
            start: startPos,
            end: {
              line: startPos.line,
              column: startPos.column + token.text.length,
              offset: startPos.offset + token.text.length,
            },
          },
        };
      }

      case TokenKind.BooleanLiteral: {
        const token = this.advance();
        return {
          kind: 'LiteralExpression',
          value: token.text,
          literalType: 'boolean',
          range: {
            start: startPos,
            end: {
              line: startPos.line,
              column: startPos.column + token.text.length,
              offset: startPos.offset + token.text.length,
            },
          },
        };
      }

      case TokenKind.Bang: {
        this.advance();
        const operand = this.parseExpression(Precedence.Unary);
        return {
          kind: 'UnaryExpression',
          operator: '!',
          operand,
          range: { start: startPos, end: operand.range.end },
        };
      }

      case TokenKind.OpenParen: {
        // Could be parenthesized expression or arrow function
        return this.parseParenExprOrArrow();
      }

      case TokenKind.Ellipsis: {
        // Spread expression: ...expr
        this.advance();
        const argument = this.parseExpression(Precedence.Unary);
        return {
          kind: 'SpreadExpression',
          argument,
          range: { start: startPos, end: argument.range.end },
        };
      }

      case TokenKind.OpenBracket: {
        // Tuple literal: [a, b, c]
        return this.parseTupleLiteral();
      }

      default: {
        // Unrecognized token in expression position — emit error and create synthetic node
        const token = this.current();
        this.errors.push({
          message: `Unexpected token '${token.text}' in expression`,
          range: { start: startPos, end: startPos },
        });
        this.advance();
        return {
          kind: 'IdentifierExpression',
          name: '<error>',
          range: { start: startPos, end: this.previousPos() },
        };
      }
    }
  }

  private parseInfixExpression(left: Expression, prec: Precedence): Expression {
    const kind = this.current().kind;

    // Assignment operators (right-associative)
    if (
      kind === TokenKind.Equals ||
      kind === TokenKind.PlusEquals ||
      kind === TokenKind.MinusEquals
    ) {
      const opToken = this.advance();
      const right = this.parseExpression(Precedence.Assignment - 1);
      return {
        kind: 'AssignmentExpression',
        operator: opToken.text,
        target: left,
        value: right,
        range: { start: left.range.start, end: right.range.end },
      };
    }

    // Ternary conditional
    if (kind === TokenKind.Question) {
      this.advance();
      const consequent = this.parseExpression(Precedence.None);
      this.expect(TokenKind.Colon);
      const alternate = this.parseExpression(Precedence.Ternary - 1);
      return {
        kind: 'ConditionalExpression',
        condition: left,
        consequent,
        alternate,
        range: { start: left.range.start, end: alternate.range.end },
      };
    }

    // Cast expression
    if (kind === TokenKind.As) {
      this.advance();
      const targetType = this.parseType();
      return {
        kind: 'CastExpression',
        expression: left,
        targetType,
        range: { start: left.range.start, end: targetType.range.end },
      };
    }

    // Member access
    if (kind === TokenKind.Dot) {
      this.advance();
      const propToken = this.current();
      const propName = this.expectIdentifier();
      return {
        kind: 'MemberExpression',
        object: left,
        property: propName,
        range: {
          start: left.range.start,
          end: {
            line: propToken.pos.line,
            column: propToken.pos.column + propToken.text.length,
            offset: propToken.pos.offset + propToken.text.length,
          },
        },
      };
    }

    // Index access
    if (kind === TokenKind.OpenBracket) {
      this.advance();
      const index = this.parseExpression(Precedence.None);
      const endPos = this.current().pos;
      this.expect(TokenKind.CloseBracket);
      return {
        kind: 'IndexExpression',
        object: left,
        index,
        range: {
          start: left.range.start,
          end: { line: endPos.line, column: endPos.column + 1, offset: endPos.offset + 1 },
        },
      };
    }

    // Function call
    if (kind === TokenKind.OpenParen) {
      this.advance();
      const args: Expression[] = [];
      while (!this.check(TokenKind.CloseParen) && !this.isAtEnd()) {
        args.push(this.parseExpression(Precedence.None));
        if (this.check(TokenKind.Comma)) {
          this.advance();
        }
      }
      const endPos = this.current().pos;
      this.expect(TokenKind.CloseParen);
      return {
        kind: 'CallExpression',
        callee: left,
        args,
        range: {
          start: left.range.start,
          end: { line: endPos.line, column: endPos.column + 1, offset: endPos.offset + 1 },
        },
      };
    }

    // Binary operators
    const opToken = this.advance();
    const right = this.parseExpression(prec);
    return {
      kind: 'BinaryExpression',
      operator: opToken.text,
      left,
      right,
      range: { start: left.range.start, end: right.range.end },
    };
  }

  // Heuristic: does { after an identifier look like struct construction?
  // If the next tokens look like `name : expr` it's struct construction.
  // Otherwise it's likely a block.
  private looksLikeStructConstruction(): boolean {
    // Save position and look ahead
    const saved = this.pos;
    this.advance(); // skip {

    // Empty braces => struct construction: Point {}
    if (this.check(TokenKind.CloseBrace)) {
      this.pos = saved;
      return true;
    }

    // Spread in struct construction: S { ...expr }
    if (this.check(TokenKind.Ellipsis)) {
      this.pos = saved;
      return true;
    }

    // Check for identifier followed by : (explicit) or , or } (shorthand)
    const isIdent = this.check(TokenKind.Identifier) || this.check(TokenKind.TypeKeyword);
    if (isIdent) {
      this.advance();
      const isStructLike =
        this.check(TokenKind.Colon) ||
        this.check(TokenKind.Comma) ||
        this.check(TokenKind.CloseBrace);
      this.pos = saved;
      return isStructLike;
    }

    this.pos = saved;
    return false;
  }

  private parseStructConstruction(
    name: string,
    startPos: { line: number; column: number; offset: number },
  ): Expression {
    this.expect(TokenKind.OpenBrace);
    const fields: { name: string; value: Expression; isShorthand?: boolean; range: SourceRange }[] =
      [];
    let spread: Expression | undefined;

    while (!this.check(TokenKind.CloseBrace) && !this.isAtEnd()) {
      // Spread in struct: ...expr
      if (this.check(TokenKind.Ellipsis)) {
        const spreadStart = this.current().pos;
        this.advance(); // consume '...'
        const arg = this.parseExpression(Precedence.None);
        spread = {
          kind: 'SpreadExpression',
          argument: arg,
          range: { start: spreadStart, end: arg.range.end },
        };
        if (this.check(TokenKind.Comma)) {
          this.advance();
        }
        continue;
      }

      const fieldStart = this.current().pos;
      const fieldName = this.expectIdentifier();

      if (this.check(TokenKind.Colon)) {
        // Explicit: field: value
        this.advance();
        const value = this.parseExpression(Precedence.None);
        const fieldEnd = value.range.end;
        fields.push({
          name: fieldName,
          value,
          range: { start: fieldStart, end: fieldEnd },
        });
      } else {
        // Shorthand: field (equivalent to field: field)
        const fieldEnd = this.previousPos();
        fields.push({
          name: fieldName,
          value: {
            kind: 'IdentifierExpression',
            name: fieldName,
            range: { start: fieldStart, end: fieldEnd },
          },
          isShorthand: true,
          range: { start: fieldStart, end: fieldEnd },
        });
      }

      if (this.check(TokenKind.Comma)) {
        this.advance();
      }
    }

    const endPos = this.current().pos;
    this.expect(TokenKind.CloseBrace);

    return {
      kind: 'StructConstruction',
      structName: name,
      fields,
      spread,
      range: {
        start: startPos,
        end: { line: endPos.line, column: endPos.column + 1, offset: endPos.offset + 1 },
      },
    };
  }

  private parseParenExprOrArrow(): Expression {
    const startPos = this.current().pos;

    // Try to detect arrow function: (params) => body
    if (this.looksLikeArrowFunction()) {
      return this.parseArrowFunction(startPos);
    }

    // Parenthesized expression
    this.advance(); // consume (
    const expr = this.parseExpression(Precedence.None);
    this.expect(TokenKind.CloseParen);
    return expr;
  }

  private looksLikeArrowFunction(): boolean {
    // Save position and look ahead
    const saved = this.pos;
    this.advance(); // skip (

    // () => ... is arrow
    if (this.check(TokenKind.CloseParen)) {
      this.advance();
      const isArrow = this.check(TokenKind.Arrow);
      this.pos = saved;
      return isArrow;
    }

    // Destructured parameter: ([x, y]: ...) => ... or ({a, b}: ...) => ...
    if (this.check(TokenKind.OpenBracket) || this.check(TokenKind.OpenBrace)) {
      // Skip to matching close bracket/brace, then check for ) =>
      let depth = 1;
      const open = this.current().kind;
      const close =
        open === TokenKind.OpenBracket ? TokenKind.CloseBracket : TokenKind.CloseBrace;
      this.advance();
      while (depth > 0 && !this.isAtEnd()) {
        if (this.current().kind === open) depth++;
        if (this.current().kind === close) depth--;
        if (depth > 0) this.advance();
      }
      if (depth === 0) {
        this.advance(); // skip close bracket/brace
        // Now skip optional : Type
        if (this.check(TokenKind.Colon)) {
          // Skip to ) or ,
          while (
            !this.check(TokenKind.CloseParen) &&
            !this.check(TokenKind.Comma) &&
            !this.isAtEnd()
          ) {
            this.advance();
          }
        }
        // Skip to closing paren
        let parenDepth = 1;
        this.pos = saved + 1;
        while (parenDepth > 0 && !this.isAtEnd()) {
          if (this.check(TokenKind.OpenParen)) parenDepth++;
          if (this.check(TokenKind.CloseParen)) parenDepth--;
          if (parenDepth > 0) this.advance();
        }
        if (this.check(TokenKind.CloseParen)) {
          this.advance();
          const isArrow = this.check(TokenKind.Arrow);
          this.pos = saved;
          return isArrow;
        }
      }
      this.pos = saved;
      return false;
    }

    // (ident: Type, ...) => ... is arrow
    // (ident) => ... is arrow
    if (this.check(TokenKind.Identifier) || this.check(TokenKind.TypeKeyword)) {
      this.advance();
      if (
        this.check(TokenKind.Colon) ||
        this.check(TokenKind.Comma) ||
        this.check(TokenKind.CloseParen)
      ) {
        // Skip to closing paren
        let depth = 1;
        // Rewind to just after (
        this.pos = saved + 1;
        while (depth > 0 && !this.isAtEnd()) {
          if (this.check(TokenKind.OpenParen)) depth++;
          if (this.check(TokenKind.CloseParen)) depth--;
          if (depth > 0) this.advance();
        }
        if (this.check(TokenKind.CloseParen)) {
          this.advance();
          const isArrow = this.check(TokenKind.Arrow);
          this.pos = saved;
          return isArrow;
        }
      }
    }

    this.pos = saved;
    return false;
  }

  private parseArrowFunction(startPos: {
    line: number;
    column: number;
    offset: number;
  }): Expression {
    const params = this.parseParameterList();
    this.expect(TokenKind.Arrow);

    // Block body: (x) => { stmts; }
    if (this.check(TokenKind.OpenBrace)) {
      const bodyStart = this.current().pos;
      this.advance(); // consume '{'
      const statements: Statement[] = [];
      while (!this.check(TokenKind.CloseBrace) && !this.isAtEnd()) {
        this.collectStatement(statements);
      }
      const endPos = this.current().pos;
      if (this.check(TokenKind.CloseBrace)) {
        this.advance();
      }
      return {
        kind: 'ArrowFunction',
        params,
        body: statements,
        range: { start: startPos, end: endPos },
      };
    }

    // Expression body: (x) => expr
    const body = this.parseExpression(Precedence.None);
    return {
      kind: 'ArrowFunction',
      params,
      body,
      range: { start: startPos, end: body.range.end },
    };
  }

  private parseTupleLiteral(): Expression {
    const startPos = this.current().pos;
    this.expect(TokenKind.OpenBracket);
    const elements: Expression[] = [];

    while (!this.check(TokenKind.CloseBracket) && !this.isAtEnd()) {
      elements.push(this.parseExpression(Precedence.None));
      if (this.check(TokenKind.Comma)) {
        this.advance();
      }
    }

    const endPos = this.current().pos;
    this.expect(TokenKind.CloseBracket);

    return {
      kind: 'TupleLiteral',
      elements,
      range: {
        start: startPos,
        end: { line: endPos.line, column: endPos.column + 1, offset: endPos.offset + 1 },
      },
    };
  }

  private parseBytesLiteral(startPos: {
    line: number;
    column: number;
    offset: number;
  }): Expression {
    this.expect(TokenKind.OpenBracket);
    const elements: Expression[] = [];

    while (!this.check(TokenKind.CloseBracket) && !this.isAtEnd()) {
      elements.push(this.parseExpression(Precedence.None));
      if (this.check(TokenKind.Comma)) {
        this.advance();
      }
    }

    const endPos = this.current().pos;
    this.expect(TokenKind.CloseBracket);

    return {
      kind: 'BytesLiteral',
      elements,
      range: {
        start: startPos,
        end: { line: endPos.line, column: endPos.column + 1, offset: endPos.offset + 1 },
      },
    };
  }

  private skipUntilSemicolon(): void {
    while (!this.check(TokenKind.Semicolon) && !this.isAtEnd()) {
      this.advance();
    }
  }

  // Error recovery
  private recoverToNextDeclaration(): ErrorNode | null {
    const startPos = this.current().pos;
    const message = `Unexpected token '${this.current().text}'`;
    this.errors.push({
      message,
      range: { start: startPos, end: startPos },
    });

    // Skip tokens until we find a declaration keyword
    while (!this.isAtEnd()) {
      if (DECLARATION_KEYWORDS.has(this.current().kind)) {
        break;
      }
      this.advance();
    }

    if (this.pos > 0) {
      return {
        kind: 'ErrorNode',
        message,
        range: { start: startPos, end: this.previousPos() },
      };
    }
    return null;
  }

  // Helpers
  private current(): Token {
    return this.tokens[this.pos];
  }

  private isAtEnd(): boolean {
    return this.pos >= this.tokens.length || this.tokens[this.pos].kind === TokenKind.EOF;
  }

  private check(kind: TokenKind): boolean {
    return !this.isAtEnd() && this.current().kind === kind;
  }

  private advance(): Token {
    const token = this.current();
    if (!this.isAtEnd()) {
      this.pos++;
    }
    return token;
  }

  private expect(kind: TokenKind): Token {
    if (this.check(kind)) {
      return this.advance();
    }
    const current = this.current();
    this.errors.push({
      message: `Expected '${kind}' but found '${current.text || current.kind}'`,
      range: { start: current.pos, end: current.pos },
    });
    return current;
  }

  private expectIdentifier(): string {
    if (this.check(TokenKind.Identifier)) {
      return this.advance().text;
    }
    // Also accept type keywords as identifiers in name position
    if (this.check(TokenKind.TypeKeyword)) {
      return this.advance().text;
    }
    const current = this.current();
    this.errors.push({
      message: `Expected identifier but found '${current.text || current.kind}'`,
      range: { start: current.pos, end: current.pos },
    });
    return '<missing>';
  }

  private expectIdentifierOrType(): string {
    if (this.check(TokenKind.Identifier) || this.check(TokenKind.TypeKeyword)) {
      return this.advance().text;
    }
    const current = this.current();
    this.errors.push({
      message: `Expected identifier or type but found '${current.text || current.kind}'`,
      range: { start: current.pos, end: current.pos },
    });
    return '<missing>';
  }

  private expectTypeName(): string {
    if (this.check(TokenKind.TypeKeyword) || this.check(TokenKind.Identifier)) {
      return this.advance().text;
    }
    const current = this.current();
    this.errors.push({
      message: `Expected type name but found '${current.text || current.kind}'`,
      range: { start: current.pos, end: current.pos },
    });
    return '<missing>';
  }

  private previousPos(): { line: number; column: number; offset: number } {
    if (this.pos > 0) {
      const prev = this.tokens[this.pos - 1];
      return {
        line: prev.pos.line,
        column: prev.pos.column + prev.text.length,
        offset: prev.pos.offset + prev.text.length,
      };
    }
    return this.current().pos;
  }
}

export function parse(source: string): ParseResult {
  const tokens = tokenize(source);
  const parser = new Parser(tokens);
  return parser.parse();
}
