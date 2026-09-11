local function GetNearestPostcodeFallback(x, y)
  local nearest, nearestDist = nil, math.huge
  for _, entry in ipairs(Config.Postcodes) do
    local dist = math.sqrt((entry.x - x) ^ 2 + (entry.y - y) ^ 2)
    if dist < nearestDist then
      nearestDist = dist
      nearest = entry
    end
  end
  return nearest and nearest.code or nil
end

local STREET_WORD_EXPANSIONS = {
  ['St'] = 'Street', ['St.'] = 'Street',
  ['Ave'] = 'Avenue', ['Ave.'] = 'Avenue',
  ['Dr'] = 'Drive', ['Dr.'] = 'Drive',
  ['Blvd'] = 'Boulevard', ['Blvd.'] = 'Boulevard',
  ['Rd'] = 'Road', ['Rd.'] = 'Road',
  ['Ln'] = 'Lane', ['Ln.'] = 'Lane',
  ['Pl'] = 'Place', ['Pl.'] = 'Place',
  ['Ct'] = 'Court', ['Ct.'] = 'Court',
  ['Pkwy'] = 'Parkway', ['Pkwy.'] = 'Parkway',
  ['Hwy'] = 'Highway', ['Hwy.'] = 'Highway',
  ['Fwy'] = 'Freeway', ['Fwy.'] = 'Freeway',
  ['Psg'] = 'Passage', ['Psg.'] = 'Passage',
  ['N'] = 'North', ['N.'] = 'North',
  ['S'] = 'South', ['S.'] = 'South',
  ['E'] = 'East', ['E.'] = 'East',
  ['W'] = 'West', ['W.'] = 'West'
}

local function ExpandStreetAbbreviations(name)
  local words = {}
  local changed = false
  for word in name:gmatch('%S+') do
    local expansion = STREET_WORD_EXPANSIONS[word]
    if expansion then
      changed = true
      words[#words + 1] = expansion
    else
      words[#words + 1] = word
    end
  end
  if not changed then return nil end
  return table.concat(words, ' ')
end

local function GetNederlandseStraat(x, y, z)
  local streetHash = GetStreetNameAtCoord(x, y, z or 30.0)
  local gtaNaam = GetStreetNameFromHashKey(streetHash)
  if not gtaNaam or gtaNaam == '' then
    print(('[meos] Geen GTA straat gevonden op (%.1f, %.1f, %.1f)'):format(x, y, z or 30.0))
    return 'Onbekende straat'
  end

  local nederlandseNaam = Config.Straatnamen[gtaNaam]
  local expandedNaam = nil

  if not nederlandseNaam then
    expandedNaam = ExpandStreetAbbreviations(gtaNaam)
    if expandedNaam then
      nederlandseNaam = Config.Straatnamen[expandedNaam]
    end
  end

  if nederlandseNaam then
    print(('[meos] %s%s -> %s'):format(gtaNaam, expandedNaam and (' (' .. expandedNaam .. ')') or '', nederlandseNaam))
  else
    print(('[meos] Geen Nederlandse vertaling voor GTA straat "%s"%s (val terug op GTA naam)'):format(
      gtaNaam, expandedNaam and (' / "' .. expandedNaam .. '"') or ''
    ))
  end

  return nederlandseNaam or gtaNaam
end

local function GetGroundZ(x, y)
  local found, groundZ = GetGroundZFor_3dCoord(x + 0.0, y + 0.0, 1000.0, false)
  if found then
    return groundZ
  end
  return 30.0
end

RegisterNUICallback('meos_getNearestPostcode', function(data, cb)
  local coords = GetEntityCoords(PlayerPedId())
  local postcode = nil

  local ok, result = pcall(function()
    return exports[Config.PostalResource]:getNearest()
  end)

  if ok and result and result.code then
    postcode = result.code
  else
    postcode = GetNearestPostcodeFallback(coords.x, coords.y)
  end

  if not postcode then
    cb(nil)
    return
  end

  cb({
    postcode = postcode,
    straat = GetNederlandseStraat(coords.x, coords.y, coords.z)
  })
end)

RegisterNUICallback('meos_getStraatByPostcode', function(data, cb)
  local postcode = data and data.postcode
  if not postcode then
    cb(nil)
    return
  end

  local match = nil
  for _, entry in ipairs(Config.Postcodes) do
    if entry.code == postcode then
      match = entry
      break
    end
  end

  if not match then
    cb(nil)
    return
  end

  cb({
    postcode = match.code,
    straat = GetNederlandseStraat(match.x, match.y, GetGroundZ(match.x, match.y))
  })
end)
