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

export type TypeArgument = TypeNode | NumberArgument | RangeArgument;

export interface NumberArgument {
  kind: 'NumberArgument';
  value: string;
  range: SourceRange;
}

export interface RangeArgument {
  kind: 'RangeArgument';
  low: string;
  high: string;
  range: SourceRange;
}

export interface TupleType {
  kind: 'TupleType';
  elements: TypeNode[];
  range: SourceRange;
}

// Destructuring patterns
export interface TuplePattern {
  kind: 'TuplePattern';
  elements: (string | null)[];
  range: SourceRange;
}

export interface StructPatternField {
  key: string;
  alias?: string;
}

export interface StructPattern {
  kind: 'StructPattern';
  fields: StructPatternField[];
  range: SourceRange;
}

export type DestructurePattern = TuplePattern | StructPattern;

// Parameter
export interface Parameter {
  kind: 'Parameter';
  name: string;
  pattern?: DestructurePattern;
  typeAnnotation: TypeNode | undefined;
  range: SourceRange;
}

// Import specifiers
export interface ImportSpecifier {
  name: string;
  alias?: string;
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
  | NewTypeDeclaration
  | ExportList
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
  body: Statement[];
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
  body: Statement[];
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
  specifiers?: ImportSpecifier[];
  prefix?: string;
  source?: string;
  range: SourceRange;
}

export interface IncludeDeclaration {
  kind: 'IncludeDeclaration';
  path: string;
  range: SourceRange;
}

export interface NewTypeDeclaration {
  kind: 'NewTypeDeclaration';
  name: string;
  generics: string[];
  typeExpr: TypeNode;
  isExport: boolean;
  range: SourceRange;
}

export interface ExportList {
  kind: 'ExportList';
  names: { name: string; range: SourceRange }[];
  range: SourceRange;
}

export interface ErrorNode {
  kind: 'ErrorNode';
  message: string;
  range: SourceRange;
}

// Expressions
export type Expression =
  | IdentifierExpression
  | LiteralExpression
  | BinaryExpression
  | UnaryExpression
  | ConditionalExpression
  | CallExpression
  | MemberExpression
  | IndexExpression
  | TupleLiteral
  | StructConstruction
  | CastExpression
  | ArrowFunction
  | AssignmentExpression
  | SpreadExpression
  | BytesLiteral;

export interface IdentifierExpression {
  kind: 'IdentifierExpression';
  name: string;
  range: SourceRange;
}

export interface LiteralExpression {
  kind: 'LiteralExpression';
  value: string;
  literalType: 'number' | 'string' | 'boolean';
  range: SourceRange;
}

export interface BinaryExpression {
  kind: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
  range: SourceRange;
}

export interface UnaryExpression {
  kind: 'UnaryExpression';
  operator: string;
  operand: Expression;
  range: SourceRange;
}

export interface ConditionalExpression {
  kind: 'ConditionalExpression';
  condition: Expression;
  consequent: Expression;
  alternate: Expression;
  range: SourceRange;
}

export interface CallExpression {
  kind: 'CallExpression';
  callee: Expression;
  args: Expression[];
  range: SourceRange;
}

export interface MemberExpression {
  kind: 'MemberExpression';
  object: Expression;
  property: string;
  range: SourceRange;
}

export interface IndexExpression {
  kind: 'IndexExpression';
  object: Expression;
  index: Expression;
  range: SourceRange;
}

export interface TupleLiteral {
  kind: 'TupleLiteral';
  elements: Expression[];
  range: SourceRange;
}

export interface StructFieldInit {
  name: string;
  value: Expression;
  isShorthand?: boolean;
  range: SourceRange;
}

export interface StructConstruction {
  kind: 'StructConstruction';
  structName: string;
  fields: StructFieldInit[];
  spread?: Expression;
  range: SourceRange;
}

export interface CastExpression {
  kind: 'CastExpression';
  expression: Expression;
  targetType: TypeNode;
  range: SourceRange;
}

export interface ArrowFunction {
  kind: 'ArrowFunction';
  params: Parameter[];
  body: Expression | Statement[];
  range: SourceRange;
}

export interface AssignmentExpression {
  kind: 'AssignmentExpression';
  operator: string;
  target: Expression;
  value: Expression;
  range: SourceRange;
}

export interface SpreadExpression {
  kind: 'SpreadExpression';
  argument: Expression;
  range: SourceRange;
}

export interface BytesLiteral {
  kind: 'BytesLiteral';
  elements: Expression[];
  range: SourceRange;
}

// Statements
export type Statement =
  | ConstStatement
  | ReturnStatement
  | IfStatement
  | ForStatement
  | AssertStatement
  | ExpressionStatement
  | BlockStatement
  | ErrorStatement;

export interface ConstStatement {
  kind: 'ConstStatement';
  name: string;
  pattern?: DestructurePattern;
  typeAnnotation: TypeNode | undefined;
  initializer: Expression;
  range: SourceRange;
}

export interface ReturnStatement {
  kind: 'ReturnStatement';
  value: Expression | undefined;
  range: SourceRange;
}

export interface IfStatement {
  kind: 'IfStatement';
  condition: Expression;
  consequent: Statement[];
  alternate: Statement[] | undefined;
  range: SourceRange;
}

export interface ForStatement {
  kind: 'ForStatement';
  variable: string;
  iterable: Expression;
  body: Statement[];
  range: SourceRange;
}

export interface AssertStatement {
  kind: 'AssertStatement';
  condition: Expression;
  message?: Expression;
  range: SourceRange;
}

export interface ExpressionStatement {
  kind: 'ExpressionStatement';
  expression: Expression;
  range: SourceRange;
}

export interface BlockStatement {
  kind: 'BlockStatement';
  statements: Statement[];
  range: SourceRange;
}

export interface ErrorStatement {
  kind: 'ErrorStatement';
  message: string;
  range: SourceRange;
}

export interface SourceFile {
  kind: 'SourceFile';
  declarations: Declaration[];
  languageVersion?: string;
  languageVersionOperator?: '=' | '>=';
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
