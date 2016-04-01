'use strict';

const gulp = require('gulp');
const sequence = require('run-sequence');

gulp.task('install', cb => {
  sequence('install:cron', cb);
});
