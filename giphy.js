/**
 * Created by Ben on 07/02/2016.
 */
"use strict";
var request = require('request-promise')

function callApi(api, qs) {
    return request(`http://api.giphy.com/v1/gifs/${api}?api_key=dc6zaTOxFJmzC&${qs}`).then(body => {
        var data = JSON.parse(body)
        if (data.meta && data.meta.status == 200 && data.data)
            return data.data
        else
            throw new Error("Response meta status was: " + (data.meta && data.meta.status))
    })
}

function searchGifs(q) {
    return callApi('search', `q=${q}`)
}

function randomGif(q) {
    return callApi('random', `tag=${q}`)
}

function retryFirstWord(f) {
    return (q) =>
        f(q).then(data => {
            if (data.length || data.fixed_height_downsampled_url)
                return data
            if (q.indexOf(' ') > 3) {
                // If growth hack returns no results, try growth
                var firstWord = q.substring(0, q.indexOf(' '))
                return f(firstWord)
            }
        })
}


module.exports = {
    search: searchGifs,
    searchRetryFirstWord: retryFirstWord(searchGifs),
    random: randomGif,
    randomRetryFirstWord: retryFirstWord(randomGif)
}