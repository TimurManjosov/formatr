import { describe, expect, it } from 'vitest';
import { template } from '../src';

describe('formatr: slice filter', () => {
  it('slices with positive start index', () => {
    const t = template('{text|slice:0,5}');
    expect(t({ text: 'hello world' })).toBe('hello');
  });

  it('slices with negative start index', () => {
    const t = template('{text|slice:-5}');
    expect(t({ text: 'hello world' })).toBe('world');
  });

  it('slices with negative end index', () => {
    const t = template('{text|slice:0,-6}');
    expect(t({ text: 'hello world' })).toBe('hello');
  });

  it('slices without end argument', () => {
    const t = template('{text|slice:6}');
    expect(t({ text: 'hello world' })).toBe('world');
  });

  it('handles start greater than string length', () => {
    const t = template('{text|slice:100}');
    expect(t({ text: 'hello' })).toBe('');
  });

  it('handles start greater than end', () => {
    const t = template('{text|slice:5,2}');
    expect(t({ text: 'hello world' })).toBe('');
  });

  it('converts non-string values to string', () => {
    const t = template('{num|slice:0,3}');
    expect(t({ num: 12345 })).toBe('123');
  });

  it('extracts user ID substring', () => {
    const t = template('ID: {userId|slice:0,8}');
    expect(t({ userId: 'abc123def456ghi789' })).toBe('ID: abc123de');
  });
});

describe('formatr: pad filter', () => {
  it('pads right by default', () => {
    const t = template('{text|pad:10}');
    expect(t({ text: 'hello' })).toBe('hello     ');
  });

  it('pads left with direction argument', () => {
    const t = template('{text|pad:10,left}');
    expect(t({ text: 'hello' })).toBe('     hello');
  });

  it('pads right explicitly', () => {
    const t = template('{text|pad:10,right}');
    expect(t({ text: 'hello' })).toBe('hello     ');
  });

  it('pads both sides (center)', () => {
    const t = template('{text|pad:11,both}');
    expect(t({ text: 'hello' })).toBe('   hello   ');
  });

  it('pads center with alias', () => {
    const t = template('{text|pad:11,center}');
    expect(t({ text: 'hello' })).toBe('   hello   ');
  });

  it('uses custom padding character', () => {
    const t = template('{text|pad:10,right,*}');
    expect(t({ text: 'hello' })).toBe('hello*****');
  });

  it('uses custom padding character on left', () => {
    const t = template('{text|pad:10,left,0}');
    expect(t({ text: '42' })).toBe('00000000' + '42');
  });

  it('returns unchanged if string is already at target length', () => {
    const t = template('{text|pad:5}');
    expect(t({ text: 'hello' })).toBe('hello');
  });

  it('returns unchanged if string exceeds target length', () => {
    const t = template('{text|pad:3}');
    expect(t({ text: 'hello' })).toBe('hello');
  });

  it('uses first character of multi-char padding', () => {
    const t = template('{text|pad:8,right,xyz}');
    expect(t({ text: 'hi' })).toBe('hixxxxxx');
  });

  it('handles non-numeric length gracefully', () => {
    const t = template('{text|pad:abc}');
    expect(t({ text: 'hello' })).toBe('hello');
  });

  it('converts non-string values to string', () => {
    const t = template('{num|pad:5,left,0}');
    expect(t({ num: 42 })).toBe('00042');
  });

  it('formats log line with padding', () => {
    const t = template('[{level|pad:5}] {message}');
    expect(t({ level: 'INFO', message: 'Server started' })).toBe('[INFO ] Server started');
    expect(t({ level: 'ERROR', message: 'Failed' })).toBe('[ERROR] Failed');
  });
});

describe('formatr: truncate filter', () => {
  it('returns string unchanged if shorter than length', () => {
    const t = template('{text|truncate:20}');
    expect(t({ text: 'hello' })).toBe('hello');
  });

  it('returns string unchanged if equal to length', () => {
    const t = template('{text|truncate:5}');
    expect(t({ text: 'hello' })).toBe('hello');
  });

  it('truncates long string with default ellipsis', () => {
    const t = template('{text|truncate:10}');
    expect(t({ text: 'hello world from the universe' })).toBe('hello w...');
  });

  it('truncates with custom ellipsis', () => {
    const t = template('{text|truncate:10,…}');
    expect(t({ text: 'hello world from the universe' })).toBe('hello wor…');
  });

  it('truncates with multi-character custom ellipsis', () => {
    const t = template('{text|truncate:15,...}');
    expect(t({ text: 'This is a very long comment' })).toBe('This is a ve...');
  });

  it('handles very small length values', () => {
    const t = template('{text|truncate:3}');
    expect(t({ text: 'hello world' })).toBe('...');
  });

  it('handles length smaller than ellipsis', () => {
    const t = template('{text|truncate:2}');
    expect(t({ text: 'hello world' })).toBe('...');
  });

  it('handles empty ellipsis', () => {
    const t = template('{text|truncate:5,}');
    expect(t({ text: 'hello world' })).toBe('hello');
  });

  it('converts non-string values to string', () => {
    const t = template('{num|truncate:3}');
    expect(t({ num: 12345 })).toBe('...');
  });

  it('handles non-numeric length gracefully', () => {
    const t = template('{text|truncate:abc}');
    expect(t({ text: 'hello' })).toBe('hello');
  });

  it('truncates comment preview', () => {
    const t = template('Comment: {comment|truncate:50,...}');
    const longComment = 'This is a very long comment that needs to be truncated for display purposes';
    const result = t({ comment: longComment });
    expect(result).toBe('Comment: This is a very long comment that needs to be tr...');
    expect(result.length).toBe(59); // "Comment: " (9) + truncated text (50)
  });
});

describe('formatr: replace filter', () => {
  it('replaces single occurrence', () => {
    const t = template('{text|replace:o,a}');
    expect(t({ text: 'hello' })).toBe('hella');
  });

  it('replaces all occurrences', () => {
    const t = template('{text|replace:o,a}');
    expect(t({ text: 'hello world' })).toBe('hella warld');
  });

  it('returns unchanged if substring not found', () => {
    const t = template('{text|replace:x,y}');
    expect(t({ text: 'hello' })).toBe('hello');
  });

  it('handles empty replacement string', () => {
    const t = template('{text|replace:o,}');
    expect(t({ text: 'hello' })).toBe('hell');
  });

  it('handles empty from string', () => {
    const t = template('{text|replace:,x}');
    expect(t({ text: 'hello' })).toBe('hello');
  });

  it('replaces with longer string', () => {
    const t = template('{text|replace:o,ooo}');
    expect(t({ text: 'hello' })).toBe('hellooo');
  });

  it('replaces special characters', () => {
    const t = template('{text|replace:@,at}');
    expect(t({ text: 'user@example.com' })).toBe('useratexample.com');
  });

  it('replaces underscores with dashes', () => {
    const t = template('{text|replace:_,-}');
    expect(t({ text: 'hello_world' })).toBe('hello-world');
  });

  it('converts non-string values to string', () => {
    const t = template('{num|replace:1,9}');
    expect(t({ num: 12121 })).toBe('92929');
  });

  it('replaces multiple characters', () => {
    const t = template('{text|replace:ll,rr}');
    expect(t({ text: 'hello' })).toBe('herro');
  });
});

describe('formatr: chaining new filters', () => {
  it('chains slice with upper', () => {
    const t = template('{text|slice:0,5|upper}');
    expect(t({ text: 'hello world' })).toBe('HELLO');
  });

  it('chains trim, slice, and pad', () => {
    const t = template('{text|trim|slice:0,5|pad:10}');
    expect(t({ text: '  hello world  ' })).toBe('hello     ');
  });

  it('chains truncate with lower', () => {
    const t = template('{text|truncate:8|lower}');
    expect(t({ text: 'HELLO WORLD' })).toBe('hello...');
  });

  it('chains replace and truncate', () => {
    const t = template('{text|replace:_,-|truncate:10}');
    expect(t({ text: 'hello_world_universe' })).toBe('hello-w...');
  });

  it('chains multiple filters for complex transformation', () => {
    const t = template('{text|trim|replace:_,-|slice:0,8|upper}');
    expect(t({ text: '  hello_world  ' })).toBe('HELLO-WO');
  });
});
