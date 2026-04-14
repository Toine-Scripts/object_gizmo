local usingGizmo = false
local gizmoHasCursor = true
local currentMinRadius = 2.0
local currentMaxRadius = 7.0

local zUI = nil
local anyIsOpen = false

if Gizmo.Config.zUIFix then
    if Utils.IsResourceStarted(Gizmo.Config.ressourceName) then
        zUI = exports[Gizmo.Config.ressourceName]:getObject()
    end
end

local function toggleNuiFrame(bool)
    usingGizmo = bool
    gizmoHasCursor = bool -- Reset to true when opening
    if Gizmo.Config.zUIFix and zUI and zUI.IsAnyMenuOpen then
        if bool then
            anyIsOpen = zUI.IsAnyMenuOpen()
            if anyIsOpen and zUI.ManageFocus then
                zUI.ManageFocus(false)
            end
        else
            if anyIsOpen and zUI.ManageFocus then
                zUI.ManageFocus(true)
            end
        end
    end

    SetNuiFocus(bool, bool)
    --SetNuiFocusKeepInput(bool)
end

function useGizmo(handle)
    local isObject = IsEntityAnObject(handle)
    local rotation
    
    if isObject then
        rotation = GetEntityRotation(handle)
    else
        -- Pour les peds, on récupère uniquement le heading
        local heading = GetEntityHeading(handle)
        rotation = vector3(0.0, 0.0, heading)
    end
    
    SendNUIMessage({
        action = 'setGizmoEntity',
        data = {
            handle = handle,
            position = GetEntityCoords(handle),
            rotation = rotation,
            isObject = isObject
        }
    })

    toggleNuiFrame(true)
    
    if isObject then
        SetEntityCollision(handle, false, false)
    end

    local function updateTextUI(mode, space)
        local displayMode = mode == "Translate" and "Translation" or "Rotation"
        local displaySpace = space == "local" and "Relative" or "World"
        
        local text = ([[
            Current Mode:<i> %s - %s</i><br>
            <letter>W</letter> Translation Mode<br>
            <letter>R</letter> Rotation Mode<br>
            <letter>G</letter> Toggle Cursor<br>
            <letter>LAlt</letter> Snap to Ground<br>
            <letter>Enter</letter> Finish Editing
        ]]):format(displayMode, displaySpace)
        
        exports['ts-lib']:SendTextUI(text, 'top-right')
    end

    updateTextUI("Translate", "world")

    RegisterNUICallback('swapMode', function(data, cb)
        updateTextUI(data.mode, data.space)
        cb('ok')
    end)

    RegisterNUICallback('recenterCamera', function(data, cb)
        cb('ok')
    end)

    -- Thread pour synchroniser la caméra avec le NUI
    CreateThread(function()
        while usingGizmo do
            SendNUIMessage({
                action = 'setCameraPosition',
                data = {
                    position = GetFinalRenderedCamCoord(),
                    rotation = GetFinalRenderedCamRot(2)
                }
            })
            Wait(0)
        end
    end)

    while usingGizmo do
        Wait(0)
    end

    if isObject then
        SetEntityCollision(handle, true, true)
    end

    exports['ts-lib']:HideTextUI()

    local finalRotation
    if isObject then
        finalRotation = GetEntityRotation(handle)
    else
        finalRotation = vector3(0.0, 0.0, GetEntityHeading(handle))
    end

    return {
        handle = handle,
        position = GetEntityCoords(handle),
        rotation = finalRotation
    }
end

RegisterNUICallback('moveEntity', function(data, cb)
    local entity = data.handle
    local position = data.position
    local rotation = data.rotation
    local isObject = data.isObject

    SetEntityCoords(entity, position.x, position.y, position.z)
    
    if isObject then
        -- Pour les objects, utiliser SetEntityRotation
        SetEntityRotation(entity, rotation.x, rotation.y, rotation.z)
    else
        -- Pour les peds, utiliser uniquement SetEntityHeading (rotation Z only)
        SetEntityHeading(entity, rotation.z)
    end
    
    cb('ok')
end)

RegisterNUICallback('placeOnGround', function(data, cb)
    local isEntityObject = IsEntityAnObject(data.handle)

    if isEntityObject then
        SetEntityCollision(data.handle, true, true)
        PlaceObjectOnGroundProperly(data.handle)
        SetEntityCollision(data.handle, false, false)
    else
        cb('ok')
        return false
    end

    local pos = GetEntityCoords(data.handle)
    local rot = GetEntityRotation(data.handle)

    SendNUIMessage({
        action = 'setGizmoEntity',
        data = {
            handle = data.handle,
            position = pos,
            rotation = rot
        }
    })
    cb('ok')
end)

RegisterNUICallback('finishEdit', function(data, cb)
    toggleNuiFrame(false)
    SendNUIMessage({
        action = 'setGizmoEntity',
        data = {
            handle = nil,
        }
    })
    cb('ok')
end)

RegisterNUICallback('toggleCamera', function(data, cb)
    gizmoHasCursor = not gizmoHasCursor
    SetNuiFocus(true, gizmoHasCursor)
    SetNuiFocusKeepInput(not gizmoHasCursor)
    cb('ok')
end)

exports("useGizmo", useGizmo)
