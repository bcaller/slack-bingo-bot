/**
 * Created by Ben on 07/02/2016.
 */
"use strict";

//message just requires channel and ts (timestamp)
module.exports = function (bot, emoji, message, cb) {
    bot.api.reactions.add({
        name: emoji,
        channel: message.channel,
        timestamp: message.ts
    }, function(err) {
        if(err) {
            console.error(err)
            return cb(err)
        }
        cb(null)
    })
}