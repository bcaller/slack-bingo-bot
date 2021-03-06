"use strict";

var Botkit = require('botkit')
    , giphy = require('./giphy')
    , joinAndCommas = require('./joinAndComma')
    , Promise = require('bluebird')
    , readFile = Promise.promisify(require("fs").readFile)
    , emoji = "boom"
    , react = require('./react')
    , noop = ()=>undefined
    , PERSIST_BINGO_WORDS = process.env.PERSIST_BINGO_WORDS && process.env.PERSIST_BINGO_WORDS != 0
    , botUid
    , words = []
    , controller = Botkit.slackbot({
        logLevel: 3
        //debug: true
        //include "log: false" to disable logging
        //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
    })

controller.on('file_shared', () => {
    console.log('file shared!', arguments)
})

// connect the bot to a stream of messages
controller.spawn({
    token: process.env.SLACK_TOKEN
}).startRTM((err, bot, payload) => {
    if(err) throw err
    botUid = payload.self.id
})

readFile('initial.txt', 'utf8').then(txt => {
    Promise.map(txt.split(/[\n\r]+/), w => addWord(w), {concurrency: 5})
})

function safeRegex(s) {
    //  . [ ] \ * + { } ? -
    return s.replace(/[\.\[\]\\*+{}?\-]/g, x => '\\' + x)
}

// hit matches hittings hitters hitting hitter hitted hited hiting hiter hiters hitings
function makeRegex(s) {
    if(/^\w.*\w$/i.test(s))
        return new RegExp(`\\b${safeRegex(s)}${safeRegex(s[s.length-1])}?(ings?|ers?|ed|s)?\\b`, "i")
    //Also work with :cow:
    let beginWordBreak = /^\b/.test(s) ? "\\b" : ""
    let endWordBreak = /\b$/.test(s) ? "\\b" : ""
    return new RegExp(beginWordBreak + safeRegex(s) + endWordBreak, "i")
}

function addWord(toAdd, addedBy) {
    toAdd = toAdd.trim().toLowerCase()
        .replace(/(^"|"$)/g, '') //Surrounding quotes
        .replace(/(,|;)\s/g, '') //Separators
    //Check for duplicates
    for (let w of words) {
        if (w.word == toAdd)
            return false
    }
    console.log("Adding", toAdd)
    let word = {
        word: toAdd,
        regExp: makeRegex(toAdd),
        addedBy: addedBy
    }
    words.push(word)
    return giphy.randomRetryFirstWord(word.word).then(data => {
        if(data.fixed_height_downsampled_url) {
            word.gif = data.fixed_height_downsampled_url
        }
    }).catch(noop)
}

controller.hears('add', ['direct_message'], (bot, message) => {
    //We need to extract single words and quoted words
    message.text.match(/(?:"([^"]+)"|([^"\s]+))/g).splice(1).forEach(w => {
        if (addWord(w, message.user)) {
            bot.reply(message, {
                text:'Added ' + w,
                icon_emoji: `:${emoji}:`
            });
            react(bot, 'thumbsup', message, noop)
        }
    })
})

controller.hears('cheat', ['direct_message'], (bot, message) => {
    react(bot, 'wink', message, noop)
    bot.reply(message, words.map(w => w.word).join(', '))
})

function introduce(bot, message) {
    react(bot, 'thumbsup', message, noop)
    bot.reply(message, {
        text: 'Let\'s play BINGO:exclamation: Be the first to send any of my secret magic words and win:trophy:\n' +
        `Suggest secret words by sending <@${botUid}> a private message:love_letter: starting with *add*\n` +
        'e.g. `add :cake: "big data" landslide` to add :cake:, landslide and big data as bingo words',
        icon_emoji: `:${emoji}:`,
        username: 'bingo'
    });
}

controller.hears(['hello', 'hi', 'introduce'], ['direct_message', 'direct_mention'], introduce)

function attachmentGif(w) {
    return {
        fallback: `There was a GIF here: ${w.word}`,
        color: "#36a64f",
        image_url: w.gif
    }
}

controller.on('ambient', function ambient(bot, message) {
    if (message.type == 'message') {
        //search text for bingo word
        let found = []
        words = words.filter(w => {
            if (w.addedBy != message.user && w.regExp.test(message.text)) {
                found.push(w)

                // Perhaps it is actually too annoying to send a private message as well
                if(w.addedBy && w.addedBy.length) {
                    bot.startPrivateConversation({user: w.addedBy}, (err, convo) => {
                        if(err || !convo) return;
                        var attachments = w.gif ? [attachmentGif(w)] : []
                        convo.say({
                            text: `Your bingo ${w.word} was bingoed by <@${message.user}>!\n${message.text}`,
                            attachments: attachments,
                            icon_emoji: `:${emoji}:`
                        })
                    })
                }

                return PERSIST_BINGO_WORDS
            }
            return true
        })
        if (found.length) {
            let foundStr = joinAndCommas(found.map(w => w.word))
            react(bot, emoji, message, noop)
            let poser = found.map(w => w.addedBy ? `<@${w.addedBy}>` : '').join(' ')
            bot.reply(message, {
                username: 'bingo',
                text: `Bingo! <@${message.user}> said ${foundStr}! There are ${words.length || "no"} bingo words left to discover! ${poser}`,
                icon_emoji: `:${emoji}:`,
                attachments: found.filter(w => w.gif).map(attachmentGif)
            })
        }
    }
})

controller.on('bot_channel_join', (b, d) => {
    introduce(b, d)
})