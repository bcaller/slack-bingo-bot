"use strict";

var fs = require('fs')
    , fileName = 'save.json';

function save(remainingWords, bingoedWords, callback) {
    var out = {
        remainingWords: remainingWords,
        bingoedWords: bingoedWords
    };

    fs.writeFile(fileName, JSON.stringify(out), (err) => {
        if (typeof callback === 'function') {
            callback(err);
        }
    });
}

function load(callback) {
    fs.readFile(fileName, 'utf8', function (err, data) {
        if (err) {
            if ( typeof callback === 'function') {
                callback(undefined, undefined, err);
                return;
            }
        }

        var read;
        read = JSON.parse(data);

        if ( typeof callback === 'function') {
            callback(read.remainingWords, read.bingoedWords, undefined);
        }
    });
}

module.exports = {
    save: save,
    load: load
};