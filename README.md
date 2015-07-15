# atom-standard-formatter

Atom package to format your Javascript using [Standard Style](https://github.com/feross/standard)
or [Semi-Standard Style](https://github.com/Flet/semistandard).

![](https://cloud.githubusercontent.com/assets/5852428/8020717/adbf10c0-0c51-11e5-8537-2714c9f698e5.gif)

### Usage

#### Keybindings

Use `ctrl-alt-f` to format the current Javascript file. If a text selection is made, only the selected text will be formatted.

#### Format On Save

Automatically format your Javascript file on save by enabling the *Format On Save* package setting.  This is off by default.

#### Menu

*Packages > standard-formatter > Format*

### Settings

#### formatOnSave (default: false)

Format Javascript files when saving.

#### checkStyleDevDependencies (default: false)

Check code style in package.json `devDependencies`. If a valid style is not found it won't format.

| Note: This will use the nearest package.json

#### style (default: standard)

Switch between standard and semi-standard styles. If `checkStyleDevDependencies` is `true` this setting will be ignored.

#### honorPackageConfig (default: true)

Don't auto-format files included in the package.json's `"ignore"` configuration for the detected style.

| Note: This will use the nearest package.json

### Formatting

This package uses [standard-format](https://github.com/maxogden/standard-format)
and [semistandard-format](https://github.com/ricardofbarros/semistandard-format) to handle the formatting.
Therefore, only the rules enforced in those packages will be applied.
