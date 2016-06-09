'use strict';

const assert = require('assert');
const AWS = require('aws-sdk');
const maxItems = 1000;
const usersPathPrefix = '/';
const passwordLastUsedDateField = 'PasswordLastUsed';
const Promise = require('bluebird').Promise;

/**
 * @param {secret} ACCESS_KEY_ID     - Amazon access key id
 * @param {secret} SECRET_ACCESS_KEY - Amazon secret access key
 * @return JSON ['john', 'mark']
 */
module.exports = (ctx, cb) => {
  assert(ctx.secrets, 'Secrets not set!');
  assert(ctx.secrets.ACCESS_KEY_ID, 'ACCESS_KEY_ID not set!');
  assert(ctx.secrets.SECRET_ACCESS_KEY, 'SECRET_ACCESS_KEY not set!');

  AWS.config.update({
    accessKeyId: ctx.secrets.ACCESS_KEY_ID,
    secretAccessKey: ctx.secrets.SECRET_ACCESS_KEY
  });

  const iam = new AWS.IAM();
  const getUserMFADevices = (userName =>
    new Promise((resolve, reject) =>
      iam.listMFADevices({MaxItems: maxItems, UserName: userName}, (err, devices) => {
        if (err) return reject(err);
        resolve({user: userName, isMFADevice: !!devices.MFADevices.length});
      })
  ));

  new Promise((resolve, reject) =>
    iam.listUsers({MaxItems: maxItems, PathPrefix: usersPathPrefix}, (err, data) => {
      if (err) return reject(err);
      resolve(data.Users.filter(user => !!user[passwordLastUsedDateField]));
    })
  ).then(users =>
    Promise.all(users.map(user => user.UserName).map(getUserMFADevices)).then(data =>
      cb(null, data.filter(user => !user.isMFADevice).map(row => row.user)))
  ).catch(err => cb(err));
};
