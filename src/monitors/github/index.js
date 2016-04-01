'use strict';

const GitHubApi = require('github');
const github = new GitHubApi({
  version: '3.0.0',
  debug: false,
  protocol: 'https',
  host: 'api.github.com',
  timeout: 5000,
  headers: {
    'user-agent': 'webtask-mfa-monitor (https://github.com/radekk/webtask-mfa-monitor/)'
  }
});

/**
 * @param {secret} ORGANIZATION - Github ORGANIZATION name
 * @param {secret} GITHUB_TOKEN - Github API Token with "org:read" permission
 * @return JSON ['john', 'mark']
 */
module.exports = (ctx, cb) => {
  github.authenticate({
    type: 'token',
    token: ctx.secrets.GITHUB_TOKEN
  });

  github.orgs.getMembers({
    org: ctx.secrets.ORGANIZATION,
    per_page: 100,
    filter: '2fa_disabled'
  }, (err, res) => {
    if (err) return cb(err);
    if (res && res.length) return cb(null, res.map(data => data.login));

    return [];
  });
};
