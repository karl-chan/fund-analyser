module.exports = {
    "extends": "standard",
    "plugins": [
        "standard",
        "promise"
    ],
    "env": {
        "node": true,
        "jest": true
    },
    "rules": {
        "indent":  ["error", 4, { "SwitchCase": 1 }],
        "quotes": ["error", "single", { "allowTemplateLiterals": true }]
    }
};