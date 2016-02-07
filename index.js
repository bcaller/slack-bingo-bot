"use strict";

var Botkit = require('botkit');
var request = require('request')

var controller = Botkit.slackbot({
    debug: true
    //include "log: false" to disable logging
    //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});

controller.on('file_shared', () => {
    console.log('fs', arguments)
})

// connect the bot to a stream of messages
controller.spawn({
    token: process.env.SLACK_TOKEN
}).startRTM()

var words = []

var initalData = ["banana", "big data", "horse", "gantt chart", "pivot", "spreadsheet", "high throughput", "pineapple"]
initalData.forEach(addWord)

function addWord(toAdd, addedBy) {
    toAdd = toAdd.toLowerCase().replace(/(^"|"$)/g, '')
    //Check for duplicates
    for (var w of words) {
        if (w.word == toAdd)
            return false
    }
    var word = {
        word: toAdd,
        regExp: new RegExp("\\b" + toAdd + "s?\\b", "i"),
        addedBy: addedBy
    }
    words.push(word)

    request(`http://api.giphy.com/v1/gifs/search?q=${word.word}&api_key=dc6zaTOxFJmzC`, (err, response, body) => {
        try {
            if (!err && response.statusCode == 200) {
                var data = JSON.parse(body)
                if (data.data.length > 0)
                    word.gif = data.data[Math.floor(data.data.length * Math.random())].images.original.url
            }
        } catch (err) {
            console.error("The giphy API has changed I think", err)
        }
    })

    return true
}

// give the bot something to listen for.
controller.hears('add', ['direct_message'], (bot, message) => {
    message.text.match(/(?:"(.*?)"|([^"\s]+))/g).splice(1).forEach(function (w) {
        if (addWord(w, message.user)) {
            bot.reply(message, 'Added ' + w);
        }
    })
});

controller.hears('cheat', ['direct_message'], (bot, message) => {
    bot.reply(message, words.map(w => w.word).join(', '))
});

controller.hears(['hello', 'hi', 'introduce'], ['direct_message', 'direct_mention'], function (bot, message) {
    bot.reply(message, 'Send me a private message starting with "add" e.g.: add XYZ "big data" to add "XYZ" and "big data" to bingo');
});

controller.on('ambient', function (bot, message) {

    if (message.type == 'message') {
        //search text for bingo word
        var found = []
        var foundStr = "";
        words = words.filter((w) => {
            if (w.addedBy != message.user && w.regExp.test(message.text)) {
                found.push(w)
                // we want and and commas as separators
                if (found.length == 1)
                    foundStr = w.word
                else if (found.length == 2)
                    foundStr = w.word + " and " + foundStr
                else
                    foundStr = w.word + ", " + foundStr

                if(w.addedBy && w.addedBy.length) {
                    bot.startPrivateConversation({user: w.addedBy}, (err, convo) => {
                        if(err || !convo) return;
                        convo.say({
                            text: `Your bingo was bingoed by <@${message.user}>! ${message.text}`,
                            attachments: w.gif ? [{
                                fallback: `There was a GIF here: ${w.word}`,
                                color: "#36a64f",
                                image_url: w.gif
                            }] : []
                        });
                    })
                }

                return false
            }
            return true
        })
        if (found.length) {
            bot.reply(message, {
                username: 'bingo',
                text: `Bingo! <@${message.user}> said ${foundStr}! There are ${words.length || "no"} bingo words left to find!`,
                icon_emoji: ":collision:",
                attachments: found.filter(function (w) {
                    return w.gif
                }).map(function (w) {
                    return {
                        fallback: `There was a GIF here: ${w.word}`,
                        color: "#36a64f",
                        image_url: w.gif
                    }
                })
            });
        }
        console.log(message)
    }

});

controller.on('slash_command', function (bot, message) {

    // reply to slash command
    bot.replyPublic(message, 'Everyone can see the results of this slash command ' + JSON.stringify(message));

});