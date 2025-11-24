import { analyze } from '../src';

console.log('=== Example 1: Enhanced error messages ===');
const report1 = analyze('{count|plural:one}');
console.log(JSON.stringify(report1.messages[0], null, 2));

console.log('\n=== Example 2: Suspicious filter usage ===');
const report2 = analyze('{username|number}');
console.log(JSON.stringify(report2.messages[0], null, 2));

console.log('\n=== Example 3: Missing key detection ===');
const report3 = analyze('{name} {age}', { context: { age: 30 }, onMissing: 'error' });
console.log(JSON.stringify(report3.messages[0], null, 2));

console.log('\n=== Example 4: Multi-line with ranges ===');
const report4 = analyze('Line 1\n{foo|nope}\nLine 3');
const msg = report4.messages[0];
console.log(`Error at line ${msg?.range.start.line}, column ${msg?.range.start.column}-${msg?.range.end.column}`);
console.log(`Message: ${msg?.message}`);
console.log(`Severity: ${msg?.severity}`);
