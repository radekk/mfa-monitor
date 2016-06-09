'use strict';

const cache = require('lru-cache')();
const configPath = 'build/config.json';
const fs = require('fs');
const glob = require('glob');
const prompt = require('inquirer').prompt;
const Promise = require('bluebird').Promise;
const _ = require('lodash');

const helper = {
  isConfigured: () => {
    try {
      fs.accessSync(configPath, fs.R_OK | fs.W_OK);
    } catch (e) {
      return false;
    }

    return true;
  },

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
      default: helper.getCurrentValue(wt.name, params.name) || params.default || null,
      validate: helper.validators.isNotEmpty
    })), resolve)
  ),

  getConfig: () => {
    let config = cache.get('config');
    if (config) return config;

    config = require(configPath);
    cache.set('config', config);

    return config;
  },

  getCurrentValue: (wtName, paramName) => {
    const config = helper.getConfig();

    if (config && config.webtasks) {
      let wt = _.filter(config.webtasks, wt => wt.metadata.name === wtName).pop() || [];
      if (wt.secrets) return wt.secrets[paramName] || null;
    }
  },

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

  validators: {
    isNotEmpty: value => !!value ? true : 'Value is required!',
    atLeastOneSelected: data => data.length ? true : 'Select at least one option!'
  }
};

module.exports = helper;
