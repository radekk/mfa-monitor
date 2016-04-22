'use strict';

const gulp = require('gulp');
const sequence = require('run-sequence');

gulp.task('update', cb => {
  sequence('build', 'install', cb);
});
