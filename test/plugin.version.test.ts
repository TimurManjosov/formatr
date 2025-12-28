// test/plugin.version.test.ts
import { describe, expect, it } from 'vitest';
import { parseVersion, compareVersions, satisfies } from '../src/plugin/version';

describe('Plugin Version Utilities', () => {
  describe('parseVersion', () => {
    it('should parse simple versions', () => {
      const v = parseVersion('1.2.3');
      expect(v.major).toBe(1);
      expect(v.minor).toBe(2);
      expect(v.patch).toBe(3);
      expect(v.prerelease).toBeUndefined();
    });

    it('should parse versions with prerelease', () => {
      const v = parseVersion('1.0.0-beta.1');
      expect(v.major).toBe(1);
      expect(v.minor).toBe(0);
      expect(v.patch).toBe(0);
      expect(v.prerelease).toBe('beta.1');
    });

    it('should parse versions with alpha prerelease', () => {
      const v = parseVersion('2.1.0-alpha');
      expect(v.major).toBe(2);
      expect(v.minor).toBe(1);
      expect(v.patch).toBe(0);
      expect(v.prerelease).toBe('alpha');
    });

    it('should throw on invalid versions', () => {
      expect(() => parseVersion('1.0')).toThrow(/Invalid version format/);
      expect(() => parseVersion('v1.0.0')).toThrow(/Invalid version format/);
      expect(() => parseVersion('not-a-version')).toThrow(/Invalid version format/);
      expect(() => parseVersion('')).toThrow(/Invalid version format/);
    });

    it('should handle versions with whitespace', () => {
      const v = parseVersion('  1.2.3  ');
      expect(v.major).toBe(1);
      expect(v.minor).toBe(2);
      expect(v.patch).toBe(3);
    });
  });

  describe('compareVersions', () => {
    it('should compare major versions', () => {
      const v1 = parseVersion('1.0.0');
      const v2 = parseVersion('2.0.0');
      expect(compareVersions(v1, v2)).toBe(-1);
      expect(compareVersions(v2, v1)).toBe(1);
    });

    it('should compare minor versions', () => {
      const v1 = parseVersion('1.1.0');
      const v2 = parseVersion('1.2.0');
      expect(compareVersions(v1, v2)).toBe(-1);
      expect(compareVersions(v2, v1)).toBe(1);
    });

    it('should compare patch versions', () => {
      const v1 = parseVersion('1.0.1');
      const v2 = parseVersion('1.0.2');
      expect(compareVersions(v1, v2)).toBe(-1);
      expect(compareVersions(v2, v1)).toBe(1);
    });

    it('should return 0 for equal versions', () => {
      const v1 = parseVersion('1.2.3');
      const v2 = parseVersion('1.2.3');
      expect(compareVersions(v1, v2)).toBe(0);
    });

    it('should compare prerelease vs release', () => {
      const prerelease = parseVersion('1.0.0-beta');
      const release = parseVersion('1.0.0');
      expect(compareVersions(prerelease, release)).toBe(-1);
      expect(compareVersions(release, prerelease)).toBe(1);
    });

    it('should compare prerelease versions', () => {
      const v1 = parseVersion('1.0.0-alpha');
      const v2 = parseVersion('1.0.0-beta');
      expect(compareVersions(v1, v2)).toBe(-1);
      expect(compareVersions(v2, v1)).toBe(1);
    });
  });

  describe('parseRange and satisfies', () => {
    describe('exact match', () => {
      it('should match exact version', () => {
        expect(satisfies('1.2.3', '1.2.3')).toBe(true);
        expect(satisfies('1.2.3', '=1.2.3')).toBe(true);
        expect(satisfies('1.2.4', '1.2.3')).toBe(false);
      });
    });

    describe('caret range (^)', () => {
      it('should match compatible versions', () => {
        expect(satisfies('1.2.3', '^1.2.3')).toBe(true);
        expect(satisfies('1.2.4', '^1.2.3')).toBe(true);
        expect(satisfies('1.3.0', '^1.2.3')).toBe(true);
        expect(satisfies('1.9.9', '^1.2.3')).toBe(true);
      });

      it('should not match incompatible major versions', () => {
        expect(satisfies('2.0.0', '^1.2.3')).toBe(false);
        expect(satisfies('0.2.3', '^1.2.3')).toBe(false);
      });

      it('should not match lower versions', () => {
        expect(satisfies('1.2.2', '^1.2.3')).toBe(false);
        expect(satisfies('1.1.0', '^1.2.3')).toBe(false);
      });
    });

    describe('tilde range (~)', () => {
      it('should match patch-level compatible versions', () => {
        expect(satisfies('1.2.3', '~1.2.3')).toBe(true);
        expect(satisfies('1.2.4', '~1.2.3')).toBe(true);
        expect(satisfies('1.2.9', '~1.2.3')).toBe(true);
      });

      it('should not match different minor versions', () => {
        expect(satisfies('1.3.0', '~1.2.3')).toBe(false);
        expect(satisfies('1.1.0', '~1.2.3')).toBe(false);
      });

      it('should not match lower patch versions', () => {
        expect(satisfies('1.2.2', '~1.2.3')).toBe(false);
      });
    });

    describe('comparison ranges', () => {
      it('should handle >=', () => {
        expect(satisfies('1.2.3', '>=1.2.3')).toBe(true);
        expect(satisfies('1.2.4', '>=1.2.3')).toBe(true);
        expect(satisfies('2.0.0', '>=1.2.3')).toBe(true);
        expect(satisfies('1.2.2', '>=1.2.3')).toBe(false);
      });

      it('should handle >', () => {
        expect(satisfies('1.2.4', '>1.2.3')).toBe(true);
        expect(satisfies('2.0.0', '>1.2.3')).toBe(true);
        expect(satisfies('1.2.3', '>1.2.3')).toBe(false);
        expect(satisfies('1.2.2', '>1.2.3')).toBe(false);
      });

      it('should handle <=', () => {
        expect(satisfies('1.2.3', '<=1.2.3')).toBe(true);
        expect(satisfies('1.2.2', '<=1.2.3')).toBe(true);
        expect(satisfies('1.0.0', '<=1.2.3')).toBe(true);
        expect(satisfies('1.2.4', '<=1.2.3')).toBe(false);
      });

      it('should handle <', () => {
        expect(satisfies('1.2.2', '<1.2.3')).toBe(true);
        expect(satisfies('1.0.0', '<1.2.3')).toBe(true);
        expect(satisfies('1.2.3', '<1.2.3')).toBe(false);
        expect(satisfies('1.2.4', '<1.2.3')).toBe(false);
      });
    });

    describe('wildcard range', () => {
      it('should match any version with *', () => {
        expect(satisfies('1.0.0', '*')).toBe(true);
        expect(satisfies('99.99.99', '*')).toBe(true);
        expect(satisfies('0.0.1', '*')).toBe(true);
      });

      it('should match any version with empty string', () => {
        expect(satisfies('1.0.0', '')).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should return false for invalid version', () => {
        expect(satisfies('invalid', '1.0.0')).toBe(false);
      });

      it('should return false for invalid range', () => {
        expect(satisfies('1.0.0', 'invalid')).toBe(false);
      });
    });
  });
});
