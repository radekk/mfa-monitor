'use strict';

const assert = require('assert');
const gulp = require('gulp');
const helper = require('gulp/helper');
const mustache = require('gulp-mustache');
const templateFiles = {
  base: 'src/cron/cron.tpl',
  script: 'src/cron/index.js',
  config: 'build/config.json'
};

gulp.task('build:cron', cb => {
  const config = helper.getConfig();
  assert(config.cron, 'Missing cron configuration: npm run configure:cron');
  assert(config.cron.name, 'Cron name is required!');
  assert(config.cron.expression, 'Cron schedule is required!');

  gulp.src('src/cron/cron.tpl')
      .pipe(mustache({}, {extension: '.js'}))
      .pipe(gulp.dest('build/'));
});
