'use strict';

const assert = require('assert');
const helper = require('gulp/helper');
const config = helper.getConfig();
const exec = require('child_process').exec;
const gulp = require('gulp');
const shellescape = require('shell-escape');
const util = require('util');

gulp.task('install:cron', cb => {
  assert(config.cron, 'Cron not configured: npm run configure:cron');
  assert(config.cron.name, 'Cron name not set!');
  assert(config.cron.schedule, 'Cron schedule not set!');
  assert(config.cron.filepath, 'Cron filepath not set!');

  const cmd = shellescape([
    'wt-cli', 'cron', 'schedule', '-b', '-n',
    config.cron.name, config.cron.schedule, config.cron.filepath
  ]);

  exec(cmd, (err, stdout, stderr) => {
    if (err) return cb(err);
    if (stderr) return cb(new Error(stderr));

    console.log(stdout);
  });
});
