module.exports = {
    "extends": "standard",
    "plugins": [
        "standard",
        "promise",
        "jest"
    ],
    "env": {
        "jest/globals": true
    },
    "globals": {
        "requestAnimationFrame": 2
    }
};