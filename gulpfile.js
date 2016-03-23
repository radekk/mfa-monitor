/**
 * @TODO
 *
 * [ ] split gulp into smaller tasks
 */
var async = require('async');
var gulp = require('gulp');
var data = require('gulp-data');
var glob = require('glob');
var util = require('util');
var mkdirp = require('mkdirp');
var fs = require('fs');
var inquirer = require('inquirer');
var runSequence = require('run-sequence');

gulp.task('default', function() {
  gulp.start('configure');
});

gulp.task('configure', function(done) {
  function getWebtasksNames(path) {
    return glob.sync(path).map(path => path.split('/')[3]);
  }

  function getConfigFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return (new Error('Configuration file not found: ' + filePath));
    }

    return require(filePath);
  }

  function getWebtaskConfigSettingsFromUser(webtaskName, config, cb) {
    inquirer.prompt(config.map(function(input) {
      return {
        type: input.type,
        name: input.name,
        message: util.format('[%s] Set value for "%s" parameter:', webtaskName, input.name)
      };
    }), function(answers) {
      cb(answers);
    });
  }

  function getWebtaskConfigParams(webtaskName, type, cb) {
    var type = type || 'monitors';
    var webtaskConfigFile = './src/' + type + '/' + webtaskName + '/config.json';
    var configBuildPath = './build/' + type + '/' + webtaskName;
    var config = getConfigFile(webtaskConfigFile);

    getWebtaskConfigSettingsFromUser(webtaskName, config, function(settings) {
      mkdirp(configBuildPath, function(err) {
        if (err) return cb(err);

        fs.writeFile(configBuildPath + '/config.json', JSON.stringify(settings), function(err) {
          if (err) return cb(err);

          cb();
        });
      });
    });
  }

  var monitorsDir = './src/monitors/*/webtask.js';
  var notifiersDir = './src/notifiers/*/webtask.js';

  var notifiers = getWebtasksNames(notifiersDir);
  var monitors  = getWebtasksNames(monitorsDir);

  var questions = [
    {
      // @TODO implement and allow to select more than one notifier
      type: 'list',
      name: 'webtask_notifier',
      message: 'Where do you want to send your alerts?',
      choices: notifiers
    },
    {
      type: 'checkbox',
      name: 'webtask_monitors',
      message: 'Which services do you want to monitor?',
      choices: monitors
    }
  ];

  inquirer.prompt(questions, function(answers) {
    if (!answers.webtask_notifier || !answers.webtask_monitors.length) return done();

    // @TODO allow to select multiple notifiers - requires a code rewrite
    async.eachSeries(
      [{
        type: 'notifiers',
        webtasks: [answers.webtask_notifier]
       },
       {
        type: 'monitors',
        webtasks: answers.webtask_monitors
       }
      ],
      function(data, cb) {
        getWebtaskConfigParams(data.webtasks, data.type, cb);
      },
      function(err) {
        if (err) return (new Error('Configuration process failed: ' + err ));
      }
    );
  });
});

gulp.task('build', function(done) {
  runSequence('clean', 'setup-webtasks', 'templates', 'setup-cron', done);
});

gulp.task('setup-webtasks', function(done)) {
  done();
});

gulp.task('clean', function(done) {
  done();
});

gulp.task('templates', function(done) {
  var swig = require('gulp-swig');
  var configFile = './build/config.json';
  var tplFile = './src/templates/scheduler.tpl';
  var opts = {
    ext: '.js'
  };

  if (!fs.existsSync(configFile)) {
    return done(new Error('Configuration file not found. Run "configure" task first.'));
  }

  gulp.src(tplFile)
      .pipe(data(function() {
        return require(configFile);
      }))
      .pipe(swig(opts))
      .pipe(gulp.dest(buildDir));
});

