/**
 * Created by Ben on 07/02/2016.
 */
"use strict";
module.exports = arr => {
    let len = arr.length
    if(len < 3) return arr.join(" and ")
    arr[len - 2] = arr[len - 2] + " and " + arr[len - 1]
    arr.pop()
    return arr.join(", ")
}