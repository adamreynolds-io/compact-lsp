import { describe, it, expect } from 'vitest';
import { parse } from '../parser';
import { buildSymbolTable } from '../symbols';
import { computeLintDiagnostics } from '../lintDiagnostics';

function getLintDiagnostics(source: string) {
  const parseResult = parse(source);
  const { fileScope, references } = buildSymbolTable(parseResult.sourceFile);
  return computeLintDiagnostics(parseResult.sourceFile, fileScope, references);
}

describe('unused import detection', () => {
  it('reports unused import specifier', () => {
    const source = `import { foo } from Mod;`;
    const diags = getLintDiagnostics(source);
    const unused = diags.filter((d) => d.code === 'unused-import');
    expect(unused).toHaveLength(1);
    expect(unused[0].message).toBe("'foo' is imported but never used");
    expect(unused[0].severity).toBe('warning');
  });

  it('does not report referenced import specifier', () => {
    const source = `
import { foo } from Mod;
circuit bar() : Field { return foo(1); }
`;
    const diags = getLintDiagnostics(source);
    const unused = diags.filter((d) => d.code === 'unused-import');
    expect(unused).toHaveLength(0);
  });

  it('reports unused aliased import', () => {
    const source = `import { foo as bar } from Mod;`;
    const diags = getLintDiagnostics(source);
    const unused = diags.filter((d) => d.code === 'unused-import');
    expect(unused).toHaveLength(1);
    expect(unused[0].message).toBe("'bar' is imported but never used");
  });

  it('reports only unused specifier in multi-specifier import', () => {
    const source = `
import { used, unused } from Mod;
circuit bar() : Field { return used(1); }
`;
    const diags = getLintDiagnostics(source);
    const unused = diags.filter((d) => d.code === 'unused-import');
    expect(unused).toHaveLength(1);
    expect(unused[0].message).toBe("'unused' is imported but never used");
  });

  it('does not report for non-selective import', () => {
    const source = `import CompactStandardLibrary;`;
    const diags = getLintDiagnostics(source);
    const unused = diags.filter((d) => d.code === 'unused-import');
    expect(unused).toHaveLength(0);
  });
});

describe('unused variable detection', () => {
  it('reports unused const variable', () => {
    const source = `
circuit foo() : Field {
  const x = 42;
  return 0;
}
`;
    const diags = getLintDiagnostics(source);
    const unused = diags.filter((d) => d.code === 'unused-variable');
    expect(unused).toHaveLength(1);
    expect(unused[0].message).toBe("'x' is declared but never used");
    expect(unused[0].severity).toBe('warning');
  });

  it('does not report referenced const', () => {
    const source = `
circuit foo() : Field {
  const x = 42;
  return x;
}
`;
    const diags = getLintDiagnostics(source);
    const unused = diags.filter((d) => d.code === 'unused-variable');
    expect(unused).toHaveLength(0);
  });

  it('excludes underscore variables', () => {
    const source = `
circuit foo() : Field {
  const _ = 42;
  return 0;
}
`;
    const diags = getLintDiagnostics(source);
    const unused = diags.filter((d) => d.code === 'unused-variable');
    expect(unused).toHaveLength(0);
  });
});

describe('unused parameter detection', () => {
  it('reports unused circuit parameter', () => {
    const source = `circuit foo(x: Field, y: Field) : Field { return x; }`;
    const diags = getLintDiagnostics(source);
    const unused = diags.filter((d) => d.code === 'unused-parameter');
    expect(unused).toHaveLength(1);
    expect(unused[0].message).toBe("'y' is declared but never used");
    expect(unused[0].severity).toBe('warning');
  });

  it('does not report when all parameters are referenced', () => {
    const source = `circuit foo(x: Field, y: Field) : Field { return x + y; }`;
    const diags = getLintDiagnostics(source);
    const unused = diags.filter((d) => d.code === 'unused-parameter');
    expect(unused).toHaveLength(0);
  });

  it('excludes witness parameters', () => {
    const source = `witness secret(x: Field) : Boolean;`;
    const diags = getLintDiagnostics(source);
    const unused = diags.filter((d) => d.code === 'unused-parameter');
    expect(unused).toHaveLength(0);
  });

  it('excludes underscore parameters', () => {
    const source = `circuit foo(_: Field) : Field { return 0; }`;
    const diags = getLintDiagnostics(source);
    const unused = diags.filter((d) => d.code === 'unused-parameter');
    expect(unused).toHaveLength(0);
  });
});

describe('unreachable code detection', () => {
  it('reports statement after return', () => {
    const source = `
circuit foo(x: Field) : Field {
  return x;
  const y = 1;
}
`;
    const diags = getLintDiagnostics(source);
    const unreachable = diags.filter((d) => d.code === 'unreachable-code');
    expect(unreachable).toHaveLength(1);
    expect(unreachable[0].message).toBe('Unreachable code after return statement');
    expect(unreachable[0].severity).toBe('warning');
  });

  it('reports single diagnostic for multiple statements after return', () => {
    const source = `
circuit foo(x: Field) : Field {
  return x;
  const a = 1;
  const b = 2;
}
`;
    const diags = getLintDiagnostics(source);
    const unreachable = diags.filter((d) => d.code === 'unreachable-code');
    expect(unreachable).toHaveLength(1);
  });

  it('does not flag code after return in nested block', () => {
    const source = `
circuit foo(x: Field) : Field {
  if (x == 0) { return 0; }
  const y = 1;
  return y;
}
`;
    const diags = getLintDiagnostics(source);
    const unreachable = diags.filter((d) => d.code === 'unreachable-code');
    expect(unreachable).toHaveLength(0);
  });

  it('does not flag when no return in block', () => {
    const source = `
circuit foo(x: Field) : Field {
  const y = x + 1;
  return y;
}
`;
    const diags = getLintDiagnostics(source);
    const unreachable = diags.filter((d) => d.code === 'unreachable-code');
    expect(unreachable).toHaveLength(0);
  });
});

describe('general behavior', () => {
  it('returns empty array for file with no declarations', () => {
    const diags = getLintDiagnostics('');
    expect(diags).toHaveLength(0);
  });

  it('all diagnostics have warning severity', () => {
    const source = `
import { unused } from Mod;
circuit foo(x: Field) : Field {
  const dead = 1;
  return 0;
  const after = 2;
}
`;
    const diags = getLintDiagnostics(source);
    expect(diags.length).toBeGreaterThan(0);
    for (const d of diags) {
      expect(d.severity).toBe('warning');
    }
  });
});
