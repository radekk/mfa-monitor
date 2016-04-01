'use strict';

const gulp = require('gulp');
const helper = require('gulp/helper');

gulp.task('configure:cron', cb => {
  const isNotEmpty = helper.validators.isNotEmpty;
  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Set name for your cron task:',
      default: 'mfa-monitor',
      validate: isNotEmpty
    },
    {
      type: 'input',
      name: 'schedule',
      message: 'Set schedule:',
      default: '* * * * *',
      validate: isNotEmpty
    },
    {
      type: 'input',
      name: 'filepath',
      message: 'Cron filepath:',
      default: './src/crons/default/index.js',
      validate: isNotEmpty
    }
  ];

  helper.prompt(questions).then(input => {
    helper.updateConfig('cron', input).then(cb).catch(cb);
  });
});
