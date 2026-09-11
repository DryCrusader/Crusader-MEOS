local function ResolveFramework()
  if Config.Framework ~= 'auto' then return Config.Framework end
  if GetResourceState('es_extended') == 'started' then return 'esx' end
  if GetResourceState('qbx_core') == 'started' then return 'qbox' end
  if GetResourceState('qb-core') == 'started' then return 'qbox' end
  return nil
end

local FRAMEWORK = ResolveFramework()
local hasApp = false

local function IsAllowedJob(jobName)
  if not jobName then return false end
  for _, allowed in ipairs(Config.AllowedJobs) do
    if allowed == jobName then return true end
  end
  return false
end

local function AddMeosApp()
  if hasApp then return end
  local added, errorMessage = exports['lb-phone']:AddCustomApp({
    identifier = Config.App.identifier,
    name = Config.App.name,
    description = Config.App.description,
    developer = Config.App.developer,
    defaultApp = Config.App.defaultApp,
    size = Config.App.size,
    ui = GetCurrentResourceName() .. '/ui/index.html',
    icon = Config.App.icon
  })
  if added then
    hasApp = true
  else
    print(('[meos] Could not add app: %s'):format(errorMessage or 'unknown error'))
  end
end

local function RemoveMeosApp()
  if not hasApp then return end
  if exports['lb-phone']:RemoveCustomApp(Config.App.identifier) then
    hasApp = false
  end
end

local function CheckJob(jobName)
  if IsAllowedJob(jobName) then
    AddMeosApp()
  else
    RemoveMeosApp()
  end
end

if FRAMEWORK == 'esx' then
  local ESX = exports['es_extended']:getSharedObject()

  RegisterNetEvent('esx:playerLoaded', function(xPlayer)
    CheckJob(xPlayer.job.name)
  end)

  RegisterNetEvent('esx:setJob', function(job)
    CheckJob(job.name)
  end)

  CreateThread(function()
    while ESX.GetPlayerData().job == nil do
      Wait(200)
    end
    CheckJob(ESX.GetPlayerData().job.name)
  end)

elseif FRAMEWORK == 'qbox' then

  local function GetJobFromCore()
    local ok, playerData = pcall(function()
      return exports['qbx_core']:GetPlayerData()
    end)
    if not ok or not playerData then
      ok, playerData = pcall(function()
        return exports['qb-core']:GetCoreObject().Functions.GetPlayerData()
      end)
    end
    if ok and playerData and playerData.job then
      return playerData.job.name
    end
    return nil
  end

  RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
    CheckJob(GetJobFromCore())
  end)

  RegisterNetEvent('QBCore:Client:OnJobUpdate', function(job)
    CheckJob(job.name)
  end)

  CreateThread(function()
    Wait(2000)
    local job = GetJobFromCore()
    if job then CheckJob(job) end
  end)

else
  print('[meos] Could not detect a supported framework (es_extended / qbx_core / qb-core). Set Config.Framework manually in config.lua.')
end
