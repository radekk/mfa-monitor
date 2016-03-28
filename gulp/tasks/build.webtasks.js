'use strict';

const assert = require('assert');
const gulp = require('gulp');
const helper = require('gulp/helper');
const _ = require('lodash');
const Promise = require('bluebird').Promise;
const sandbox = require('sandboxjs');

gulp.task('build:webtasks', (cb) => {
  const config = helper.getConfig();
  assert(config.sandbox.token, 'Sandbox Token is required!');
  assert(config.webtasks.length, 'List of Webtasks is empty!');

  const profile = sandbox.fromToken(config.sandbox.token, config.sandbox);
  let webtasks = [];

  Promise.each(config.webtasks, (wt) => {
    // Add config params but don't override if setting already exists
    let claims = _.defaults({
      url: wt.secrets.WEBTASK_URL,
      ectx: wt.secrets
    }, wt.metadata.claims);

    return profile.createTokenRaw(claims).then(token => {
      webtasks.push(_.defaults(wt, {
        token: token
      }))
    }).then(Promise.resolve(webtasks));
  }).then(config => helper.updateConfig('webtasks', config))
    .catch(cb);
});
