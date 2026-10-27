import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), 'utf8');

test('all shipped HTML links opening a new tab explicitly include noopener', () => {
  const files = execFileSync('git', ['ls-files', '-z', '*.html'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  assert.ok(files.length > 0);
  let checked = 0;
  for (const file of files) {
    for (const [tag] of read(file).matchAll(/<a\b[^>]*>/gi)) {
      const attrs = Object.fromEntries([...tag.matchAll(/([^\s=<>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
        .map(([, name, double, single, bare]) => [name.toLowerCase(), double ?? single ?? bare]));
      if (attrs.target?.toLowerCase() !== '_blank') continue;
      checked++;
      assert.ok(attrs.rel?.toLowerCase().split(/\s+/).includes('noopener'), `${file}: ${tag}`);
    }
  }
  assert.ok(checked > 0);
});

test('homepage React bundle retains noopener on new-tab links after rendering', () => {
  const html = read('index.html');
  const bundleName = /import\("\/(index-[a-f\d]+\.js)"\)/.exec(html)?.[1];
  assert.ok(bundleName, 'homepage must reference a bundle');
  const source = ts.createSourceFile(bundleName, read(bundleName), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  let checked = 0;
  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const props = new Map(node.properties.filter(ts.isPropertyAssignment).map((prop) => [prop.name.getText(source).replace(/^['"]|['"]$/g, ''), prop.initializer]));
      const target = props.get('target');
      if (target && ts.isStringLiteral(target) && target.text === '_blank') {
        checked++;
        const rel = props.get('rel');
        assert.ok(rel && ts.isStringLiteral(rel) && rel.text.split(/\s+/).includes('noopener'), `new-tab props missing noopener: ${node.getText(source).slice(0, 200)}`);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(checked > 0);
});
