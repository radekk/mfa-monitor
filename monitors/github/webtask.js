'use strict';

var GitHubApi = require('github');
var github = new GitHubApi({
    version: '3.0.0',
    debug: false,
    protocol: 'https',
    host: 'api.github.com',
    timeout: 5000,
    headers: {
        'user-agent': 'webtask-tfa-monitor (https://github.com/radekk/webtask-tfa-monitor/)'
    }
});

/**
 * @param {secret} ORGANIZATION - Github ORGANIZATION name
 * @param {secret} GITHUB_TOKEN - Github API Token with "org:read" permission
 * @return JSON [{username: ''}]
 */
module.exports = function(cx, cb) {
    var ORGANIZATION = cx.secrets.ORGANIZATION;
    var GITHUB_TOKEN = cx.secrets.GITHUB_TOKEN;

    github.authenticate({
        type: 'token',
        token: GITHUB_TOKEN
    });

    // @TODO handle pagination
    github.orgs.getMembers({
        org: ORGANIZATION,
        per_page: 100,
        filter: '2fa_disabled'
    }, function(err, res) {
        if (err) return cb(err);

        if (res && res.length) {
            var members = res.map(function(data) {
                return {
                    username: data.login
                };
            });

            return cb(null, members);
        }

        return [];
    });
};
