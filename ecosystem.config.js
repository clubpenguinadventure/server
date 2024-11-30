const fs = require('fs');

let config;
if (fs.existsSync('./config/config.json')) {
    config = JSON.parse(fs.readFileSync('./config/config.json'));
} else {
    config = process.env;
}

let apps = [
    {
        name: config.WORLD_ID,
        script: './dist/World.js',
        args: config.WORLD_ID
    }
]

module.exports = {
    apps: apps
}
