'use strict';

const gulp = require('gulp');
const helper = require('gulp/helper');

gulp.task('configure:cron', (cb) => {
  const isNotEmpty = helper.validators.isNotEmpty;
  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Set name for your cron task:',
      default: 'scheduler',
      validate: isNotEmpty
    },
    {
      type: 'input',
      name: 'expression',
      message: 'Set schedule:',
      default: '* * * * *',
      validate: isNotEmpty
    }
  ];

  helper.prompt(questions).then(input => {
    helper.updateConfig('cron', input).then(cb).catch(cb);
  });
});
