module.exports = function(regex) {
    return function(body) {
        if (regex.test(body)) {
            return body.match(regex)[1];
        }
        else {
            return null;
        }
    }
};