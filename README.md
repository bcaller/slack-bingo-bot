# slack-bingo-bot
Slack bot that listens for special words and shouts bingo when you say them. SlackathonMCR

A really simple unintelligent bot.
`/invite @bingo` invites the bingo bot to the channel.
![hello](https://raw.githubusercontent.com/bcaller/slack-bingo-bot/images-for-readme/hello.PNG)

To add words to the list, private message @bingo, but the user who adds the word is excluded from getting the bingo. `add banana reload "internet of things"`

![reload](https://raw.githubusercontent.com/bcaller/slack-bingo-bot/images-for-readme/reload.PNG)

The first time a key word like banana is used, @bingo will shout Bingo and show a GIF!

![spreadsheet](https://raw.githubusercontent.com/bcaller/slack-bingo-bot/images-for-readme/spreadsheet.PNG)

Relies on botkit. GIFs from giphy. Uses arrow functions, `let` and template strings, so use an appropriate Node version.

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
