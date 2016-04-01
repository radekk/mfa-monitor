/**
 * 'config' variable is appended to this file by the Mustache engine.
 * As a result it generates ./build/cron.js file ready to ship as a webtask.
 *
 * @TODO https://github.com/auth0/wt-cli/issues/55
 */
const assert = require('assert');
const sandbox = require('sandboxjs');
const profile = sandbox.fromToken(config.sandbox.token, config.sandbox);
const Promise = require('bluebird').Promise;
const _ = require('lodash');
const db = require('src/storage/webtask');

function cron(ctx, cb) {
  db.init(ctx.storage);

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
