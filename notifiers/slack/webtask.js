'use strict';

var util = require('util');

/**
 * @param {secret} SLACK_WEBHOOK_URL
 * @param {secret} SLACK_CHANNEL_NAME
 */
module.exports = function(ctx, cb) {
    var params = ctx.body;

    if (!ctx.secrets.SLACK_WEBHOOK_URL || !ctx.secrets.SLACK_CHANNEL_NAME) {
        return cb(new Error('"SLACK_WEBHOOK_URL" and "SLACK_CHANNEL_NAME" parameters required'));
    }

    if (!params.service || !params.members) {
        return cb(new Error('"service" and "members" parameters required'));
    }

    var SLACK_WEBHOOK_URL = ctx.secrets.SLACK_WEBHOOK_URL;
    var SLACK_CHANNEL_NAME = ctx.secrets.SLACK_CHANNEL_NAME;
    var slack = require('slack-notify')(SLACK_WEBHOOK_URL);
    var service = params.service;
    var members = params.members.join(', ');
    var messages = {
        tfa_disabled: util.format('The following users do not have MFA on `%s`: %s', service, members)
    };

    slack.send({
      channel: SLACK_CHANNEL_NAME,
      icon_emoji: ':warning:',
      text: messages.tfa_disabled,
      unfurl_links: 0,
      username: 'TFA Monitor'
    });

    cb();
};
