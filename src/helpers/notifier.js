'use strict';

const Promise = require('bluebird').Promise;
const sandbox = require('sandboxjs');

module.exports = (params) => ({
  notify: (data, mfaStatus) => {
    const webtasks = params.config.webtasks;
    const notifiers = webtasks.filter(wt => wt.metadata.type === 'notifier');
    if (!data.length) return Promise.resolve(false);

    return new Promise((resolve, reject) =>
      Promise.each(notifiers, wt =>
        new sandbox.Webtask(params.profile, wt.token).run({
          method: 'post',
          body: {
            data: data,
            mfaStatus: !!mfaStatus
          }
        })
      ).then(result => resolve(result))
       .catch(err => reject(err))
    );
  }
});
