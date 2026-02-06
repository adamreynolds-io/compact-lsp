export interface VersionCapabilities {
  builtinTypes: string[];
  builtinFunctions: string[];
  builtinAdtTypes: string[];
}

export const LANGUAGE_VERSIONS: Record<string, VersionCapabilities> = {
  '0.14.0': {
    builtinTypes: ['Field', 'Boolean', 'Uint', 'Bytes', 'Vector', 'Opaque', 'Void'],
    builtinFunctions: [
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
    builtinAdtTypes: [
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
  '0.18.0': {
    builtinTypes: ['Field', 'Boolean', 'Uint', 'Bytes', 'Vector', 'Opaque', 'Void'],
    builtinFunctions: [
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
      'left',
      'right',
      'burnAddress',
    ],
    builtinAdtTypes: [
      'Counter',
      'Set',
      'Map',
      'List',
      'MerkleTree',
      'HistoricMerkleTree',
      'Cell',
      'Kernel',
      'Either',
      'ZswapCoinPublicKey',
      'ContractAddress',
      'Maybe',
    ],
  },
};

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

export function resolveVersion(version: string, operator: '=' | '>='): ResolvedVersion | undefined {
  if (operator === '=') {
    return LANGUAGE_VERSIONS[version] ? { effectiveVersion: version, fallback: false } : undefined;
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
