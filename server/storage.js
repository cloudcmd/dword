'use strict'

module.exports = function storage() {
    let value;
    return (data) => {
        if (data)
            value = data;
        else
            return value;
    };
}

