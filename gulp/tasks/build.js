'use strict';

const assert = require('assert');
const gulp = require('gulp');
const helper = require('gulp/helper');
const sequence = require('run-sequence');

gulp.task('build', cb => {
  assert(helper.isConfigured(), `Project is not configured: npm run configure`);

  sequence('build:webtasks', cb);
});
