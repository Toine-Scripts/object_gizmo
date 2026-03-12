# Object Gizmo Module - object_gizmo

> **Credits & Notice**
> All rights for this script belong to **DemiAutomatic** (Original repository: https://github.com/DemiAutomatic/object_gizmo). 
> Please note that this is the NUI version of the gizmo and it does **not** use the FxDK technology. Certain things have been modified in this fork, but the foundational work is entirely DemiAutomatic's, based on an older NUI version.
> 
> **Important Change:** This version uses both **`ox_lib`** and **`ts-lib`**. It has been modified to use **`ts-lib`** for TextUI and display purposes.

This README provides instructions on how to use the `object_gizmo` module in the FiveM framework using Lua. This module exports a `useGizmo` function that enables manipulation of entity position and rotation through a NUI frame.

## Dependencies

- **[ox_lib]**: [Download here](https://github.com/communityox/ox_lib) - Required for core utilities.
- **[ts-lib]**: [Download here](https://store.toine.me/download/ts-lib) - Required for TextUI/display. Ensure `ts-lib` is installed and started before `object_gizmo`.

## Installation

1. Download the `object_gizmo` resource.
2. Extract the `object_gizmo` folder into your server's `resources` directory.
3. Add `ensure object_gizmo` to your server's `server.cfg` file (make sure it's after `ts-lib`).

After installation, you can use the `useGizmo` function in your scripts: `exports['object_gizmo']:useGizmo(handle)`

## Export

`exports("useGizmo", useGizmo)`

## Functions

### useGizmo(handle)

- `handle`: The entity to be manipulated.

This function opens a NUI frame and allows for the manipulation of the entity's position and rotation. It returns an object with the entity's handle, final position, and final rotation.

## Usage

Ensure the `object_gizmo` module script is running on your server.

The `useGizmo` function can be used in any Lua script on the client side as follows:

```lua
local handle = --[[@ Your target entity handle]]
local result = exports['object_gizmo']:useGizmo(handle)
```

`result` will contain the entity handle, final position, and final rotation.

## Test Command

This module includes a test command `spawnobject` that demonstrates how to use the gizmo. You can use this command in-game by typing `/spawnobject {object model name}` in the console. If no object model name is provided, `prop_bench_01a` is used by default.

The command creates an object at the player's location and then activates the gizmo for that object.

```lua
RegisterCommand('spawnobject',function(source, args, rawCommand)
    local objectName = args[1] or "prop_bench_01a"
    local playerPed = PlayerPedId()
    local offset = GetOffsetFromEntityInWorldCoords(playerPed, 0, 1.0, 0)

    local model = joaat(objectName)
    lib.requestModel(model, 5000)

    local object = CreateObject(model, offset.x, offset.y, offset.z, true, false, false)

    local objectPositionData = exports['object_gizmo']:useGizmo(object)

    print(json.encode(objectPositionData, { indent = true }))
end)
```

## Controls

While using the gizmo, the following controls apply:
- [W]: Switch to Translation Mode
- [R]: Switch to Rotation Mode
- [G]: Toggle Cursor (Focus)
- [LAlt]: Snap to Ground
- [Enter]: Finish Editing

The current mode and space (World/Local) will be displayed via the `ts-lib` TextUI in the top-right of your screen.

## Note

The gizmo only works on entities that you have sufficient permissions to manipulate. Make sure you have the correct permissions to move or rotate the entity you are working with.
