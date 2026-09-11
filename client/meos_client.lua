RegisterNUICallback('meos_getFeitcodes', function(data, cb)
  TriggerMeosServerCallback('meos:getFeitcodes', data, function(result)
    cb(result)
  end)
end)

RegisterNUICallback('meos_getFeitcodeCategorieen', function(data, cb)
  TriggerMeosServerCallback('meos:getFeitcodeCategorieen', nil, function(result)
    cb(result)
  end)
end)

RegisterNUICallback('meos_searchPersonen', function(data, cb)
  TriggerMeosServerCallback('meos:searchPersonen', data, function(result)
    cb(result)
  end)
end)

RegisterNUICallback('meos_scanDocument', function(data, cb)
  TriggerMeosServerCallback('meos:scanDocument', nil, function(result)
    cb(result)
  end)
end)

RegisterNUICallback('meos_getPersoonProfiel', function(data, cb)
  TriggerMeosServerCallback('meos:getPersoonProfiel', data and data.identifier or nil, function(result)
    cb(result)
  end)
end)

RegisterNUICallback('meos_getDocumentenByPostcode', function(data, cb)
  TriggerMeosServerCallback('meos:getDocumentenByPostcode', data and data.postcode or nil, function(result)
    cb(result)
  end)
end)

RegisterNUICallback('meos_getDocumentDetail', function(data, cb)
  TriggerMeosServerCallback('meos:getDocumentDetail', data, function(result)
    cb(result)
  end)
end)

RegisterNUICallback('meos_toggleWapenvergunning', function(data, cb)
  TriggerMeosServerCallback('meos:toggleWapenvergunning', data, function(result)
    cb(result)
  end)
end)

RegisterNUICallback('meos_toggleWanted', function(data, cb)
  TriggerMeosServerCallback('meos:toggleWanted', data, function(result)
    cb(result)
  end)
end)

RegisterNUICallback('meos_logLookup', function(data, cb)
  TriggerMeosServerCallback('meos:logLookup', data, function(result)
    cb(result)
  end)
end)

RegisterNUICallback('meos_getLookupHistory', function(data, cb)
  TriggerMeosServerCallback('meos:getLookupHistory', data and data.type or nil, function(result)
    cb(result)
  end)
end)

RegisterNUICallback('meos_searchVoertuigen', function(data, cb)
  TriggerMeosServerCallback('meos:searchVoertuigen', data and data.plate or nil, function(result)
    result = result or {}

    for _, veh in ipairs(result) do
      local ok, vehData = pcall(json.decode, veh.vehicleRaw or '{}')
      if ok and vehData and vehData.model then
        local hash = tonumber(vehData.model) or GetHashKey(tostring(vehData.model))
        local ok2, label = pcall(function()
          return GetLabelText(GetDisplayNameFromVehicleModel(hash))
        end)
        veh.vehicleNaam = (ok2 and label and label ~= 'NULL') and label or 'Onbekend voertuig'
      else
        veh.vehicleNaam = 'Onbekend voertuig'
      end
      veh.vehicleRaw = nil
    end
    cb(result)
  end)
end)

RegisterNUICallback('meos_submitDigibon', function(data, cb)
  TriggerMeosServerCallback('meos:submitDigibon', data, function(result)
    cb(result)
  end)
end)

RegisterNUICallback('meos_submitMutatie', function(data, cb)
  TriggerMeosServerCallback('meos:submitMutatie', data, function(result)
    cb(result)
  end)
end)

RegisterNUICallback('meos_submitCombibon', function(data, cb)
  TriggerMeosServerCallback('meos:submitCombibon', data, function(result)
    cb(result)
  end)
end)
