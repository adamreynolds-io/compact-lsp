import { Position } from './lexer';

export interface SourceRange {
  start: Position;
  end: Position;
}

// Type annotations
export type TypeNode = TypeReference | ParameterizedType | TupleType;

export interface TypeReference {
  kind: 'TypeReference';
  name: string;
  range: SourceRange;
}

export interface ParameterizedType {
  kind: 'ParameterizedType';
  name: string;
  args: TypeArgument[];
  range: SourceRange;
}

export type TypeArgument = TypeNode | NumberArgument;

export interface NumberArgument {
  kind: 'NumberArgument';
  value: string;
  range: SourceRange;
}

export interface TupleType {
  kind: 'TupleType';
  elements: TypeNode[];
  range: SourceRange;
}

// Parameter
export interface Parameter {
  kind: 'Parameter';
  name: string;
  typeAnnotation: TypeNode | undefined;
  range: SourceRange;
}

// Declarations
export type Declaration =
  | CircuitDefinition
  | ExternalCircuit
  | LedgerDeclaration
  | WitnessDeclaration
  | StructDefinition
  | EnumDefinition
  | ModuleDefinition
  | ConstructorDeclaration
  | ConstDeclaration
  | ContractDeclaration
  | PragmaDeclaration
  | ImportDeclaration
  | IncludeDeclaration
  | ErrorNode;

export interface CircuitDefinition {
  kind: 'CircuitDefinition';
  name: string;
  params: Parameter[];
  returnType: TypeNode | undefined;
  generics: string[];
  isExport: boolean;
  isPure: boolean;
  bodyRange: SourceRange | undefined;
  range: SourceRange;
}

export interface ExternalCircuit {
  kind: 'ExternalCircuit';
  name: string;
  params: Parameter[];
  returnType: TypeNode | undefined;
  generics: string[];
  isExport: boolean;
  isPure: boolean;
  range: SourceRange;
}

export interface LedgerDeclaration {
  kind: 'LedgerDeclaration';
  name: string;
  typeAnnotation: TypeNode;
  isExport: boolean;
  isSealed: boolean;
  range: SourceRange;
}

export interface WitnessDeclaration {
  kind: 'WitnessDeclaration';
  name: string;
  params: Parameter[];
  returnType: TypeNode | undefined;
  generics: string[];
  isExport: boolean;
  range: SourceRange;
}

export interface StructField {
  name: string;
  typeAnnotation: TypeNode;
  range: SourceRange;
}

export interface StructDefinition {
  kind: 'StructDefinition';
  name: string;
  fields: StructField[];
  generics: string[];
  isExport: boolean;
  range: SourceRange;
}

export interface EnumVariant {
  name: string;
  range: SourceRange;
}

export interface EnumDefinition {
  kind: 'EnumDefinition';
  name: string;
  variants: EnumVariant[];
  isExport: boolean;
  range: SourceRange;
}

export interface ModuleDefinition {
  kind: 'ModuleDefinition';
  name: string;
  declarations: Declaration[];
  generics: string[];
  isExport: boolean;
  range: SourceRange;
}

export interface ConstructorDeclaration {
  kind: 'ConstructorDeclaration';
  params: Parameter[];
  bodyRange: SourceRange | undefined;
  range: SourceRange;
}

export interface ConstDeclaration {
  kind: 'ConstDeclaration';
  name: string;
  typeAnnotation: TypeNode | undefined;
  isExport: boolean;
  range: SourceRange;
}

export interface ContractDeclaration {
  kind: 'ContractDeclaration';
  name: string;
  circuits: ExternalCircuit[];
  isExport: boolean;
  range: SourceRange;
}

export interface PragmaDeclaration {
  kind: 'PragmaDeclaration';
  name: string;
  value: string;
  range: SourceRange;
}

export interface ImportDeclaration {
  kind: 'ImportDeclaration';
  moduleName: string;
  range: SourceRange;
}

export interface IncludeDeclaration {
  kind: 'IncludeDeclaration';
  path: string;
  range: SourceRange;
}

export interface ErrorNode {
  kind: 'ErrorNode';
  message: string;
  range: SourceRange;
}

export interface SourceFile {
  kind: 'SourceFile';
  declarations: Declaration[];
  range: SourceRange;
}

export interface ParseError {
  message: string;
  range: SourceRange;
}

export interface ParseResult {
  sourceFile: SourceFile;
  errors: ParseError[];
}
