'use strict';

const config = require('build/config.json');
const db = require('src/storage/webtask');
const sandbox = require('sandboxjs');
const helper = require('src/helpers')({
  config: config,
  profile: sandbox.fromToken(config.sandbox.token, config.sandbox)
});

module.exports = (ctx, cb) => {
  db.init(ctx.storage);

  helper.monitor.getMonitoringResult()
    .then(services => db.getStoredData()
    .then(stored => {
      // Accounts with disabled MFA
      helper.notifier.notify(helper.monitor.getDifference(services, stored))
        .then(() => db.storeData(services)
        .then(() => cb()));

      // Accounts with MFA state changed from "disabled" => "enabled"
      helper.notifier.notify(helper.monitor.getDifference(stored, services), true)
        .then(() => cb());
    })
  ).catch(err => {
    console.error(err);
    cb(err);
  });
};
