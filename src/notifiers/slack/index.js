'use strict';

const assert = require('assert');
const util = require('util');

/**
 * @param {secret} SLACK_WEBHOOK_URL
 * @param {secret} SLACK_CHANNEL_NAME
 * @param JSON     body
 *
 * body: [{name: 'GitHub', accounts: ['john', 'mark']}]
 */
module.exports = (ctx, cb) => {
  assert(ctx.secrets.SLACK_CHANNEL_NAME, 'SLACK_CHANNEL_NAME secret is missing!');
  assert(ctx.secrets.SLACK_WEBHOOK_URL,  'SLACK_WEBHOOK_URL secret is missing!');
  assert(Array.isArray(ctx.body), 'Body content is not an Array!');

  const slack = require('slack-notify')(ctx.secrets.SLACK_WEBHOOK_URL);
  slack.onError = (err) => cb(err);

  ctx.body.forEach(service => {
    let accounts = service.accounts.map(account => `*${account}*`).join(', ');
    let message  = `Users without MFA on \`${service.name}\` are ${accounts}`;

    slack.send({
      channel: ctx.secrets.SLACK_CHANNEL_NAME,
      icon_emoji: ':warning:',
      username: 'MFA Agent',
      text: message
    });
  });

  cb();
};
