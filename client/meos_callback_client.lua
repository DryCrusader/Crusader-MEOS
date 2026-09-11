local pending = {}
local nextId = 0

RegisterNetEvent('meos:client:callbackResult', function(requestId, result)
  local cb = pending[requestId]
  if cb then
    pending[requestId] = nil
    cb(result)
  end
end)

function TriggerMeosServerCallback(name, data, cb)
  nextId = nextId + 1
  local id = nextId
  pending[id] = cb
  TriggerServerEvent('meos:server:triggerCallback', name, id, data)
end
