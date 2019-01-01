#!/usr/bin/env python3

import json

def main():
    fonts = json.load(open('googlefonts.json'))

    forcards = {}

    for item in fonts['items']:
        forcards[item['family']] = item['files']

    json.dump(forcards, open('webfonts.json', 'w'), indent=4)


if __name__ == '__main__':
    main()
