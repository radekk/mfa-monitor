'use strict';

const _ = require('lodash');
const Promise = require('bluebird').Promise;
const sandbox = require('sandboxjs');

module.exports = (params) => ({
  getDifference: (newest, stored) => {
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
  },

  getMonitoringResult: () => {
    const webtasks = params.config.webtasks;
    const monitors = webtasks.filter(wt => wt.metadata.type === 'monitor');
    let monitoring = [];

    return new Promise((resolve, reject) =>
      Promise.each(monitors, wt =>
        new sandbox.Webtask(params.profile, wt.token).run({})
          .then(result => {
            if (result.error) return reject(result.error.text);

            monitoring.push({
              name: wt.metadata.name,
              accounts: result.body
            });
          })
      ).then(() => resolve(monitoring))
       .catch(err => reject(err))
    );
  }
});
