import {
  SourceFile,
  Declaration,
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
  NewTypeDeclaration,
  ImportDeclaration,
  SourceRange,
  Parameter,
  TypeNode,
  Statement,
  Expression,
} from './ast';
import { BUILTIN_DOCS } from './builtinDocs';

export type SymbolKind =
  | 'circuit'
  | 'ledger'
  | 'witness'
  | 'struct'
  | 'enum'
  | 'module'
  | 'const'
  | 'contract'
  | 'parameter'
  | 'type'
  | 'builtin-type'
  | 'builtin-function';

export interface SymbolInfo {
  name: string;
  kind: SymbolKind;
  declaration: Declaration | Parameter | undefined;
  range: SourceRange;
  scope: Scope;
  resolvedUri?: string;
  resolvedName?: string;
  documentation?: string;
}

export interface Scope {
  name: string;
  parent: Scope | undefined;
  children: Scope[];
  symbols: Map<string, SymbolInfo>;
}

export interface Reference {
  name: string;
  range: SourceRange;
  scope: Scope;
}

export interface SymbolTableResult {
  fileScope: Scope;
  references: Reference[];
}

const BUILTIN_TYPES = ['Field', 'Boolean', 'Uint', 'Bytes', 'Vector', 'Opaque', 'Void'];

const BUILTIN_FUNCTIONS = [
  'map',
  'fold',
  'disclose',
  'pad',
  'slice',
  'default',
  'transientHash',
  'transientCommit',
  'persistentHash',
  'persistentCommit',
  'degradeToTransient',
  'upgradeFromTransient',
  'ecAdd',
  'ecMul',
  'ecMulGenerator',
  'hashToCurve',
  'ownPublicKey',
  'createZswapInput',
  'createZswapOutput',
];

// Ledger ADT types registered as known types for member completion
const LEDGER_ADT_TYPES = [
  'Counter',
  'Set',
  'Map',
  'List',
  'MerkleTree',
  'HistoricMerkleTree',
  'Cell',
  'Kernel',
];

export function createRootScope(): Scope {
  const root: Scope = {
    name: '<root>',
    parent: undefined,
    children: [],
    symbols: new Map(),
  };

  const dummyRange: SourceRange = {
    start: { line: 0, column: 0, offset: 0 },
    end: { line: 0, column: 0, offset: 0 },
  };

  for (const name of BUILTIN_TYPES) {
    root.symbols.set(name, {
      name,
      kind: 'builtin-type',
      declaration: undefined,
      range: dummyRange,
      scope: root,
      documentation: BUILTIN_DOCS[name],
    });
  }

  for (const name of BUILTIN_FUNCTIONS) {
    root.symbols.set(name, {
      name,
      kind: 'builtin-function',
      declaration: undefined,
      range: dummyRange,
      scope: root,
      documentation: BUILTIN_DOCS[name],
    });
  }

  for (const name of LEDGER_ADT_TYPES) {
    root.symbols.set(name, {
      name,
      kind: 'builtin-type',
      declaration: undefined,
      range: dummyRange,
      scope: root,
      documentation: BUILTIN_DOCS[name],
    });
  }

  return root;
}

export function buildSymbolTable(sourceFile: SourceFile): SymbolTableResult {
  const root = createRootScope();
  const fileScope = createChildScope('<file>', root);
  const references: Reference[] = [];

  for (const decl of sourceFile.declarations) {
    registerDeclaration(decl, fileScope, references);
  }

  return { fileScope, references };
}

function createChildScope(name: string, parent: Scope): Scope {
  const child: Scope = {
    name,
    parent,
    children: [],
    symbols: new Map(),
  };
  parent.children.push(child);
  return child;
}

function registerParams(params: Parameter[], scope: Scope): void {
  for (const param of params) {
    if (param.pattern) {
      // Destructured parameter — register individual bindings
      if (param.pattern.kind === 'TuplePattern') {
        for (const elem of param.pattern.elements) {
          if (elem !== null) {
            scope.symbols.set(elem, {
              name: elem,
              kind: 'parameter',
              declaration: param,
              range: param.range,
              scope,
            });
          }
        }
      } else if (param.pattern.kind === 'StructPattern') {
        for (const field of param.pattern.fields) {
          const name = field.alias || field.key;
          scope.symbols.set(name, {
            name,
            kind: 'parameter',
            declaration: param,
            range: param.range,
            scope,
          });
        }
      }
    } else {
      scope.symbols.set(param.name, {
        name: param.name,
        kind: 'parameter',
        declaration: param,
        range: param.range,
        scope,
      });
    }
  }
}

function registerDeclaration(decl: Declaration, scope: Scope, references: Reference[]): void {
  switch (decl.kind) {
    case 'CircuitDefinition':
      registerCircuit(decl, scope, references);
      break;
    case 'ExternalCircuit':
      registerExternalCircuit(decl, scope);
      break;
    case 'LedgerDeclaration':
      registerLedger(decl, scope);
      break;
    case 'WitnessDeclaration':
      registerWitness(decl, scope);
      break;
    case 'StructDefinition':
      registerStruct(decl, scope);
      break;
    case 'EnumDefinition':
      registerEnum(decl, scope);
      break;
    case 'ModuleDefinition':
      registerModule(decl, scope, references);
      break;
    case 'ConstructorDeclaration':
      registerConstructor(decl, scope, references);
      break;
    case 'ConstDeclaration':
      registerConst(decl, scope);
      break;
    case 'ContractDeclaration':
      registerContract(decl, scope);
      break;
    case 'NewTypeDeclaration':
      registerNewType(decl, scope);
      break;
    case 'ImportDeclaration':
      registerImport(decl, scope);
      break;
    case 'PragmaDeclaration':
    case 'IncludeDeclaration':
    case 'ExportList':
    case 'ErrorNode':
      break;
  }
}

function registerCircuit(decl: CircuitDefinition, scope: Scope, references: Reference[]): void {
  scope.symbols.set(decl.name, {
    name: decl.name,
    kind: 'circuit',
    declaration: decl,
    range: decl.range,
    scope,
  });

  // Create scope for circuit body with parameters
  const circuitScope = createChildScope(decl.name, scope);
  registerParams(decl.params, circuitScope);

  // Walk the body statements
  walkStatements(decl.body, circuitScope, references);
}

function registerExternalCircuit(decl: ExternalCircuit, scope: Scope): void {
  scope.symbols.set(decl.name, {
    name: decl.name,
    kind: 'circuit',
    declaration: decl,
    range: decl.range,
    scope,
  });
}

function registerLedger(decl: LedgerDeclaration, scope: Scope): void {
  scope.symbols.set(decl.name, {
    name: decl.name,
    kind: 'ledger',
    declaration: decl,
    range: decl.range,
    scope,
  });
}

function registerWitness(decl: WitnessDeclaration, scope: Scope): void {
  scope.symbols.set(decl.name, {
    name: decl.name,
    kind: 'witness',
    declaration: decl,
    range: decl.range,
    scope,
  });
}

function registerStruct(decl: StructDefinition, scope: Scope): void {
  scope.symbols.set(decl.name, {
    name: decl.name,
    kind: 'struct',
    declaration: decl,
    range: decl.range,
    scope,
  });
}

function registerEnum(decl: EnumDefinition, scope: Scope): void {
  scope.symbols.set(decl.name, {
    name: decl.name,
    kind: 'enum',
    declaration: decl,
    range: decl.range,
    scope,
  });
}

function registerModule(decl: ModuleDefinition, scope: Scope, references: Reference[]): void {
  scope.symbols.set(decl.name, {
    name: decl.name,
    kind: 'module',
    declaration: decl,
    range: decl.range,
    scope,
  });

  const moduleScope = createChildScope(decl.name, scope);
  for (const nested of decl.declarations) {
    registerDeclaration(nested, moduleScope, references);
  }
}

function registerConstructor(
  decl: ConstructorDeclaration,
  scope: Scope,
  references: Reference[],
): void {
  const ctorScope = createChildScope('<constructor>', scope);
  registerParams(decl.params, ctorScope);

  // Walk the body statements
  walkStatements(decl.body, ctorScope, references);
}

function registerConst(decl: ConstDeclaration, scope: Scope): void {
  scope.symbols.set(decl.name, {
    name: decl.name,
    kind: 'const',
    declaration: decl,
    range: decl.range,
    scope,
  });
}

function registerContract(decl: ContractDeclaration, scope: Scope): void {
  scope.symbols.set(decl.name, {
    name: decl.name,
    kind: 'contract',
    declaration: decl,
    range: decl.range,
    scope,
  });

  const contractScope = createChildScope(decl.name, scope);
  for (const circuit of decl.circuits) {
    registerExternalCircuit(circuit, contractScope);
  }
}

function registerNewType(decl: NewTypeDeclaration, scope: Scope): void {
  scope.symbols.set(decl.name, {
    name: decl.name,
    kind: 'type',
    declaration: decl,
    range: decl.range,
    scope,
  });
}

function registerImport(decl: ImportDeclaration, scope: Scope): void {
  if (decl.specifiers) {
    // Selective import: register each specifier (with alias) in file scope
    for (const spec of decl.specifiers) {
      const name = spec.alias || spec.name;
      scope.symbols.set(name, {
        name,
        kind: 'module',
        declaration: decl,
        range: spec.range,
        scope,
      });
    }
  }
  // For non-selective imports, we don't register anything in scope
  // (the import just makes the module available)
}

function walkStatements(stmts: Statement[], scope: Scope, references: Reference[]): void {
  for (const stmt of stmts) {
    walkStatement(stmt, scope, references);
  }
}

function walkStatement(stmt: Statement, scope: Scope, references: Reference[]): void {
  switch (stmt.kind) {
    case 'ConstStatement': {
      // Walk the initializer first (variable not yet in scope)
      walkExpression(stmt.initializer, scope, references);

      if (stmt.pattern) {
        // Destructured binding — register individual names
        if (stmt.pattern.kind === 'TuplePattern') {
          for (const elem of stmt.pattern.elements) {
            if (elem !== null) {
              scope.symbols.set(elem, {
                name: elem,
                kind: 'const',
                declaration: undefined,
                range: stmt.range,
                scope,
              });
            }
          }
        } else if (stmt.pattern.kind === 'StructPattern') {
          for (const field of stmt.pattern.fields) {
            const name = field.alias || field.key;
            scope.symbols.set(name, {
              name,
              kind: 'const',
              declaration: undefined,
              range: stmt.range,
              scope,
            });
          }
        }
      } else {
        // Register the variable in the current scope
        scope.symbols.set(stmt.name, {
          name: stmt.name,
          kind: 'const',
          declaration: undefined,
          range: stmt.range,
          scope,
        });
      }
      break;
    }
    case 'ReturnStatement': {
      if (stmt.value) {
        walkExpression(stmt.value, scope, references);
      }
      break;
    }
    case 'IfStatement': {
      walkExpression(stmt.condition, scope, references);
      walkStatements(stmt.consequent, scope, references);
      if (stmt.alternate) {
        walkStatements(stmt.alternate, scope, references);
      }
      break;
    }
    case 'ForStatement': {
      walkExpression(stmt.iterable, scope, references);
      // Create a child scope for the for-loop with the iteration variable
      const forScope = createChildScope('<for>', scope);
      forScope.symbols.set(stmt.variable, {
        name: stmt.variable,
        kind: 'parameter',
        declaration: undefined,
        range: stmt.range,
        scope: forScope,
      });
      walkStatements(stmt.body, forScope, references);
      break;
    }
    case 'AssertStatement': {
      walkExpression(stmt.condition, scope, references);
      if (stmt.message) {
        walkExpression(stmt.message, scope, references);
      }
      break;
    }
    case 'ExpressionStatement': {
      walkExpression(stmt.expression, scope, references);
      break;
    }
    case 'BlockStatement': {
      const blockScope = createChildScope('<block>', scope);
      walkStatements(stmt.statements, blockScope, references);
      break;
    }
    case 'ErrorStatement': {
      // Nothing to walk
      break;
    }
  }
}

function walkExpression(expr: Expression, scope: Scope, references: Reference[]): void {
  switch (expr.kind) {
    case 'IdentifierExpression': {
      references.push({
        name: expr.name,
        range: expr.range,
        scope,
      });
      break;
    }
    case 'BinaryExpression': {
      walkExpression(expr.left, scope, references);
      walkExpression(expr.right, scope, references);
      break;
    }
    case 'UnaryExpression': {
      walkExpression(expr.operand, scope, references);
      break;
    }
    case 'CallExpression': {
      walkExpression(expr.callee, scope, references);
      for (const arg of expr.args) {
        walkExpression(arg, scope, references);
      }
      break;
    }
    case 'MemberExpression': {
      // Walk object but NOT property — it's a field name, not a reference
      walkExpression(expr.object, scope, references);
      break;
    }
    case 'IndexExpression': {
      walkExpression(expr.object, scope, references);
      walkExpression(expr.index, scope, references);
      break;
    }
    case 'ConditionalExpression': {
      walkExpression(expr.condition, scope, references);
      walkExpression(expr.consequent, scope, references);
      walkExpression(expr.alternate, scope, references);
      break;
    }
    case 'AssignmentExpression': {
      walkExpression(expr.target, scope, references);
      walkExpression(expr.value, scope, references);
      break;
    }
    case 'CastExpression': {
      walkExpression(expr.expression, scope, references);
      break;
    }
    case 'ArrowFunction': {
      // Create a child scope for the arrow function with params
      const arrowScope = createChildScope('<arrow>', scope);
      registerParams(expr.params, arrowScope);

      if (Array.isArray(expr.body)) {
        // Block body arrow function
        walkStatements(expr.body, arrowScope, references);
      } else {
        // Expression body
        walkExpression(expr.body, arrowScope, references);
      }
      break;
    }
    case 'TupleLiteral': {
      for (const element of expr.elements) {
        walkExpression(element, scope, references);
      }
      break;
    }
    case 'StructConstruction': {
      for (const field of expr.fields) {
        walkExpression(field.value, scope, references);
      }
      if (expr.spread) {
        walkExpression(expr.spread, scope, references);
      }
      break;
    }
    case 'SpreadExpression': {
      walkExpression(expr.argument, scope, references);
      break;
    }
    case 'BytesLiteral': {
      for (const element of expr.elements) {
        walkExpression(element, scope, references);
      }
      break;
    }
    case 'LiteralExpression': {
      // Nothing to do
      break;
    }
  }
}

export function getExportedSymbols(
  sourceFile: SourceFile,
  fileScope: Scope,
): Map<string, SymbolInfo> {
  const exports = new Map<string, SymbolInfo>();
  collectExports(sourceFile.declarations, fileScope, exports);
  return exports;
}

function collectExports(
  declarations: Declaration[],
  scope: Scope,
  exports: Map<string, SymbolInfo>,
): void {
  for (const decl of declarations) {
    // Check declarations with isExport flag
    if ('isExport' in decl && (decl as { isExport: boolean }).isExport && 'name' in decl) {
      const name = (decl as { name: string }).name;
      const sym = scope.symbols.get(name);
      if (sym) {
        exports.set(name, sym);
      }
    }

    // Walk into module declarations to find nested exported symbols
    if (decl.kind === 'ModuleDefinition') {
      const moduleScope = scope.children.find((c) => c.name === decl.name);
      if (moduleScope) {
        collectExports(decl.declarations, moduleScope, exports);
      }
    }

    // Process ExportList entries
    if (decl.kind === 'ExportList') {
      for (const entry of decl.names) {
        const sym = scope.symbols.get(entry.name);
        if (sym) {
          exports.set(entry.name, sym);
        }
      }
    }
  }
}

export function resolveSymbol(name: string, scope: Scope): SymbolInfo | undefined {
  let current: Scope | undefined = scope;
  while (current) {
    const sym = current.symbols.get(name);
    if (sym) return sym;
    current = current.parent;
  }
  return undefined;
}

export function formatSignature(symbol: SymbolInfo): string {
  const decl = symbol.declaration;
  if (!decl) {
    // Built-in
    if (symbol.kind === 'builtin-type') return `(built-in type) ${symbol.name}`;
    if (symbol.kind === 'builtin-function') return `(built-in) ${symbol.name}`;
    return symbol.name;
  }

  switch (decl.kind) {
    case 'CircuitDefinition':
    case 'ExternalCircuit':
      return formatCircuitSignature(decl);
    case 'LedgerDeclaration':
      return formatLedgerSignature(decl);
    case 'WitnessDeclaration':
      return formatWitnessSignature(decl);
    case 'StructDefinition':
      return formatStructSignature(decl);
    case 'EnumDefinition':
      return formatEnumSignature(decl);
    case 'ConstDeclaration':
      return formatConstSignature(decl);
    case 'NewTypeDeclaration':
      return formatNewTypeSignature(decl);
    case 'Parameter':
      return formatParameterSignature(decl);
    default:
      return symbol.name;
  }
}

export function formatTypeNode(t: TypeNode): string {
  switch (t.kind) {
    case 'TypeReference':
      return t.name;
    case 'ParameterizedType':
      return `${t.name}<${t.args
        .map((a) => {
          if (a.kind === 'NumberArgument') return a.value;
          if (a.kind === 'RangeArgument') return `${a.low}..${a.high}`;
          return formatTypeNode(a);
        })
        .join(', ')}>`;
    case 'TupleType':
      return `[${t.elements.map(formatTypeNode).join(', ')}]`;
  }
}

function formatParams(params: Parameter[]): string {
  return params
    .map((p) => (p.typeAnnotation ? `${p.name}: ${formatTypeNode(p.typeAnnotation)}` : p.name))
    .join(', ');
}

function formatCircuitSignature(decl: CircuitDefinition | ExternalCircuit): string {
  const parts: string[] = [];
  if (decl.isExport) parts.push('export');
  if (decl.isPure) parts.push('pure');
  parts.push('circuit');
  let sig = `${parts.join(' ')} ${decl.name}`;
  if (decl.generics.length > 0) {
    sig += `<${decl.generics.join(', ')}>`;
  }
  sig += `(${formatParams(decl.params)})`;
  if (decl.returnType) {
    sig += ` : ${formatTypeNode(decl.returnType)}`;
  }
  return sig;
}

function formatLedgerSignature(decl: LedgerDeclaration): string {
  const parts: string[] = [];
  if (decl.isExport) parts.push('export');
  if (decl.isSealed) parts.push('sealed');
  parts.push('ledger');
  return `${parts.join(' ')} ${decl.name} : ${formatTypeNode(decl.typeAnnotation)}`;
}

function formatWitnessSignature(decl: WitnessDeclaration): string {
  const parts: string[] = [];
  if (decl.isExport) parts.push('export');
  parts.push('witness');
  let sig = `${parts.join(' ')} ${decl.name}`;
  if (decl.generics.length > 0) {
    sig += `<${decl.generics.join(', ')}>`;
  }
  sig += `(${formatParams(decl.params)})`;
  if (decl.returnType) {
    sig += ` : ${formatTypeNode(decl.returnType)}`;
  }
  return sig;
}

function formatStructSignature(decl: StructDefinition): string {
  const parts: string[] = [];
  if (decl.isExport) parts.push('export');
  parts.push('struct');
  let header = `${parts.join(' ')} ${decl.name}`;
  if (decl.generics.length > 0) {
    header += `<${decl.generics.join(', ')}>`;
  }
  const fields = decl.fields
    .map((f) => `  ${f.name}: ${formatTypeNode(f.typeAnnotation)};`)
    .join('\n');
  return `${header} {\n${fields}\n}`;
}

function formatEnumSignature(decl: EnumDefinition): string {
  const parts: string[] = [];
  if (decl.isExport) parts.push('export');
  parts.push('enum');
  return `${parts.join(' ')} ${decl.name} { ${decl.variants.map((v) => v.name).join(', ')} }`;
}

function formatConstSignature(decl: ConstDeclaration): string {
  if (decl.typeAnnotation) {
    return `const ${decl.name}: ${formatTypeNode(decl.typeAnnotation)}`;
  }
  return `const ${decl.name}`;
}

function formatNewTypeSignature(decl: NewTypeDeclaration): string {
  let sig = 'new type ' + decl.name;
  if (decl.generics.length > 0) {
    sig += `<${decl.generics.join(', ')}>`;
  }
  sig += ` = ${formatTypeNode(decl.typeExpr)}`;
  return sig;
}

function formatParameterSignature(param: Parameter): string {
  if (param.typeAnnotation) {
    return `(parameter) ${param.name}: ${formatTypeNode(param.typeAnnotation)}`;
  }
  return `(parameter) ${param.name}`;
}
