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
  IncludeDeclaration,
  ErrorNode,
  TypeNode,
  TypeReference,
  ParameterizedType,
  TupleType,
  TypeArgument,
  NumberArgument,
  Parameter,
  SourceRange,
  ParseError,
  ParseResult,
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
]);

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
    const bodyRange = this.skipBody();
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

  private parseConstructor(
    startPos: { line: number; column: number; offset: number },
  ): ConstructorDeclaration {
    this.expect(TokenKind.Constructor);
    const params = this.parseParameterList();
    const bodyRange = this.skipBody();
    const endPos = this.previousPos();

    return {
      kind: 'ConstructorDeclaration',
      params,
      bodyRange,
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

  private parsePragma(
    startPos: { line: number; column: number; offset: number },
  ): PragmaDeclaration {
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

  private parseImport(
    startPos: { line: number; column: number; offset: number },
  ): ImportDeclaration {
    this.expect(TokenKind.Import);
    const moduleName = this.expectIdentifier();
    const endPos = this.current().pos;
    this.expect(TokenKind.Semicolon);

    return {
      kind: 'ImportDeclaration',
      moduleName,
      range: { start: startPos, end: endPos },
    };
  }

  private parseInclude(
    startPos: { line: number; column: number; offset: number },
  ): IncludeDeclaration {
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
    // type alias: `type Foo = Bar;` — treat as const for simplicity in POC
    this.expect(TokenKind.Type);
    const name = this.expectIdentifier();

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
        args.push({
          kind: 'NumberArgument',
          value,
          range: { start: numStart, end: this.previousPos() },
        } as NumberArgument);
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

      if (this.check(TokenKind.Comma)) {
        this.advance();
      }
    }

    this.expect(TokenKind.CloseParen);
    return params;
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

  // Body skipping
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
