/** Single-sentence descriptions for all built-in types, functions, and ledger ADT types. */
export const BUILTIN_DOCS: Record<string, string> = {
  // Built-in types
  Field: 'A finite field element, the fundamental numeric type in Compact circuits.',
  Boolean: 'A boolean value, either true or false.',
  Uint: 'An unsigned integer type with a configurable bit width.',
  Bytes: 'A fixed-length sequence of bytes.',
  Vector: 'A fixed-length array of elements of a given type.',
  Opaque: 'An opaque type whose internal representation is hidden.',
  Void: 'The unit type, representing no value.',

  // Built-in functions
  map: 'Applies a function to each element of a collection, returning a new collection.',
  fold: 'Reduces a collection to a single value by applying a function to an accumulator and each element.',
  disclose: 'Reveals a private value, making it publicly visible on the ledger.',
  pad: 'Pads a value to a target length with a fill value.',
  slice: 'Extracts a contiguous sub-range from a collection.',
  default: 'Returns the default (zero) value for a given type.',
  transientHash: 'Computes a hash over transient (non-persistent) state.',
  transientCommit: 'Commits a value to transient (non-persistent) state.',
  persistentHash: 'Computes a hash over persistent ledger state.',
  persistentCommit: 'Commits a value to persistent ledger state.',
  degradeToTransient: 'Converts a persistent state reference to a transient one.',
  upgradeFromTransient: 'Converts a transient state reference to a persistent one.',
  ecAdd: 'Adds two elliptic curve points.',
  ecMul: 'Multiplies an elliptic curve point by a scalar.',
  ecMulGenerator: 'Multiplies the elliptic curve generator point by a scalar.',
  hashToCurve: 'Hashes an arbitrary value to an elliptic curve point.',
  ownPublicKey: 'Returns the public key of the current transaction signer.',
  createZswapInput: 'Creates an input note for a ZSwap transaction.',
  createZswapOutput: 'Creates an output note for a ZSwap transaction.',

  // Built-in functions (0.18.0+)
  left: 'Constructs the left variant of an Either type.',
  right: 'Constructs the right variant of an Either type.',
  burnAddress: 'Returns the zero/burn address as an Either<ZswapCoinPublicKey, ContractAddress>.',

  // Built-in functions (0.19.0+)
  NativePointX: 'Extracts the X coordinate from a NativePoint.',
  NativePointY: 'Extracts the Y coordinate from a NativePoint.',

  // Built-in functions (0.20.0+)
  nativePointX: 'Extracts the X coordinate from a NativePoint.',
  nativePointY: 'Extracts the Y coordinate from a NativePoint.',
  constructNativePoint: 'Constructs a NativePoint from X and Y coordinates.',

  // Ledger ADT types
  Counter: 'A ledger counter that supports increment and decrement operations.',
  Set: 'A ledger set that stores unique elements.',
  Map: 'A ledger map that stores key-value pairs.',
  List: 'A ledger list that stores an ordered sequence of elements.',
  MerkleTree: 'A ledger Merkle tree for authenticated data membership proofs.',
  HistoricMerkleTree: 'A ledger Merkle tree that preserves historical root hashes.',
  Cell: 'A ledger cell that stores a single value.',
  Kernel: 'The runtime kernel providing access to transaction context and operations.',

  // Ledger ADT types (0.18.0+)
  Either: 'A sum type representing a value that is either Left or Right.',
  ZswapCoinPublicKey: 'A public key type for identifying transaction signers.',
  ContractAddress: 'An address type identifying a deployed contract.',
  Maybe: 'An optional type that may or may not contain a value.',
  CurvePoint: 'An elliptic curve point type used for cryptographic operations.',

  // Ledger ADT types (0.19.0+)
  NativePoint: 'A native elliptic curve point type for efficient cryptographic operations.',
};
