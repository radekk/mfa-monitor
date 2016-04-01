'use strict';

const gulp = require('gulp');
const sequence = require('run-sequence');

gulp.task('start', cb => {
  sequence('configure', 'build', 'install', cb);
});
