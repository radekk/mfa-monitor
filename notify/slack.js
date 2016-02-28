'use strict';
// It's a webtask(.io)

var util = require('util');

module.exports = function(ctx, cb) {
    var params = {};

    try {
        params = JSON.parse(decodeURIComponent(ctx.data.params));
    } catch (e) {
        return cb(e);
    }

    if (!ctx.data.SLACK_WEBHOOK_URL || !ctx.data.SLACK_CHANNEL_NAME) {
        return cb(new Error('"SLACK_WEBHOOK_URL" and "SLACK_CHANNEL_NAME" parameters required'));
    }

    if (!params.service || !params.members) {
        return cb(new Error('"service" and "members" parameters required'));
    }

    var SLACK_WEBHOOK_URL = ctx.data.SLACK_WEBHOOK_URL;
    var SLACK_CHANNEL_NAME = ctx.data.SLACK_CHANNEL_NAME;
    var slack = require('slack-notify')(SLACK_WEBHOOK_URL);
    var service = params.service;
    var members = params.members.join(', ');
    var messages = {
        tfa_disabled: util.format('Users without TFA on `%s` are %s', service, members)
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
