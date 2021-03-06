#!/usr/bin/env node

const fs = require('fs');
const glob = require('glob');
const request = require('request-promise-native');
const prompt = require('prompt');

const PATH_TO_SEARCH = 'forms/';
const SERVER = 'http://localhost:5000';

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

    for (const image of svgs) {
        let name = image.substring(PATH_TO_SEARCH.length).replace(/\//g, ' ');
        name = name.replace('.svg', '');

        console.log(`Processing ${name}.`);

        const svg_data = fs.readFileSync(image, 'utf8');

        try {
            const formData = {
                global: 'true',
                name: `forms_${name}`,
                metadata: JSON.stringify({ source: 'forms' }),
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
};
