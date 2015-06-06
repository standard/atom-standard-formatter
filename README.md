# atom-standard-formatter

Atom package to format your JS using [Javascript Standard Style](https://github.com/feross/standard).

![](https://cloud.githubusercontent.com/assets/5852428/8020717/adbf10c0-0c51-11e5-8537-2714c9f698e5.gif)

### Usage

#### Keybindings

Use `ctrl-alt-f` to format the current Javascript file.

#### Format On Save

Automatically format your Javascript file on save by enabling the *Format On Save* package setting.  This is off by default.

#### Command Pallette

`cmd-shift-p` and then search for `Standard Formatter: Format`

### Formatting

This package uses [standard-format](https://github.com/maxogden/standard-format) to handle the formatting.
Therefore, only the rules enforced in that package will be applied. [Details](https://www.npmjs.com/package/standard#is-there-an-automatic-formatter)
