# slack-bingo-bot
Slack bot that listens for special words and shouts bingo when you say them. SlackathonMCR

A really simple unintelligent bot.
`/invite @bingo` invites the bingo bot to the channel.
The first time a key word like banana is used, @bingo will shout Bingo and show a GIF!

To add words to the list, private message @bingo. `add banana`

Relies on botkit. GIFs from giphy.

Uses arrow functions, let and template strings because I love arrow functions.

# Integration
## Slack Settings
Custom integrations > Bots > ... > Get a token.
## Install
`git clone https://github.com/bcaller/slack-bingo-bot.git && cd slack-bingo-bot`

`npm install`

`SLACK_TOKEN=x...X npm start` or set the `SLACK_TOKEN` environment variable and run `npm start`

You can change the starting words in initial.txt
## In Slack
`/invite @bingo` invites the bingo bot to the channel.
