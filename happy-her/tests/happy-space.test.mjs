import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  getBloomStage,
  getCandyMessage,
  getNextMessage,
  getMoodResponse,
  normalizeRecipient,
} from '../scripts/happy-space.js';

test('花朵互动按花苞、长叶、盛开三个阶段前进', () => {
  assert.equal(getBloomStage(0).label, '花苞在等你');
  assert.equal(getBloomStage(1).label, '长出一点勇气');
  assert.equal(getBloomStage(9).label, '为你开好啦');
});

test('糖果短句可以循环抽取', () => {
  assert.notEqual(getCandyMessage(0), getCandyMessage(1));
  assert.equal(getCandyMessage(0), getCandyMessage(6));
});

test('每种心情都能得到温柔但不说教的回应', () => {
  for (const mood of ['praise', 'company', 'quiet', 'sweet']) {
    const response = getMoodResponse(mood, 0);

    assert.ok(response.title.length >= 4);
    assert.ok(response.message.length >= 12);
    assert.ok(response.action.length >= 4);
  }
});

test('连续点击时会轮换内容而不是重复上一条', () => {
  const first = getMoodResponse('company', 0);
  const next = getNextMessage('company', 0);

  assert.notDeepEqual(next, first);
});

test('未知心情会安全回退到陪伴回应', () => {
  assert.deepEqual(getMoodResponse('unknown', 0), getMoodResponse('company', 0));
});

test('名字会被清理并限制长度，空值回退为「你」', () => {
  assert.equal(normalizeRecipient('  小云  '), '小云');
  assert.equal(normalizeRecipient(''), '你');
  assert.equal(normalizeRecipient('abcdefghijklmnopqrstuv'), 'abcdefghijkl');
});

test('页面提供可访问的心情选择、动态回应和减少动画支持', async () => {
  const [html, css] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../style.css', import.meta.url), 'utf8'),
  ]);

  assert.match(html, /<main/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /data-mood="company"/);
  assert.match(html, /<button[^>]+data-mood=/);
  assert.match(html, /data-open-gift/);
  assert.match(html, /assets\/bouquet-skink\.png/);
  assert.match(html, /data-mood-card/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(html, /<script[^>]+src="https?:/);
});
