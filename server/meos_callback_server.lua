MeosCallbacks = MeosCallbacks or {}

function RegisterMeosCallback(name, handler)
  MeosCallbacks[name] = handler
end

RegisterNetEvent('meos:server:triggerCallback', function(name, requestId, data)
  local src = source
  local handler = MeosCallbacks[name]

  if not handler then
    print(('[meos] No callback registered for "%s"'):format(name))
    TriggerClientEvent('meos:client:callbackResult', src, requestId, nil)
    return
  end

  handler(src, function(result)
    TriggerClientEvent('meos:client:callbackResult', src, requestId, result)
  end, data)
end)
