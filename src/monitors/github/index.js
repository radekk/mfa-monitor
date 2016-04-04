'use strict';

const assert = require('assert');
const github = require('github');

/**
 * @param {secret} ORGANIZATION - Github ORGANIZATION name
 * @param {secret} GITHUB_TOKEN - Github API Token with "org:read" permission
 * @return JSON ['john', 'mark']
 */
module.exports = (ctx, cb) => {
  assert(ctx.secrets, 'Secrets not set!');
  assert(ctx.secrets.GITHUB_TOKEN, 'GITHUB_TOKEN not set!');
  assert(ctx.secrets.ORGANIZATION, 'ORGANIZATION not set!');

  const client = new github({
    version: '3.0.0',
    debug: false,
    protocol: 'https',
    host: 'api.github.com',
    timeout: 5000,
    headers: {
      'user-agent': 'webtask-mfa-monitor (https://github.com/radekk/webtask-mfa-monitor/)'
    }
  });

  client.authenticate({
    type: 'token',
    token: ctx.secrets.GITHUB_TOKEN
  });

  client.orgs.getMembers({
    org: ctx.secrets.ORGANIZATION,
    per_page: 100,
    filter: '2fa_disabled'
  }, (err, res) => {
    if (err) return cb(err);
    if (!res) return cb(new Error('Empty response received from Github API!'));

    cb(null, res.map(data => data.login));
  });
};
