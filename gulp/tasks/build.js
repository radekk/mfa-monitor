'use strict';

const gulp = require('gulp');
const sequence = require('run-sequence');

gulp.task('build', cb => {
  sequence('build:webtasks', cb);
});
