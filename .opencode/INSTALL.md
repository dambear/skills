# Installing Chris Banes Skills for OpenCode V2

## Prerequisites

- OpenCode V2

## Installation

Add the pinned plugin to the V2 `plugins` array in `opencode.json` or
`opencode.jsonc`:

```json
{
  "plugins": [
    {
      "package": "chrisbanes-skills@git+https://github.com/dambear/skills.git#2026.9.2-opencode-v2.2",
      "options": {
        "injectGuidance": false
      }
    }
  ]
}
```

Restart OpenCode after changing plugin configuration. The plugin registers the
packaged skill directories through OpenCode V2's skill registry.

Set `injectGuidance` to `true` only when the plugin should add its generic skill
routing guidance to model context. Projects with their own routing policy should
leave it `false`.

## Verify

Confirm that `chrisbanes-skills` appears in OpenCode's active plugin inventory,
then use the native skill tool to load a focused skill such as
`compose-state-and-effects`.

## Updating

Pin an immutable tag or commit. Review upstream skill changes and rerun the
plugin tests before updating the pin.

## Troubleshooting

If the plugin does not load:

1. Verify that the configuration uses the V2 `plugins` field.
2. Check the OpenCode service logs for `chrisbanes-skills`.
3. Restart the OpenCode service after changing the pin.
4. Confirm that the package cache resolved the requested tag or commit.

Report upstream skill issues at <https://github.com/chrisbanes/skills/issues>.
Report V2 adapter issues at <https://github.com/dambear/skills/issues>.
