module.exports = {
    "extends": "airbnb-base",
    "installedESLint": true,
    "plugins": [
        "import"
    ],
    "env": {
        "browser": true,
        "node": true
    },
    "rules": {
        "new-cap": [
            "error",
            {
                "newIsCapExceptions": ["webkitRTCPeerConnection"]
            }
        ]
    },
    "globals": {
        "webkitRTCPeerConnection": true
    }
};