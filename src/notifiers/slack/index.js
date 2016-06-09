'use strict';

const assert = require('assert');

function getMessage(service, accounts, mfaStatus) {
  return (
    mfaStatus
    ? `:heart: Users who enabled MFA on \`${service}\` are: ${accounts}`
    : `:warning: Users without MFA on \`${service}\` are: ${accounts}`
  );
}

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
  assert(Array.isArray(ctx.body.data), 'Body content is not an Array!');

  const slack = require('slack-notify')(ctx.secrets.SLACK_WEBHOOK_URL);
  const mfaStatus = !!ctx.body.mfaStatus;
  slack.onError = (err) => cb(err);

  ctx.body.data.forEach(service => {
    if (!service.accounts.length) return;

    let accounts = service.accounts.map(account => `*${account}*`).join(', ');
    let message  = getMessage(service.name, accounts, mfaStatus);

    slack.send({
      channel: ctx.secrets.SLACK_CHANNEL_NAME,
      username: 'MFA Agent',
      text: message
    });
  });

  cb();
};
