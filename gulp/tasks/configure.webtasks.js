'use strict';

const assert = require('assert');
const gulp = require('gulp');
const helper = require('gulp/helper');
const Promise = require('bluebird').Promise;
const prompt = require('inquirer').prompt;
const _ = require('lodash');

gulp.task('configure:webtasks', cb => {
  const webtasks = helper.getWebtasks();
  assert(webtasks, 'List of available webtasks is empty');

  let config = [];
  const monitors = webtasks.filter(wt => wt.type === 'monitor').map(wt => wt.name);
  const notifiers = webtasks.filter(wt => wt.type === 'notifier').map(wt => wt.name);
  const questions = [
    {
      type: 'checkbox',
      name: 'notifiers',
      message: 'Where do you want to send your alerts',
      choices: notifiers,
      validate: helper.validators.atLeastOneSelected
    },
    {
      type: 'checkbox',
      name: 'monitors',
      message: 'Which services do you want to monitor',
      choices: monitors,
      validate: helper.validators.atLeastOneSelected
    }
  ];

  helper.prompt(questions).then(input => {
    assert(input.notifiers, 'Invalid settings for notifiers');
    assert(input.monitors, 'Invalid settings for monitors');

    let notifiers = _.flatten(input.notifiers.map(
      notifier => webtasks.filter(wt => wt.name === notifier)));

    let monitors = _.flatten(input.monitors.map(
      monitor => webtasks.filter(wt => wt.name === monitor)));

    return Promise.resolve(_.flatten([notifiers, monitors]));
  }).then(data => {
    return Promise.each(data, wt =>
      helper.promptWebtaskSettings(wt).then(input => {
        config.push({
          metadata: wt,
          secrets: input
        });
      })
    )
  }).then(() => {
    helper.updateConfig('webtasks', config).then(cb).catch(cb);
  }).catch(cb);
});
