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
    , foundWords = []
    , persistence = require('./persistence')
    , bot
    , controller = Botkit.slackbot({
        logLevel: 3
        //debug: true
        //include "log: false" to disable logging
        //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
    })

//---------------------------
// Global functions
//---------------------------

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

function attachmentGif(w) {
    return {
        fallback: `There was a GIF here: ${w.word}`,
        color: "#36a64f",
        image_url: w.gif
    }
}

function loadWords() {
    persistence.load(function(remainingWords, bingoedWords, err){
        if (err == undefined) {
            console.log('Loaded saved words successfully');
            foundWords = bingoedWords.filter(w => {
                w.regExp= makeRegex(w.word);
                return true;
            });
            words = remainingWords.filter(w => {
                w.regExp= makeRegex(w.word);
                return true;
            });
        } else {
            console.log("Load words from initial.txt");
            readFile('initial.txt', 'utf8').then(txt => {
                Promise.map(txt.split(/[\n\r]+/), w => addWord(w), {concurrency: 5})
            })
        }
    });
}

function exitHandler() {
    persistence.save(words, foundWords, function(err) {
        if (err) {
            throw err;
        } else {
            console.log('Wordlist and found words saved successfully.');
            process.exit(0);
        }
    });
    if (typeof  bot.destroy === 'function') {
        bot.destroy(bot);
    }
}

//---------------------------
// Event handler
//---------------------------

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

controller.hears(['hello', 'hi', 'introduce'], ['direct_message', 'direct_mention'], introduce)

controller.on('ambient', function ambient(bot, message) {
    if (message.type == 'message') {
        //search text for bingo word
        let found = []
        words = words.filter(w => {
            if (w.addedBy != message.user && w.regExp.test(message.text)) {
                found.push(w)

                return PERSIST_BINGO_WORDS
            }
            return true
        })

        var alreadyFound = foundWords.filter(fw => {
            if (fw.regExp.test(message.text)) {
                return true;
            }

            return false
        });

        if (found.length) {

            found.map(f => {
                foundWords.push({
                    word: f.word,
                    usr: message.user,
                    regExp: f.regExp
                })
            });

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

        if (alreadyFound.length) {
            let foundStr = joinAndCommas(alreadyFound.map(w => {
                if (w != undefined) {
                    return w.word
                }
            }));

            bot.reply(message, {
                username: 'bingo',
                text: `The following words were already bingoed: ${foundStr}`,
                icon_emoji: `:${emoji}:`
            })
        }
    }
})

controller.on('bot_channel_join', (b, d) => {
    introduce(b, d)
})

//---------------------------

//catches ctrl+c event
process.on('SIGINT', exitHandler);

// connect the bot to a stream of messages
controller.spawn({
    token: process.env.SLACK_TOKEN
}).startRTM((err, b, payload) => {
    if(err) throw err
    botUid = payload.self.id
    bot= b;
})

loadWords();