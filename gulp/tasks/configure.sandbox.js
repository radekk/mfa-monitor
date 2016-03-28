'use strict';

const gulp = require('gulp');
const helper = require('gulp/helper');

gulp.task('configure:sandbox', (cb) => {
  const isNotEmpty = helper.validators.isNotEmpty;
  const questions = [
    {
      type: 'input',
      name: 'url',
      message: 'What is your Profile URL address?',
      default: 'https://webtask.it.auth0.com',
      validate: isNotEmpty
    },
    {
      type: 'input',
      name: 'container',
      message: 'What is your container name?',
      validate: isNotEmpty
    },
    {
      type: 'input',
      name: 'token',
      message: 'What is your token value?',
      validate: isNotEmpty
    }
  ];

  helper.prompt(questions).then(input => {
    helper.updateConfig('sandbox', input).then(cb).catch(cb);
  }).catch(cb);
});
