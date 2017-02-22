'use strict';

const gulp = require('gulp');
const helper = require('gulp/helper');
const sequence = require('run-sequence');

gulp.task('install', cb => {
  /**
   * 'npm run install' is executed by 'npm install' command by default,
   * skip installation if project is not configured yet.
   */
  if (!helper.isConfigured()) return cb();

  sequence('install:cron', cb);
});
