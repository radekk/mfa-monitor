'use strict';

const chai = require('chai');
const expect = chai.expect;
const fixtures = require('./fixtures.json');
const proxy = require('proxyquire').noCallThru();
const spies = require('chai-spies');
const _ = require('lodash');

// Arrow function doesn't have a prototype nor constructor, using function.
describe('Monitors', () => {
  before(() => chai.use(spies));

  const context = fixtures.context;
  const getMonitorProxy = (data) => proxy('src/monitors/aws', {
    'aws-sdk': {
      config: {
        update: () => {}
      },
      IAM: function() {
        let extendedFixtures = _.extend(_.clone(fixtures), data);
        return {
          listUsers: (data, cb) => cb(
            extendedFixtures.api_list_users_cb || null,
            extendedFixtures.api_list_users),

          listMFADevices: (data, cb) => cb(
            extendedFixtures.api_list_mfa_devices_cb || null,
            extendedFixtures.api_list_mfa_devices[data.UserName]),

          getLoginProfile: (data, cb) => cb(
            extendedFixtures.api_get_login_profile_cb || null,
            extendedFixtures.api_get_login_profile[data.UserName])
        };
      }
    }
  });

  describe('AWS', () => {
    it('should return account names with disabled MFA', (done) => {
      const monitor = getMonitorProxy();
      const cb = (err, res) => {
        expect(err).to.be.null;
        expect(res).to.be.an('array');
        expect(res).to.be.eql(['mark']);
        done();
      };
      const spy = chai.spy(cb);
      monitor(context, spy);
    });

    it('should return an empty array when accounts without MFA were not found', (done) => {
      const monitor = getMonitorProxy({
        api_list_mfa_devices: fixtures.api_list_mfa_devices_all_enabled
      });
      const cb = (err, res) => {
        expect(err).to.be.null;
        expect(res).to.be.an('array');
        expect(res).to.have.length(0);
        done();
      };
      const spy = chai.spy(cb);
      monitor(context, spy);
    });

    it('should throw an error if empty response from API was received', (done) => {
      const monitor = getMonitorProxy({
        api_list_users: null
      });
      const cb = (err, res) => {
        expect(err).to.be.not.null;
        done();
      };
      const spy = chai.spy(cb);
      monitor(context, spy);
    });

    it('should skip users without Login Profile - no password was set', (done) => {
      const monitor = getMonitorProxy({
        api_list_users: fixtures.api_list_users_ver_2,
        api_get_login_profile: fixtures.api_get_login_profile_ver_2
      });
      const cb = (err, res) => {
        expect(err).to.be.null;
        expect(res).to.be.an('array');
        expect(res).to.be.eql(['michael']);
        done();
      };
      const spy = chai.spy(cb);
      monitor(context, spy);
    });

    it('should skip users where PasswordLastUsed is not set', (done) => {
      const monitor = getMonitorProxy();
      const cb = (err, res) => {
        expect(err).to.be.null;
        expect(res).to.be.an('array');
        expect(res).to.be.eql(['mark']);
        done();
      };
      const spy = chai.spy(cb);
      monitor(context, spy);
    });

    it('should fail when listing MFA devices returned an error', (done) => {
      const errorMessage = 'Failed to get MFA devices';
      const monitor = getMonitorProxy({
        api_list_mfa_devices_cb: new Error(errorMessage)
      });
      const cb = (err, res) => {
        expect(err).to.be.an('error');
        expect(err.message).to.be.eql(errorMessage);
        done();
      };
      const spy = chai.spy(cb);
      monitor(context, spy);
    });

    it('should fail when fetching the login profile returned an error', (done) => {
      const errorMessage = 'Failed to fetch login profile';
      const monitor = getMonitorProxy({
        api_get_login_profile_cb: new Error(errorMessage)
      });
      const cb = (err, res) => {
        expect(err).to.be.an('error');
        expect(err.message).to.be.eql(errorMessage);
        done();
      };
      const spy = chai.spy(cb);
      monitor(context, spy);
    });

    it('should fail when action that list users returned an error', (done) => {
      const errorMessage = 'Failed to list users';
      const monitor = getMonitorProxy({
        api_list_users_cb: new Error(errorMessage)
      });
      const cb = (err, res) => {
        expect(err).to.be.an('error');
        expect(err.message).to.be.eql(errorMessage);
        done();
      };
      const spy = chai.spy(cb);
      monitor(context, spy);
    });
  })
});
