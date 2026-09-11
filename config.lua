Config = {}

-- Framework / Raamwerk: 'auto' | 'esx' | 'qbox'
Config.Framework = 'auto'

-- Toegestane jobs / Allowed jobs
Config.AllowedJobs = {
    'police',
    'sheriff',
    'kmar'
}

-- App-instellingen / App settings
Config.App = {
    identifier = 'meos',
    name = 'MEOS',
    description = 'Mobiel Effectiever Op Straat',
    developer = 'Nationale Politie',
    defaultApp = true,
    size = 42000,
    icon = ('https://cfx-nui-%s/ui/assets/meos.png'):format(GetCurrentResourceName())
}

-- Postcode-resource / Postal resource
Config.PostalResource = 'postal'

-- Databasetabellen / Database tables
Config.Tables = {
    esx_users = 'users',
    esx_owned_vehicles = 'owned_vehicles',
    qbox_players = 'players',
    qbox_player_vehicles = 'player_vehicles'
}

-- Kolomnamen / Column names
Config.Columns = {
    esx = {
        identifier = 'identifier',
        firstname = 'firstname',
        lastname = 'lastname',
        dateofbirth = 'dateofbirth',
        sex = 'sex',
        height = 'height',
        nationality = 'nationality',
        phone = 'phone_number',
        bsn = 'ssn'
    },
    qbox = {
        citizenid = 'citizenid',
        charinfo = 'charinfo',
        bsn = nil,
        vehicle_json_column = 'vehicle'
    }
}
