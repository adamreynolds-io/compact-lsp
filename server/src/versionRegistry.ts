export interface VersionCapabilities {
  builtinTypes: string[];
  builtinFunctions: string[];
  builtinAdtTypes: string[];
}

interface VersionDelta {
  version: string;
  addTypes?: string[];
  removeTypes?: string[];
  addFunctions?: string[];
  removeFunctions?: string[];
  addAdtTypes?: string[];
  removeAdtTypes?: string[];
}

const VERSION_CHAIN: VersionDelta[] = [
  {
    version: '0.14.0',
    addTypes: ['Field', 'Boolean', 'Uint', 'Bytes', 'Vector', 'Opaque', 'Void'],
    addFunctions: [
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
    ],
    addAdtTypes: [
      'Counter',
      'Set',
      'Map',
      'List',
      'MerkleTree',
      'HistoricMerkleTree',
      'Cell',
      'Kernel',
    ],
  },
  {
    version: '0.18.0',
    addFunctions: ['left', 'right', 'burnAddress'],
    addAdtTypes: ['Either', 'ZswapCoinPublicKey', 'ContractAddress', 'Maybe', 'CurvePoint'],
  },
  {
    version: '0.19.0',
    addFunctions: ['NativePointX', 'NativePointY'],
    removeAdtTypes: ['CurvePoint'],
    addAdtTypes: ['NativePoint'],
  },
  {
    version: '0.20.0',
    removeFunctions: ['NativePointX', 'NativePointY'],
    addFunctions: ['nativePointX', 'nativePointY', 'constructNativePoint'],
  },
  {
    version: '0.21.0',
    // Identical to 0.20.0 — no delta
  },
];

function applyDelta(prev: VersionCapabilities, delta: VersionDelta): VersionCapabilities {
  const types = prev.builtinTypes
    .filter((t) => !delta.removeTypes?.includes(t))
    .concat(delta.addTypes ?? []);
  const funcs = prev.builtinFunctions
    .filter((f) => !delta.removeFunctions?.includes(f))
    .concat(delta.addFunctions ?? []);
  const adts = prev.builtinAdtTypes
    .filter((a) => !delta.removeAdtTypes?.includes(a))
    .concat(delta.addAdtTypes ?? []);
  return { builtinTypes: types, builtinFunctions: funcs, builtinAdtTypes: adts };
}

function buildVersionCapabilities(): Record<string, VersionCapabilities> {
  const result: Record<string, VersionCapabilities> = {};
  const empty: VersionCapabilities = {
    builtinTypes: [],
    builtinFunctions: [],
    builtinAdtTypes: [],
  };
  let prev = empty;
  for (const delta of VERSION_CHAIN) {
    const caps = applyDelta(prev, delta);
    result[delta.version] = caps;
    prev = caps;
  }
  return result;
}

export const LANGUAGE_VERSIONS: Record<string, VersionCapabilities> = buildVersionCapabilities();

export function getAllBuiltins(): VersionCapabilities {
  const types = new Set<string>();
  const funcs = new Set<string>();
  const adts = new Set<string>();
  for (const caps of Object.values(LANGUAGE_VERSIONS)) {
    for (const t of caps.builtinTypes) types.add(t);
    for (const f of caps.builtinFunctions) funcs.add(f);
    for (const a of caps.builtinAdtTypes) adts.add(a);
  }
  return {
    builtinTypes: [...types],
    builtinFunctions: [...funcs],
    builtinAdtTypes: [...adts],
  };
}

export function isKnownVersion(version: string): boolean {
  return version in LANGUAGE_VERSIONS;
}

export function getVersionCapabilities(version: string): VersionCapabilities | undefined {
  return LANGUAGE_VERSIONS[version];
}

export interface ResolvedVersion {
  effectiveVersion: string;
  fallback: boolean;
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na !== nb) return na - nb;
  }
  return 0;
}

function getLatestVersion(): string {
  const sorted = Object.keys(LANGUAGE_VERSIONS).sort(compareVersions);
  return sorted[sorted.length - 1];
}

export function resolveVersion(version: string, operator: '=' | '>='): ResolvedVersion | undefined {
  if (operator === '=') {
    if (LANGUAGE_VERSIONS[version]) {
      return { effectiveVersion: version, fallback: false };
    }
    // Fall forward to latest known version
    const latest = getLatestVersion();
    return { effectiveVersion: latest, fallback: true };
  }

  // operator === '>='
  // Exact match first
  if (LANGUAGE_VERSIONS[version]) {
    return { effectiveVersion: version, fallback: false };
  }

  // Find the next highest version
  const sorted = Object.keys(LANGUAGE_VERSIONS).sort(compareVersions);
  for (const candidate of sorted) {
    if (compareVersions(candidate, version) >= 0) {
      return { effectiveVersion: candidate, fallback: true };
    }
  }

  return undefined;
}
