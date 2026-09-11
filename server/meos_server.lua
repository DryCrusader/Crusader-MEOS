local function ResolveFramework()
  if Config.Framework ~= 'auto' then return Config.Framework end
  if GetResourceState('es_extended') == 'started' then return 'esx' end
  if GetResourceState('qbx_core') == 'started' then return 'qbox' end
  if GetResourceState('qb-core') == 'started' then return 'qbox' end
  return nil
end

local FRAMEWORK = ResolveFramework()

local ESX_SEX_TO_LABEL = { M = 'Man', V = 'Vrouw', X = 'Anders' }
local ESX_GESLACHT_FILTER_TO_CODE = { man = 'M', vrouw = 'V', anders = 'X' }

local ESX = nil
local QBCore = nil

if FRAMEWORK == 'esx' then
  ESX = exports['es_extended']:getSharedObject()
elseif FRAMEWORK == 'qbox' then
  local ok, obj = pcall(function() return exports['qbx_core']:GetCoreObject() end)
  if not ok or not obj then
    ok, obj = pcall(function() return exports['qb-core']:GetCoreObject() end)
  end
  if ok then QBCore = obj end
end

if not FRAMEWORK or (FRAMEWORK == 'esx' and not ESX) or (FRAMEWORK == 'qbox' and not QBCore) then
  print('[meos] WARNING: could not resolve a working framework object. Check Config.Framework in config.lua and that es_extended/qbx_core/qb-core actually started before this resource.')
end

local function GetPlayerContext(source)
  if FRAMEWORK == 'esx' and ESX then
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then return nil end
    return { identifier = xPlayer.identifier, job = xPlayer.job.name }
  elseif FRAMEWORK == 'qbox' and QBCore then
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return nil end
    return { identifier = Player.PlayerData.citizenid, job = Player.PlayerData.job.name }
  end
  return nil
end

RegisterMeosCallback('meos:getFeitcodes', function(source, cb, data)
  data = data or {}
  local query = data.query
  local categorie = data.categorie

  local where = {}
  local params = {}

  if query and query ~= '' then
    local like = '%' .. query .. '%'
    where[#where + 1] = '(code LIKE ? OR omschrijving LIKE ?)'
    params[#params + 1] = like
    params[#params + 1] = like
  end

  if categorie and categorie ~= '' then
    where[#where + 1] = 'categorie = ?'
    params[#params + 1] = categorie
  end

  local sql = 'SELECT id, code, omschrijving, sanctiebedrag, categorie FROM meos_feitcodes'
  if #where > 0 then
    sql = sql .. ' WHERE ' .. table.concat(where, ' AND ')
  end
  sql = sql .. ' ORDER BY code LIMIT 50'

  local rows = MySQL.query.await(sql, params) or {}
  cb(rows)
end)

RegisterMeosCallback('meos:getFeitcodeCategorieen', function(source, cb)
  local rows = MySQL.query.await(
    "SELECT DISTINCT categorie FROM meos_feitcodes WHERE categorie IS NOT NULL AND categorie <> ''",
    {}
  ) or {}

  local CATEGORIE_ORDER = {
    'Verkeer op de weg', 'Openbaar vervoer', 'Binnenvisserij',
    'Milieu/vuurwerk', 'Drugs', 'Drank/horeca', 'Openbare orde', 'Overig'
  }
  local orderIndex = {}
  for i, name in ipairs(CATEGORIE_ORDER) do
    orderIndex[name] = i
  end

  local categories = {}
  for _, row in ipairs(rows) do
    categories[#categories + 1] = row.categorie
  end

  table.sort(categories, function(a, b)
    local ia = orderIndex[a] or 999
    local ib = orderIndex[b] or 999
    if ia == ib then return a < b end
    return ia < ib
  end)

  cb(categories)
end)

local function SearchPersonenEsx(filters)
  local col = Config.Columns.esx
  local where = {}
  local params = {}

  if filters.naam and filters.naam ~= '' then
    where[#where + 1] = ('(CONCAT(%s, \' \', %s) LIKE ?)'):format(col.firstname, col.lastname)
    params[#params + 1] = '%' .. filters.naam .. '%'
  end

  if filters.geboortedatum and filters.geboortedatum ~= '' then
    where[#where + 1] = col.dateofbirth .. ' LIKE ?'
    params[#params + 1] = '%' .. filters.geboortedatum .. '%'
  end

  if filters.geslacht and filters.geslacht ~= '' then
    where[#where + 1] = col.sex .. ' = ?'
    params[#params + 1] = ESX_GESLACHT_FILTER_TO_CODE[filters.geslacht] or filters.geslacht
  end

  if filters.bsn and filters.bsn ~= '' then
    if not col.bsn then

      return {}
    end
    where[#where + 1] = col.bsn .. ' LIKE ?'
    params[#params + 1] = '%' .. filters.bsn .. '%'
  end

  if filters.persoonsnummer and filters.persoonsnummer ~= '' then

    where[#where + 1] = col.identifier .. ' IN (SELECT owner_identifier FROM identity_documents WHERE document_number LIKE ?)'
    params[#params + 1] = '%' .. filters.persoonsnummer .. '%'
  end

  local sql = ('SELECT %s, %s, %s, %s, %s FROM %s'):format(
    col.identifier, col.firstname, col.lastname, col.dateofbirth, col.sex, Config.Tables.esx_users
  )
  if #where > 0 then
    sql = sql .. ' WHERE ' .. table.concat(where, ' AND ')
  else

    return {}
  end
  sql = sql .. ' LIMIT 50'

  local rows = MySQL.query.await(sql, params) or {}
  local results = {}
  for _, row in ipairs(rows) do
    results[#results + 1] = {
      identifier = row[col.identifier],
      naam = (row[col.firstname] or '?') .. ' ' .. (row[col.lastname] or '?'),
      geboortedatum = row[col.dateofbirth],
      geslacht = ESX_SEX_TO_LABEL[row[col.sex]] or 'Onbekend',
      adres = nil
    }
  end
  return results
end

local function SearchPersonenQbox(filters)
  local col = Config.Columns.qbox

  local hasAnyFilter = (filters.naam and filters.naam ~= '')
    or (filters.geboortedatum and filters.geboortedatum ~= '')
    or (filters.geslacht and filters.geslacht ~= '')
    or (filters.bsn and filters.bsn ~= '')
  if not hasAnyFilter then
    return {}
  end

  local rows = MySQL.query.await(
    ('SELECT %s, %s FROM %s'):format(col.citizenid, col.charinfo, Config.Tables.qbox_players),
    {}
  ) or {}

  local results = {}
  for _, row in ipairs(rows) do
    local ok, info = pcall(json.decode, row[col.charinfo] or '{}')
    if ok and info then
      local naam = (info.firstname or '?') .. ' ' .. (info.lastname or '?')
      local geboortedatum = info.birthdate

      local geslacht = 'Onbekend'
      if info.gender == 0 or info.gender == 'm' then
        geslacht = 'Man'
      elseif info.gender == 1 or info.gender == 'f' or info.gender == 'v' then
        geslacht = 'Vrouw'
      end

      local matches = true
      if filters.naam and filters.naam ~= '' and not naam:lower():find(filters.naam:lower(), 1, true) then
        matches = false
      end
      if matches and filters.geboortedatum and filters.geboortedatum ~= '' then
        if not geboortedatum or not tostring(geboortedatum):find(filters.geboortedatum, 1, true) then
          matches = false
        end
      end
      if matches and filters.geslacht and filters.geslacht ~= '' then
        local wanted = filters.geslacht == 'man' and 'Man' or 'Vrouw'
        if geslacht ~= wanted then matches = false end
      end
      if matches and filters.bsn and filters.bsn ~= '' then

        local bsnField = Config.Columns.qbox.bsn
        if not bsnField or tostring(info[bsnField] or '') ~= filters.bsn then
          matches = false
        end
      end

      if matches then
        results[#results + 1] = {
          identifier = row[col.citizenid],
          naam = naam,
          geboortedatum = geboortedatum,
          geslacht = geslacht,
          adres = nil
        }
        if #results >= 50 then break end
      end
    end
  end
  return results
end

RegisterMeosCallback('meos:searchPersonen', function(source, cb, filters)
  filters = filters or {}
  if FRAMEWORK == 'esx' then
    cb(SearchPersonenEsx(filters))
  elseif FRAMEWORK == 'qbox' then
    cb(SearchPersonenQbox(filters))
  else
    cb({})
  end
end)

RegisterMeosCallback('meos:scanDocument', function(source, cb)
  local ok, doc = pcall(function()
    return exports['nederland-character']:GetCurrentlyShownDocument(source)
  end)

  if not ok or not doc then
    cb({ success = false })
    return
  end

  cb({ success = true, document = doc })
end)

local function GetMutatiesEnBekeuringen(identifier)
  local mutatieRows = MySQL.query.await(
    'SELECT id, situatie AS omschrijving, created_at FROM meos_mutaties WHERE persoon_identifier = ? ORDER BY created_at DESC LIMIT 20',
    { identifier }
  ) or {}

  local bekeuringRows = MySQL.query.await(
    [[
      SELECT id, 'Digibon' AS type, feit_code, feit_omschrijving, created_at FROM meos_digibonnen WHERE persoon_identifier = ?
      UNION ALL
      SELECT id, 'Combibon' AS type, feit_code, feit_omschrijving, created_at FROM meos_combibonnen WHERE persoon_identifier = ?
      ORDER BY created_at DESC LIMIT 20
    ]],
    { identifier, identifier }
  ) or {}

  local mutaties = {}
  for _, row in ipairs(mutatieRows) do
    mutaties[#mutaties + 1] = { id = row.id, type = 'Mutatie', omschrijving = row.omschrijving, datum = row.created_at }
  end

  local bekeuringen = {}
  for _, row in ipairs(bekeuringRows) do
    bekeuringen[#bekeuringen + 1] = {
      id = row.id,
      type = row.type,
      omschrijving = (row.feit_code or '?') .. (row.feit_omschrijving and (' - ' .. row.feit_omschrijving) or ''),
      datum = row.created_at
    }
  end

  return mutaties, bekeuringen
end

local function GetPersoonProfielEsx(identifier)
  local col = Config.Columns.esx
  local fields = { col.identifier, col.firstname, col.lastname, col.dateofbirth, col.sex, col.height, col.nationality }
  if col.bsn then fields[#fields + 1] = col.bsn end

  local user = MySQL.single.await(
    ('SELECT %s FROM %s WHERE %s = ?'):format(table.concat(fields, ', '), Config.Tables.esx_users, col.identifier),
    { identifier }
  )
  if not user then return nil end

  local wanted = MySQL.single.await('SELECT reason FROM meos_wanted WHERE identifier = ?', { identifier })

  local licenseRows = MySQL.query.await(
    "SELECT type FROM user_licenses WHERE owner = ? AND type IN ('verlof', 'weapon')",
    { identifier }
  ) or {}
  local heeftVerlof, heeftWapenvergunning = false, false
  for _, row in ipairs(licenseRows) do
    if row.type == 'verlof' then heeftVerlof = true end
    if row.type == 'weapon' then heeftWapenvergunning = true end
  end

  local voertuigenCount = MySQL.scalar.await(
    ('SELECT COUNT(*) FROM %s WHERE owner = ?'):format(Config.Tables.esx_owned_vehicles),
    { identifier }
  ) or 0

  local mutaties, bekeuringen = GetMutatiesEnBekeuringen(identifier)

  return {
    identifier = user[col.identifier],
    naam = (user[col.firstname] or '?') .. ' ' .. (user[col.lastname] or '?'),
    geboortedatum = user[col.dateofbirth],
    geslacht = ESX_SEX_TO_LABEL[user[col.sex]] or 'Onbekend',
    lengte = user[col.height],
    nationaliteit = user[col.nationality],
    bsn = col.bsn and user[col.bsn] or nil,
    wanted = wanted ~= nil,
    wantedReason = wanted and wanted.reason or nil,
    heeftVerlof = heeftVerlof,
    heeftWapenvergunning = heeftWapenvergunning,
    mutaties = mutaties,
    bekeuringen = bekeuringen,
    voertuigen = voertuigenCount
  }
end

local function GetPersoonProfielQbox(identifier)
  local col = Config.Columns.qbox
  local row = MySQL.single.await(
    ('SELECT %s, %s FROM %s WHERE %s = ?'):format(col.citizenid, col.charinfo, Config.Tables.qbox_players, col.citizenid),
    { identifier }
  )
  if not row then return nil end

  local ok, info = pcall(json.decode, row[col.charinfo] or '{}')
  if not ok then info = {} end
  local geslacht = 'Onbekend'
  if info.gender == 0 or info.gender == 'm' then
    geslacht = 'Man'
  elseif info.gender == 1 or info.gender == 'f' or info.gender == 'v' then
    geslacht = 'Vrouw'
  end

  local wanted = MySQL.single.await('SELECT reason FROM meos_wanted WHERE identifier = ?', { identifier })

  local voertuigenCount = MySQL.scalar.await(
    ('SELECT COUNT(*) FROM %s WHERE %s = ?'):format(Config.Tables.qbox_player_vehicles, col.citizenid),
    { identifier }
  ) or 0

  local mutaties, bekeuringen = GetMutatiesEnBekeuringen(identifier)

  return {
    identifier = row[col.citizenid],
    naam = (info.firstname or '?') .. ' ' .. (info.lastname or '?'),
    geboortedatum = info.birthdate,
    geslacht = geslacht,

    lengte = nil,
    nationaliteit = info.nationality,
    wanted = wanted ~= nil,
    wantedReason = wanted and wanted.reason or nil,
    mutaties = mutaties,
    bekeuringen = bekeuringen,

    heeftVerlof = false,
    heeftWapenvergunning = false,
    voertuigen = voertuigenCount
  }
end

RegisterMeosCallback('meos:getPersoonProfiel', function(source, cb, identifier)
  if not identifier or identifier == '' then
    cb(nil)
    return
  end
  if FRAMEWORK == 'esx' then
    cb(GetPersoonProfielEsx(identifier))
  elseif FRAMEWORK == 'qbox' then
    cb(GetPersoonProfielQbox(identifier))
  else
    cb(nil)
  end
end)

RegisterMeosCallback('meos:toggleWapenvergunning', function(source, cb, data)
  if FRAMEWORK ~= 'esx' then
    cb({ success = false, error = 'not_supported_on_this_framework' })
    return
  end

  local identifier = data and data.identifier
  local grant = data and data.grant

  if not identifier then
    cb({ success = false, error = 'missing_identifier' })
    return
  end

  local hasVerlof = MySQL.scalar.await(
    "SELECT 1 FROM user_licenses WHERE owner = ? AND type = 'verlof' LIMIT 1",
    { identifier }
  )

  if not hasVerlof then
    cb({ success = false, error = 'no_verlof' })
    return
  end

  if grant then
    MySQL.insert.await("INSERT IGNORE INTO user_licenses (type, owner) VALUES ('weapon', ?)", { identifier })
  else
    MySQL.update.await("DELETE FROM user_licenses WHERE type = 'weapon' AND owner = ?", { identifier })
  end

  cb({ success = true, heeftWapenvergunning = grant and true or false })
end)

RegisterMeosCallback('meos:toggleWanted', function(source, cb, data)
  local ctx = GetPlayerContext(source)
  local identifier = data and data.identifier
  local wanted = data and data.wanted
  local reason = data and data.reason or nil

  if not identifier or not ctx then
    cb({ success = false })
    return
  end

  if wanted then
    MySQL.insert.await(
      'INSERT INTO meos_wanted (identifier, reason, added_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE reason = VALUES(reason), added_by = VALUES(added_by)',
      { identifier, reason, ctx.identifier }
    )
  else
    MySQL.update.await('DELETE FROM meos_wanted WHERE identifier = ?', { identifier })
  end

  cb({ success = true })
end)

RegisterMeosCallback('meos:logLookup', function(source, cb, data)
  local ctx = GetPlayerContext(source)
  if not ctx or not data or not data.type or not data.label then
    cb({ success = false })
    return
  end

  MySQL.insert.await(
    'INSERT INTO meos_lookup_history (officer_identifier, type, label, target_identifier) VALUES (?, ?, ?, ?)',
    { ctx.identifier, data.type, data.label, data.targetIdentifier or nil }
  )

  cb({ success = true })
end)

RegisterMeosCallback('meos:getLookupHistory', function(source, cb, historyType)
  local ctx = GetPlayerContext(source)
  if not ctx then
    cb({})
    return
  end

  local rows = MySQL.query.await(
    'SELECT label, created_at, target_identifier FROM meos_lookup_history WHERE officer_identifier = ? AND type = ? ORDER BY created_at DESC LIMIT 100',
    { ctx.identifier, historyType }
  )

  cb(rows or {})
end)

RegisterMeosCallback('meos:submitDigibon', function(source, cb, data)
  local ctx = GetPlayerContext(source)
  if not ctx or not data or not data.feitCode then
    cb({ success = false, error = 'missing_feit' })
    return
  end

  MySQL.insert.await(
    [[
      INSERT INTO meos_digibonnen
        (officer_identifier, feit_code, feit_omschrijving, persoon_identifier, voertuig_plate, postcode, straat, reden_wetenschap, verklaring)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ]],
    {
      ctx.identifier, data.feitCode, data.feitOmschrijving, data.persoonIdentifier, data.voertuigPlate,
      data.postcode, data.straat, data.redenWetenschap, data.verklaring
    }
  )

  cb({ success = true })
end)

RegisterMeosCallback('meos:submitMutatie', function(source, cb, data)
  local ctx = GetPlayerContext(source)
  if not ctx or not data or not data.situatie then
    cb({ success = false, error = 'missing_situatie' })
    return
  end

  MySQL.insert.await(
    [[
      INSERT INTO meos_mutaties
        (officer_identifier, situatie, persoon_identifier, voertuig_plate, postcode, straat, toelichting)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    ]],
    {
      ctx.identifier, data.situatie, data.persoonIdentifier, data.voertuigPlate,
      data.postcode, data.straat, data.toelichting
    }
  )

  cb({ success = true })
end)

RegisterMeosCallback('meos:submitCombibon', function(source, cb, data)
  local ctx = GetPlayerContext(source)
  if not ctx or not data or not data.soort then
    cb({ success = false, error = 'missing_soort' })
    return
  end

  MySQL.insert.await(
    [[
      INSERT INTO meos_combibonnen
        (officer_identifier, soort, feit_code, feit_omschrijving, persoon_identifier, voertuig_plate, postcode, straat)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ]],
    {
      ctx.identifier, data.soort, data.feitCode, data.feitOmschrijving, data.persoonIdentifier, data.voertuigPlate,
      data.postcode, data.straat
    }
  )

  cb({ success = true })
end)

RegisterMeosCallback('meos:getDocumentenByPostcode', function(source, cb, postcode)
  if not postcode or postcode == '' then
    cb({})
    return
  end

  local rows = MySQL.query.await(
    [[
      SELECT 'Digibon' AS type, feit_code, feit_omschrijving AS omschrijving, straat, postcode, created_at
      FROM meos_digibonnen WHERE postcode = ?
      UNION ALL
      SELECT 'Combibon' AS type, feit_code, feit_omschrijving AS omschrijving, straat, postcode, created_at
      FROM meos_combibonnen WHERE postcode = ?
      UNION ALL
      SELECT 'Mutatie' AS type, NULL AS feit_code, situatie AS omschrijving, straat, postcode, created_at
      FROM meos_mutaties WHERE postcode = ?
      ORDER BY created_at DESC
      LIMIT 50
    ]],
    { postcode, postcode, postcode }
  ) or {}

  cb(rows)
end)

RegisterMeosCallback('meos:getDocumentDetail', function(source, cb, data)
  local docType = data and data.type
  local id = data and data.id
  if not docType or not id then
    cb(nil)
    return
  end

  local row = nil

  if docType == 'Digibon' then
    row = MySQL.single.await('SELECT * FROM meos_digibonnen WHERE id = ?', { id })
  elseif docType == 'Mutatie' then
    row = MySQL.single.await('SELECT * FROM meos_mutaties WHERE id = ?', { id })
  elseif docType == 'Combibon' then
    row = MySQL.single.await('SELECT * FROM meos_combibonnen WHERE id = ?', { id })
  end

  if not row then
    cb(nil)
    return
  end

  row.type = docType
  cb(row)
end)

local function SearchVoertuigenEsx(plate)
  local rows = MySQL.query.await(
    ([[
      SELECT ov.plate, ov.vehicle, ov.type, ov.job, ov.stored, ov.parking, ov.pound, ov.owner,
             u.%s AS firstname, u.%s AS lastname
      FROM %s ov
      LEFT JOIN %s u ON u.%s = ov.owner
      WHERE ov.plate LIKE ?
      LIMIT 25
    ]]):format(
      Config.Columns.esx.firstname, Config.Columns.esx.lastname,
      Config.Tables.esx_owned_vehicles, Config.Tables.esx_users, Config.Columns.esx.identifier
    ),
    { '%' .. plate .. '%' }
  ) or {}

  local results = {}
  for _, row in ipairs(rows) do
    results[#results + 1] = {
      plate = row.plate,
      type = row.type,
      job = row.job,
      stored = row.stored == 1,
      parking = row.parking,
      pound = row.pound,
      vehicleRaw = row.vehicle,
      eigenaarIdentifier = row.owner,
      eigenaarNaam = row.firstname and ((row.firstname or '?') .. ' ' .. (row.lastname or '?')) or nil
    }
  end
  return results
end

local function SearchVoertuigenQbox(plate)
  local col = Config.Columns.qbox
  local rows = MySQL.query.await(
    ([[
      SELECT pv.plate, pv.%s AS vehicle_json, pv.citizenid, p.%s AS charinfo
      FROM %s pv
      LEFT JOIN %s p ON p.%s = pv.citizenid
      WHERE pv.plate LIKE ?
      LIMIT 25
    ]]):format(
      col.vehicle_json_column, col.charinfo, Config.Tables.qbox_player_vehicles, Config.Tables.qbox_players, col.citizenid
    ),
    { '%' .. plate .. '%' }
  ) or {}

  local results = {}
  for _, row in ipairs(rows) do
    local eigenaarNaam = nil
    if row.charinfo then
      local ok, info = pcall(json.decode, row.charinfo)
      if ok and info then
        eigenaarNaam = (info.firstname or '?') .. ' ' .. (info.lastname or '?')
      end
    end
    results[#results + 1] = {
      plate = row.plate,
      vehicleRaw = row.vehicle_json,
      eigenaarIdentifier = row.citizenid,
      eigenaarNaam = eigenaarNaam
    }
  end
  return results
end

RegisterMeosCallback('meos:searchVoertuigen', function(source, cb, plate)
  if not plate or plate == '' then
    cb({})
    return
  end

  if FRAMEWORK == 'esx' then
    cb(SearchVoertuigenEsx(plate))
  elseif FRAMEWORK == 'qbox' then
    cb(SearchVoertuigenQbox(plate))
  else
    cb({})
  end
end)
