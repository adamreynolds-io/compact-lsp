import {
  Declaration,
  SourceFile,
  CircuitDefinition,
  ExternalCircuit,
  WitnessDeclaration,
  StructDefinition,
  EnumDefinition,
  ModuleDefinition,
  ConstDeclaration,
  ContractDeclaration,
  LedgerDeclaration,
  NewTypeDeclaration,
  ExportList,
  SourceRange,
  Parameter,
} from './ast';
import { formatTypeNode } from './symbols';

export enum DocSymbolKind {
  Function = 12,
  Variable = 13,
  Constant = 14,
  Struct = 23,
  Enum = 10,
  Module = 2,
  Interface = 11,
  Field = 8,
  EnumMember = 22,
}

export interface DocSymbol {
  name: string;
  detail: string;
  kind: DocSymbolKind;
  range: SourceRange;
  selectionRange: SourceRange;
  children: DocSymbol[];
}

export function getDocumentSymbols(sourceFile: SourceFile): DocSymbol[] {
  const symbols: DocSymbol[] = [];
  for (const decl of sourceFile.declarations) {
    const sym = declToSymbol(decl);
    if (sym) symbols.push(sym);
  }
  return symbols;
}

function declToSymbol(decl: Declaration): DocSymbol | undefined {
  switch (decl.kind) {
    case 'CircuitDefinition':
      return circuitSymbol(decl);
    case 'ExternalCircuit':
      return externalCircuitSymbol(decl);
    case 'WitnessDeclaration':
      return witnessSymbol(decl);
    case 'StructDefinition':
      return structSymbol(decl);
    case 'EnumDefinition':
      return enumSymbol(decl);
    case 'ModuleDefinition':
      return moduleSymbol(decl);
    case 'ConstDeclaration':
      return constSymbol(decl);
    case 'ContractDeclaration':
      return contractSymbol(decl);
    case 'LedgerDeclaration':
      return ledgerSymbol(decl);
    case 'NewTypeDeclaration':
      return newTypeSymbol(decl);
    case 'ExportList':
      return exportListSymbol(decl);
    default:
      return undefined;
  }
}

function nameSelectionRange(decl: { name: string; range: SourceRange }): SourceRange {
  // Find the name within the declaration's start line
  // The name starts after keywords, so we use a heuristic: search for the name
  // For simplicity, we'll use the declaration range start and name length
  // This is approximate but works for the outline view
  return {
    start: decl.range.start,
    end: {
      line: decl.range.start.line,
      column: decl.range.start.column + decl.name.length,
      offset: decl.range.start.offset + decl.name.length,
    },
  };
}

function formatParams(params: Parameter[]): string {
  return params
    .map((p) => (p.typeAnnotation ? `${p.name}: ${formatTypeNode(p.typeAnnotation)}` : p.name))
    .join(', ');
}

function circuitDetail(decl: CircuitDefinition | ExternalCircuit): string {
  const parts: string[] = [];
  if (decl.isExport) parts.push('export');
  if (decl.isPure) parts.push('pure');
  if (parts.length > 0) {
    let detail = parts.join(' ') + ' ';
    detail += `(${formatParams(decl.params)})`;
    if (decl.returnType) detail += ` : ${formatTypeNode(decl.returnType)}`;
    return detail;
  }
  let detail = `(${formatParams(decl.params)})`;
  if (decl.returnType) detail += ` : ${formatTypeNode(decl.returnType)}`;
  return detail;
}

function circuitSymbol(decl: CircuitDefinition): DocSymbol {
  return {
    name: decl.name,
    detail: circuitDetail(decl),
    kind: DocSymbolKind.Function,
    range: decl.range,
    selectionRange: nameSelectionRange(decl),
    children: [],
  };
}

function externalCircuitSymbol(decl: ExternalCircuit): DocSymbol {
  return {
    name: decl.name,
    detail: circuitDetail(decl),
    kind: DocSymbolKind.Function,
    range: decl.range,
    selectionRange: nameSelectionRange(decl),
    children: [],
  };
}

function witnessSymbol(decl: WitnessDeclaration): DocSymbol {
  let detail = `(${formatParams(decl.params)})`;
  if (decl.returnType) detail += ` : ${formatTypeNode(decl.returnType)}`;
  return {
    name: decl.name,
    detail,
    kind: DocSymbolKind.Function,
    range: decl.range,
    selectionRange: nameSelectionRange(decl),
    children: [],
  };
}

function structSymbol(decl: StructDefinition): DocSymbol {
  const children: DocSymbol[] = decl.fields.map((f) => ({
    name: f.name,
    detail: formatTypeNode(f.typeAnnotation),
    kind: DocSymbolKind.Field,
    range: f.range,
    selectionRange: f.range,
    children: [],
  }));
  return {
    name: decl.name,
    detail: '',
    kind: DocSymbolKind.Struct,
    range: decl.range,
    selectionRange: nameSelectionRange(decl),
    children,
  };
}

function enumSymbol(decl: EnumDefinition): DocSymbol {
  const children: DocSymbol[] = decl.variants.map((v) => ({
    name: v.name,
    detail: '',
    kind: DocSymbolKind.EnumMember,
    range: v.range,
    selectionRange: v.range,
    children: [],
  }));
  return {
    name: decl.name,
    detail: '',
    kind: DocSymbolKind.Enum,
    range: decl.range,
    selectionRange: nameSelectionRange(decl),
    children,
  };
}

function moduleSymbol(decl: ModuleDefinition): DocSymbol {
  const children: DocSymbol[] = [];
  for (const nested of decl.declarations) {
    const sym = declToSymbol(nested);
    if (sym) children.push(sym);
  }
  return {
    name: decl.name,
    detail: '',
    kind: DocSymbolKind.Module,
    range: decl.range,
    selectionRange: nameSelectionRange(decl),
    children,
  };
}

function constSymbol(decl: ConstDeclaration): DocSymbol {
  const detail = decl.typeAnnotation ? formatTypeNode(decl.typeAnnotation) : '';
  return {
    name: decl.name,
    detail,
    kind: DocSymbolKind.Constant,
    range: decl.range,
    selectionRange: nameSelectionRange(decl),
    children: [],
  };
}

function contractSymbol(decl: ContractDeclaration): DocSymbol {
  const children: DocSymbol[] = decl.circuits.map((c) => externalCircuitSymbol(c));
  return {
    name: decl.name,
    detail: '',
    kind: DocSymbolKind.Interface,
    range: decl.range,
    selectionRange: nameSelectionRange(decl),
    children,
  };
}

function ledgerSymbol(decl: LedgerDeclaration): DocSymbol {
  return {
    name: decl.name,
    detail: formatTypeNode(decl.typeAnnotation),
    kind: DocSymbolKind.Variable,
    range: decl.range,
    selectionRange: nameSelectionRange(decl),
    children: [],
  };
}

function newTypeSymbol(decl: NewTypeDeclaration): DocSymbol {
  const detail = formatTypeNode(decl.typeExpr);
  return {
    name: decl.name,
    detail,
    kind: DocSymbolKind.Variable,
    range: decl.range,
    selectionRange: nameSelectionRange(decl),
    children: [],
  };
}

function exportListSymbol(decl: ExportList): DocSymbol {
  const detail = decl.names.map((n) => n.name).join(', ');
  return {
    name: 'export',
    detail,
    kind: DocSymbolKind.Module,
    range: decl.range,
    selectionRange: { start: decl.range.start, end: decl.range.start },
    children: [],
  };
}
