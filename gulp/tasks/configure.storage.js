'use strict';

const gulp = require('gulp');
const helper = require('gulp/helper');

gulp.task('configure:storage', (cb) => {
  const isNotEmpty = helper.validators.isNotEmpty;
  const questions = [
    {
      type: 'input',
      name: 'uri',
      message: 'What is your MongoDB URI?',
      default: 'mongodb://user:password@host/database',
      validate: isNotEmpty
    }
  ];

  helper.prompt(questions).then(input => {
    helper.updateConfig('storage', input).then(cb).catch(cb);
  }).catch(cb);
});
