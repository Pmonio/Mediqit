import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import adsConfig from '../api/ads-config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicPages = [
  'index.html', 'blood-pressure-monitors.html', 'glucometers.html',
  'first-aid-kits.html', 'thermometers.html', 'students.html',
  'students-thank-you.html', 'thank-you.html', 'contact.html',
  'what-we-are-building.html', 'privacy.html',
];

function response() {
  return {
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('public pages initialise the consent controller from the head', () => {
  for (const file of publicPages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const head = html.split('</head>')[0];
    assert.match(head, /\/consent\.css/);
    assert.match(head, /\/consent\.js/);
  }
});

test('ads config stays disabled for missing or malformed values', () => {
  const oldTag = process.env.GOOGLE_ADS_TAG_ID;
  const oldLabel = process.env.GOOGLE_ADS_SIGNUP_LABEL;
  try {
    process.env.GOOGLE_ADS_TAG_ID = 'not-a-tag';
    process.env.GOOGLE_ADS_SIGNUP_LABEL = '<script>';
    const res = response();
    adsConfig({ method: 'GET' }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { enabled: false, tagId: null, signupLabel: null });
  } finally {
    if (oldTag === undefined) delete process.env.GOOGLE_ADS_TAG_ID; else process.env.GOOGLE_ADS_TAG_ID = oldTag;
    if (oldLabel === undefined) delete process.env.GOOGLE_ADS_SIGNUP_LABEL; else process.env.GOOGLE_ADS_SIGNUP_LABEL = oldLabel;
  }
});

test('valid public Google Ads identifiers enable measurement', () => {
  const oldTag = process.env.GOOGLE_ADS_TAG_ID;
  const oldLabel = process.env.GOOGLE_ADS_SIGNUP_LABEL;
  try {
    process.env.GOOGLE_ADS_TAG_ID = 'AW-123456789';
    process.env.GOOGLE_ADS_SIGNUP_LABEL = 'AbCdEf_123-xy';
    const res = response();
    adsConfig({ method: 'GET' }, res);
    assert.deepEqual(res.body, { enabled: true, tagId: 'AW-123456789', signupLabel: 'AbCdEf_123-xy' });
  } finally {
    if (oldTag === undefined) delete process.env.GOOGLE_ADS_TAG_ID; else process.env.GOOGLE_ADS_TAG_ID = oldTag;
    if (oldLabel === undefined) delete process.env.GOOGLE_ADS_SIGNUP_LABEL; else process.env.GOOGLE_ADS_SIGNUP_LABEL = oldLabel;
  }
});

test('signup conversion is armed only after a successful first-time join', () => {
  const signup = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
  const thanks = fs.readFileSync(path.join(root, 'thank-you.js'), 'utf8');
  assert.match(signup, /response\.status === 409/);
  assert.match(signup, /mediqit-signup-conversion-pending/);
  assert.match(thanks, /removeItem\("mediqit-signup-conversion-pending"\)/);
  assert.match(thanks, /trackSignup/);
});

test('privacy notice contains advertising and cookie disclosures', () => {
  const privacy = fs.readFileSync(path.join(root, 'privacy.html'), 'utf8');
  assert.match(privacy, /Website analytics and advertising/);
  assert.match(privacy, /Cookies and your choices/);
  assert.match(privacy, /policies\.google\.com\/technologies\/partner-sites/);
});
