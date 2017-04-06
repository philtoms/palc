module.exports = {
    "extends": ["standard",  "plugin:react/recommended"],
    "plugins": [
        "standard",
        "promise",
        "react",
        "jest"
    ],
    "env": {
        "jest/globals": true
    },
    "parser": "babel-eslint",
    "parserOptions": {
        "ecmaVersion": 6,
        "ecmaFeatures": {
            "jsx": true,
            "experimentalObjectRestSpread": true
        }
    },
    "globals": {
        "requestAnimationFrame": 2
    }
};