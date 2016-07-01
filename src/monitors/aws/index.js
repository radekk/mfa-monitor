'use strict';

const assert = require('assert');
const AWS = require('aws-sdk');
const maxItems = 1000;
const usersPathPrefix = '/';
const passwordLastUsedDateField = 'PasswordLastUsed';
const Promise = require('bluebird').Promise;
const missingEntityCode = 'NoSuchEntity';

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
        resolve({userName: userName, isMFADevice: !!devices.MFADevices.length});
      })
  ));
  // If there is not login profile then skip this user
  const hasLoginProfile = (user =>
    new Promise((resolve, reject) =>
      iam.getLoginProfile({UserName: user.UserName}, (err, data) => {
        if (err && err.code !== missingEntityCode) return reject(err);
        resolve(!err && !!data.LoginProfile);
      })
    ));
  // Get users who logged at least once using password
  const hasLoggedInUsingPassword = (user =>
    !!(user.hasOwnProperty(passwordLastUsedDateField) && user[passwordLastUsedDateField]));

  iam.listUsers({MaxItems: maxItems, PathPrefix: usersPathPrefix}, (err, data) => {
    if (err) return cb(err);
    if (!data) return cb(new Error('API returned no data.'));

    Promise.resolve(data.Users
      .filter(hasLoggedInUsingPassword))
      .filter(hasLoginProfile)
      .map(user => user.UserName)
      .then(users => Promise.map(users, getUserMFADevices).then(users =>
        cb(null, users.filter(user => !user.isMFADevice).map(user => user.userName)))
      ).catch(err => cb(err));
  });
};
