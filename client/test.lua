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