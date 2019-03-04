#!/usr/bin/env node

const fs = require('fs');
const glob = require('glob');
const request = require('request-promise-native');
const prompt = require('prompt');
const xmldoc = require('xmldoc');

const PATH_TO_SEARCH = '../twemoji-color-font/assets/twemoji-svg/';
const SERVER = 'http://localhost:5000';

// Parse emoji json
const emojiJson = JSON.parse(fs.readFileSync('emoji_pretty.json'));

const emojiMap = {};
for (const emoji of emojiJson) {
    let name = '';

    if (emoji.name) {
        name += emoji.name.toLowerCase().replace(/ /g, '_');
    }

    if (emoji.short_name) {
        const fixed = emoji.short_name.toLowerCase();
        if (name.indexOf(fixed) === -1) {
            name += (name ? '_' : '') + fixed;
        }
    }

    for (const shn of emoji.short_names) {
        const fixed = emoji.short_name.toLowerCase();
        if (name.indexOf(fixed) === -1) {
            name += (name ? '_' : '') + fixed;
        }
    }

    if (emoji.non_qualified) {
        const code = emoji.non_qualified.replace(/^0+/, '').toLowerCase();
        emojiMap[code] = name;
    }

    if (emoji.unified) {
        const code = emoji.unified.replace(/^0+/, '').toLowerCase();
        emojiMap[code] = name;
    }

    for (const svKey in emoji.skin_variations) {
        const sv = emoji.skin_variations[svKey];

        if (sv.non_qualified) {
            const code = sv.non_qualified.replace(/^0+/, '').toLowerCase();
            emojiMap[code] = name + '_' + svKey;
        }

        if (sv.unified) {
            const code = sv.unified.replace(/^0+/, '').toLowerCase();
            emojiMap[code] = name + '_' + svKey;
        }
    }
}

const emojiJson2 = JSON.parse(fs.readFileSync('emoji.json'));
for (const emoji of emojiJson2) {
    let code = emoji.codes.replace(/ /g, '-').toLowerCase();
    if (!(code in emojiMap)) {
        emojiMap[code] = emoji.name.replace(/ /g, '_');
    }
}

// Scan twitter emojis

prompt.override = require('yargs').argv;
prompt.start();

var schema = {
    properties: {
        name: {
            pattern: /^[a-zA-Z\s\-]+$/,
            message: 'Name must be only letters, spaces, or dashes',
            required: true,
            default: 'dalius',
        },
        password: {
            hidden: true,
        },
        server: {
            message: 'Server to upload icons to',
            required: true,
            default: SERVER,
        },
    },
};

prompt.get(schema, function(err, result) {
    uploadImages(result.name, result.password, result.server);
});

const uploadImages = async (username, password, server) => {
    const svgs = glob.sync(PATH_TO_SEARCH + '*.svg');
    let accessToken = null;

    try {
        const form = {
            username,
            password,
        };

        const resp = await request.post({ url: `${server}/api/tokens`, form, json: true });
        accessToken = resp['accessToken'];
    } catch (err) {
        console.error('Upload failed:', err);
        return;
    }

    if (accessToken === undefined) {
        console.error('Token is undefined.');
        return;
    }

    let found = 0;
    let notFound = 0;

    for (const image of svgs) {
        let name = image.substring(PATH_TO_SEARCH.length).replace(/\//g, ' ');
        name = name.replace('.svg', '');

        if (!(name in emojiMap)) {
            console.log(`${name} not found in emoji map.`);
            notFound++;
        } else {
            found++;
            const emojiName = emojiMap[name];
            console.log(`Processing ${name} ${emojiName}.`);

            const svg_data = fs.readFileSync(image, 'utf8');

            try {
                const formData = {
                    global: 'true',
                    name: `twitter_${emojiName}`,
                    metadata: JSON.stringify({ source: 'twemoji' }),
                    image: {
                        value: svg_data,
                        options: {
                            filename: name + '.svg',
                        },
                    },
                };
                const headers = {
                    Authorization: `Bearer ${accessToken}`,
                };
                const resp = await request.post({ url: `${server}/api/images`, headers, formData });
                console.log(resp);
            } catch (err) {
                console.error('Upload failed:', err.statusCode);
            }
        }
    }
    console.log(`Found emojis ${found}. Not found ${notFound}`);
};
