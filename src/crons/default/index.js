'use strict';

const assert = require('assert');
const config = require('json!./../../../build/config.json');
const db = require('src/storage/webtask');
const Promise = require('bluebird').Promise;
const sandbox = require('sandboxjs');
const _ = require('lodash');
let profile;

function cron(ctx, cb) {
  db.init(ctx.storage);
  profile = sandbox.fromToken(config.sandbox.token, config.sandbox);

  getMonitoringResult()
    .then(services => db.getStoredData()
    .then(stored => {
      const newAccounts = getDifference(services, stored);
      if (!newAccounts.length) return cb();

      notifyWebtasks(newAccounts)
        .then(() => db.storeData(services)
        .then(() => cb()));
    })
  ).catch(err => cb(err));
}

function getDifference(newest, stored) {
  let result = [];
  stored = _.isEmpty(stored) ? [] : stored;

  newest.forEach(service => {
    let current = stored.filter(row => row.name === service.name).pop();
    if (!current) return result.push(service);

    const newAccounts = _.difference(service.accounts, current.accounts);
    if (newAccounts.length) {
      result.push({
        name: service.name,
        accounts: newAccounts
      });
    }
  });

  return result;
}

function getMonitoringResult() {
  const monitors = config.webtasks.filter(wt => wt.metadata.type === 'monitor');
  let monitoring = [];

  return new Promise((resolve, reject) =>
    Promise.each(monitors, wt =>
      new sandbox.Webtask(profile, wt.token).run({})
        .then(result => monitoring.push({
          name: wt.metadata.name,
          accounts: result.body
        }))
    ).then(() => resolve(monitoring))
     .catch(err => reject(err))
  );
}

function notifyWebtasks(data) {
  const notifiers = config.webtasks.filter(wt => wt.metadata.type === 'notifier');
  if (!data.length) return Promise.resolve(false);

  return new Promise((resolve, reject) =>
    Promise.each(notifiers, wt =>
      new sandbox.Webtask(profile, wt.token).run({
        method: 'post',
        body: data
      })
    ).then(result => resolve(result))
     .catch(err => reject(err))
  );
}

module.exports = cron;
