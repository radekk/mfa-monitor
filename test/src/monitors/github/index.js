'use strict';

const chai = require('chai');
const expect = chai.expect;
const fixtures = require('./fixtures.json');
const proxy = require('proxyquire').noCallThru();
const spies = require('chai-spies');

// Arrow function doesn't have a prototype nor constructor, using function.
describe('Monitors', () => {
  before(() => chai.use(spies));

  const context = fixtures.context;
  const getMonitorProxy = (resp, err) => proxy('src/monitors/github', {
    github: function() {
      return {
        authenticate: () => {},
        orgs: {
          getMembers: (config, cb) => cb(err || null, resp)
        }
      };
    }
  });

  describe('GitHub', () => {
    it('should return account names with disabled 2fa', () => {
      const monitor = getMonitorProxy(fixtures.valid_accounts);
      const cb = (err, res) => {
        expect(err).to.be.null;
        expect(res).to.be.an('array');
        expect(res).to.be.eql(['octocat', 'johndoe']);
      };
      const spy = chai.spy(cb);

      monitor(context, spy);
      chai.expect(spy).to.be.called(1);
    });

    it('should return an empty array when accounts without 2f were not found', () => {
      const monitor = getMonitorProxy(fixtures.no_accounts);
      const cb = (err, res) => {
        expect(err).to.be.null;
        expect(res).to.be.an('array');
        expect(res).to.have.length(0);
      };
      const spy = chai.spy(cb);

      monitor(context, spy);
      chai.expect(spy).to.be.called(1);
    });

    it('should return an error if empty response from API was received', () => {
      const monitor = getMonitorProxy(fixtures.invalid_response);
      const cb = (err, res) => {
        expect(err).to.be.an('error');
      };
      const spy = chai.spy(cb);

      monitor(context, spy);
      chai.expect(spy).to.be.called(1);
    });

    it('should return an error when listing organization members failed', () => {
      const errorMessage = 'Listing users failed';
      const monitor = getMonitorProxy([], new Error(errorMessage));
      const cb = (err, res) => {
        expect(err).to.be.an('error');
        expect(err.message).to.be.eql(errorMessage);
      };
      const spy = chai.spy(cb);

      monitor(context, spy);
      chai.expect(spy).to.be.called(1);
    });
  })
});
