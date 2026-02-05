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
  SourceRange,
  Parameter,
  TypeNode,
} from './ast';

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
}

export interface Scope {
  name: string;
  parent: Scope | undefined;
  children: Scope[];
  symbols: Map<string, SymbolInfo>;
}

const BUILTIN_TYPES = ['Field', 'Boolean', 'Uint', 'Bytes', 'Vector', 'Opaque', 'Void'];
const BUILTIN_FUNCTIONS = ['map', 'fold', 'disclose', 'pad', 'default'];

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
    });
  }

  for (const name of BUILTIN_FUNCTIONS) {
    root.symbols.set(name, {
      name,
      kind: 'builtin-function',
      declaration: undefined,
      range: dummyRange,
      scope: root,
    });
  }

  return root;
}

export function buildSymbolTable(sourceFile: SourceFile): Scope {
  const root = createRootScope();
  const fileScope = createChildScope('<file>', root);

  for (const decl of sourceFile.declarations) {
    registerDeclaration(decl, fileScope);
  }

  return fileScope;
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

function registerDeclaration(decl: Declaration, scope: Scope): void {
  switch (decl.kind) {
    case 'CircuitDefinition':
      registerCircuit(decl, scope);
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
      registerModule(decl, scope);
      break;
    case 'ConstructorDeclaration':
      registerConstructor(decl, scope);
      break;
    case 'ConstDeclaration':
      registerConst(decl, scope);
      break;
    case 'ContractDeclaration':
      registerContract(decl, scope);
      break;
    case 'PragmaDeclaration':
    case 'ImportDeclaration':
    case 'IncludeDeclaration':
    case 'ErrorNode':
      break;
  }
}

function registerCircuit(decl: CircuitDefinition, scope: Scope): void {
  scope.symbols.set(decl.name, {
    name: decl.name,
    kind: 'circuit',
    declaration: decl,
    range: decl.range,
    scope,
  });

  // Create scope for circuit body with parameters
  const circuitScope = createChildScope(decl.name, scope);
  for (const param of decl.params) {
    circuitScope.symbols.set(param.name, {
      name: param.name,
      kind: 'parameter',
      declaration: param,
      range: param.range,
      scope: circuitScope,
    });
  }
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

function registerModule(decl: ModuleDefinition, scope: Scope): void {
  scope.symbols.set(decl.name, {
    name: decl.name,
    kind: 'module',
    declaration: decl,
    range: decl.range,
    scope,
  });

  const moduleScope = createChildScope(decl.name, scope);
  for (const nested of decl.declarations) {
    registerDeclaration(nested, moduleScope);
  }
}

function registerConstructor(decl: ConstructorDeclaration, scope: Scope): void {
  const ctorScope = createChildScope('<constructor>', scope);
  for (const param of decl.params) {
    ctorScope.symbols.set(param.name, {
      name: param.name,
      kind: 'parameter',
      declaration: param,
      range: param.range,
      scope: ctorScope,
    });
  }
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
    case 'Parameter':
      return formatParameterSignature(decl);
    default:
      return symbol.name;
  }
}

function formatTypeNode(t: TypeNode): string {
  switch (t.kind) {
    case 'TypeReference':
      return t.name;
    case 'ParameterizedType':
      return `${t.name}<${t.args.map((a) => (a.kind === 'NumberArgument' ? a.value : formatTypeNode(a))).join(', ')}>`;
    case 'TupleType':
      return `[${t.elements.map(formatTypeNode).join(', ')}]`;
  }
}

function formatParams(params: Parameter[]): string {
  return params
    .map((p) => (p.typeAnnotation ? `${p.name}: ${formatTypeNode(p.typeAnnotation)}` : p.name))
    .join(', ');
}

function formatCircuitSignature(
  decl: CircuitDefinition | ExternalCircuit,
): string {
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

function formatParameterSignature(param: Parameter): string {
  if (param.typeAnnotation) {
    return `(parameter) ${param.name}: ${formatTypeNode(param.typeAnnotation)}`;
  }
  return `(parameter) ${param.name}`;
}
