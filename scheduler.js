'use strict';

var _           = require('lodash');
var async       = require('async');
var MongoClient = require('mongodb').MongoClient;
var request     = require('request');
var webtasks    = [{
    name : 'GitHub',
    url  : 'https://webtask.it.auth0.com/api/run/...',
    token: '...'
}
];

function sendPostRequest(url, data, headers, cb) {
    // Sending JSON type to webtask returns JSON object as a response
    request({
        method: 'POST',
        url: url,
        json: data || {},
        headers: headers
    }, function(err, res, body) {
        cb(err, res, body);
    });
}

function dispatchWebtask(webtask, cb) {
    sendPostRequest(
        webtask.url,
        null,
        {Authorization: 'Bearer ' + webtask.token},
        function(err, res, body) {
            if (err) return cb(err);
            var result = {
                service: webtask.name || '',
                members: body || []
            };

            cb(err, result);
        }
    );
}

function pushNotification(rtmUrl, rtmToken, result, cb) {
    // Send services notifications separately
    async.map(result, function(service, done) {
        if (!service.members.length) return done();

        sendPostRequest(rtmUrl, service, {
            Authorization: 'Bearer ' + rtmToken
        }, function(err, res, body) {
            done(err);
        });
    }, function(err) {
        cb(err);
    });
}

function getAuditedUsers(db, collectionName, cb) {
    db.collection(collectionName).find().toArray(function(err, docs) {
        cb(err, docs);
    });
}

function removeUsersWithEnabledTFA(collection, members, cb) {
    if (!collection || !members.length) return cb();

    collection.findAndRemove({username: {
        '$in': members
    }}, function(err, doc) {
        // @todo send notification when someone enabled TFA
        cb(err, doc);
    })
}

function addUsersWithDisabledTFA(collection, members, cb) {
    return cb();
    if (!collection || !members.length) return cb();

    var data = members.map(function(member) {
        return {
            _id: null,
            is_tfa: false,
            username: member
        };
    });

    collection.insertMany(data, function(err, docs) {
        cb(err, docs);
    });
}

function detectTFAuthState(db, result, cb) {
    var authState = [];

    async.map(result, function(service, done) {
        var appname = service.service;
        var members = service.members;

        getAuditedUsers(db, appname, function(err, docs) {
            if (!members || !members.length) return done();

            var serviceUsers = members.map(member => member.username.toLowerCase());
            var auditedUsers = docs.map(member => member.username.toLowerCase());
            var collection = db.collection(appname);
            // We have users who enabled TFA, remove them from the collection
            var diffA = _.difference(auditedUsers, serviceUsers);
            // New users with disabled TFA, add them to the collection
            var diffB = _.difference(serviceUsers, auditedUsers);

            authState.push({service: appname, members: diffB});

            removeUsersWithEnabledTFA(collection, diffA, function(err, doc) {
                addUsersWithDisabledTFA(collection, diffB, done);
            });
        });
    }, function(err) {
        if (err) return cb(err);
        cb(null, authState);
    });
}

/**
 * @param {secret} MONGO_URL         - MongoDB connection string
 * @param {secret} RTM_WEBTASK_URL   - Real Time Messaging webtask
 * @param {secret} RTM_WEBTASK_TOKEN - Real Time Messaging webtask token
 */
 function main(ctx, cb) {
    var MONGO_URL = ctx.secrets.MONGO_URL;
    var RTM_URL   = ctx.secrets.RTM_WEBTASK_URL;
    var RTM_TOKEN = ctx.secrets.RTM_WEBTASK_TOKEN;
    var dbHandler = null;

    async.waterfall([
        function dispatch(done) {
            if (!webtasks || !webtasks.length) done(new Error('Missing webtasks'));

            async.map(webtasks, dispatchWebtask, function(err, members) {
                if (err) return done(err);

                done(null, members);
            });
        },

        function dbConnect(members, done) {
            if (!MONGO_URL) return done(new Error('MONGO_URL secret is missing'));

            MongoClient.connect(MONGO_URL, function(err, db) {
                if (err) return done(err);

                dbHandler = db;
                done(null, db, members);
            });
        },

        detectTFAuthState,

        function notify(members, done) {
            pushNotification(RTM_URL, RTM_TOKEN, members, done);
        },

        function unload(done) {
            if (dbHandler) dbHandler.close();
            done();
        }
    ], cb);
};

module.exports = main;
