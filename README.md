# Backendless MFA monitoring

[![Build Status](https://travis-ci.org/radekk/webtask-mfa-monitor.svg?branch=master)](https://travis-ci.org/radekk/webtask-mfa-monitor)

Monitor your online applications without worrying about the hosting platform, bills, and servers. Run simple crontab task to oversee the actual state of the MFA (Multi-Factor Authentication) among different services like **Github**, **Google**, **Slack** and more.

![Slack alert](docs/images/slack.example.png)

## Requirements

- Node.JS (>= 5.0.0) and NPM installed
- Webtask CLI - [https://webtask.io/cli](https://webtask.io/cli)
- Webtask.io account (it's free) - [webtask.io](https://webtask.io)

## Update your current installation

If you have the MFA monitor already configured (``build/config.json`` file exists) then you can update both the webtask source code and the cron job in two simple steps:

```bash
git pull --rebase
npm run update
```

What it does is:

- Update the source code of all installed webtasks (notifiers and monitors).
- Reinstall cron job using the newest source code.

## Installing for the first time

The installation consists of two simple steps. The first one is the NPM dependency installation process and the second one is the MFA monitor configuration.


```bash
npm install
npm run start
```

## Configuration and update

Configuration process allows modifying settings for individual components without starting from scratch. Settings are stored inside `build` directory as `config.json` file.


Available commands are:

```
npm run start - fully automated process, configure, build, install

npm run build - build all tasks
npm run build:webtasks - build only webtasks

npm run configure - configure all tasks
npm run configure:cron - configure only cron settings
npm run configure:sandbox - configure sandbox settings
npm run configure:webtasks - configure webtasks settings

npm run install - install all
npm run install:cron - install scheduled webtask
```

![Configuration](docs/images/configuration.png)

## Compatibility

It works with every service with an API access to information about the MFA state for particular accounts. Feel free to create a new connector and share with people by sending the pull request.

## Architecture

This project leverages the quality of [webtask.io](https://webtask.io) platform created by [auth0](https://auth0.com/) which allows running Node.JS code inside an isolated environment. It is fast, secure, reliable and **FREE**.

![Architecture](docs/images/architecture.png)


## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
