'use strict';

const configPath = 'build/config.json';
const fs = require('fs');
const glob = require('glob');
const prompt = require('Inquirer').prompt;
const Promise = require('bluebird').Promise;
const _ = require('lodash');

const validators = {
  isNotEmpty: value => !!value ? true : 'Value is required!',
  atLeastOneSelected: data => data.length ? true : 'Select at least one option!'
};

module.exports = {
  getWebtasks: () => _.flatten([
      'src/monitors/**/config.json',
      'src/notifiers/**/config.json'
    ].map(path => glob.sync(path).map(
      file => require(file)
    ))
  ),

  prompt: questions => new Promise(resolve =>
    prompt(questions, resolve)
  ),

  promptWebtaskSettings: wt => new Promise(resolve =>
    prompt(wt.prompt.map(params => ({
      type: params.type,
      name: params.name,
      message: `[${wt.type} | ${wt.name}] ${params.name}:`,
      default: params.default || null,
      validate: validators.isNotEmpty
    })), resolve)
  ),

  getConfig: () => require(configPath),

  updateConfig: (name, settings) => new Promise((resolve, reject) => {
    let config = {};

    if (fs.existsSync(configPath)) {
      config = require(configPath);
    }

    config[name] = settings;

    fs.writeFile(configPath, JSON.stringify(config), err => {
      if (err) return reject(err);
      resolve();
    });
  }),

  validators: validators
};
