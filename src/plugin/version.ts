// src/plugin/version.ts

/**
 * Minimal semver parsing and comparison utilities.
 * Supports basic version ranges: ^1.0.0, ~1.0.0, >=1.0.0, >1.0.0, <=1.0.0, <1.0.0, =1.0.0, 1.0.0
 */

/**
 * Parsed semantic version.
 */
export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | undefined;
}

/**
 * Parse a version string into its components.
 * @param version - Version string (e.g., "1.2.3", "1.2.3-beta.1")
 * @returns Parsed version object
 * @throws Error if version is invalid
 */
export function parseVersion(version: string): ParsedVersion {
  const trimmed = version.trim();
  // Match: major.minor.patch with optional prerelease
  const match = trimmed.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) {
    throw new Error(`Invalid version format: "${version}"`);
  }
  return {
    major: parseInt(match[1]!, 10),
    minor: parseInt(match[2]!, 10),
    patch: parseInt(match[3]!, 10),
    prerelease: match[4],
  };
}

/**
 * Compare two versions.
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareVersions(a: ParsedVersion, b: ParsedVersion): -1 | 0 | 1 {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1;
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
  
  // Prerelease versions are less than release versions
  if (a.prerelease && !b.prerelease) return -1;
  if (!a.prerelease && b.prerelease) return 1;
  
  // Compare prerelease strings lexicographically if both exist
  if (a.prerelease && b.prerelease) {
    if (a.prerelease < b.prerelease) return -1;
    if (a.prerelease > b.prerelease) return 1;
  }
  
  return 0;
}

/**
 * Parse a semver range and return a test function.
 * Supported formats:
 * - "1.2.3" or "=1.2.3" - exact match
 * - "^1.2.3" - compatible (same major, >= minor.patch)
 * - "~1.2.3" - approximately (same major.minor, >= patch)
 * - ">=1.2.3", ">1.2.3", "<=1.2.3", "<1.2.3" - comparisons
 * - "*" - any version
 * 
 * @param range - Version range string
 * @returns Function that tests if a version satisfies the range
 */
export function parseRange(range: string): (version: ParsedVersion) => boolean {
  const trimmed = range.trim();
  
  // Any version
  if (trimmed === '*' || trimmed === '') {
    return () => true;
  }
  
  // Caret range: ^1.2.3 means >=1.2.3 and <2.0.0 (same major)
  if (trimmed.startsWith('^')) {
    const base = parseVersion(trimmed.slice(1));
    return (v) => {
      if (v.major !== base.major) return false;
      const cmp = compareVersions(v, base);
      return cmp >= 0;
    };
  }
  
  // Tilde range: ~1.2.3 means >=1.2.3 and <1.3.0 (same major.minor)
  if (trimmed.startsWith('~')) {
    const base = parseVersion(trimmed.slice(1));
    return (v) => {
      if (v.major !== base.major) return false;
      if (v.minor !== base.minor) return false;
      return v.patch >= base.patch;
    };
  }
  
  // Greater than or equal
  if (trimmed.startsWith('>=')) {
    const base = parseVersion(trimmed.slice(2));
    return (v) => compareVersions(v, base) >= 0;
  }
  
  // Greater than
  if (trimmed.startsWith('>')) {
    const base = parseVersion(trimmed.slice(1));
    return (v) => compareVersions(v, base) > 0;
  }
  
  // Less than or equal
  if (trimmed.startsWith('<=')) {
    const base = parseVersion(trimmed.slice(2));
    return (v) => compareVersions(v, base) <= 0;
  }
  
  // Less than
  if (trimmed.startsWith('<')) {
    const base = parseVersion(trimmed.slice(1));
    return (v) => compareVersions(v, base) < 0;
  }
  
  // Exact match (with or without =)
  const versionStr = trimmed.startsWith('=') ? trimmed.slice(1) : trimmed;
  // Validate that the remaining string is a valid version format before parsing.
  // This prevents silently treating unsupported range syntaxes as exact versions.
  const versionPattern = /^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/;
  if (!versionPattern.test(versionStr)) {
    throw new Error(`Unsupported or invalid version range format: "${range}"`);
  }
  const base = parseVersion(versionStr);
  return (v) => compareVersions(v, base) === 0;
}

/**
 * Check if a version satisfies a range.
 * @param version - Version string to test
 * @param range - Range string to test against
 * @returns true if version satisfies range
 */
export function satisfies(version: string, range: string): boolean {
  try {
    const parsed = parseVersion(version);
    const test = parseRange(range);
    return test(parsed);
  } catch {
    return false;
  }
}
