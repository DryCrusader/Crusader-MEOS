fx_version 'cerulean'
game 'gta5'

author 'DryCrusader'
description 'Mobiel Effectiever Op Straat'
version '1.1.0'

shared_script 'config.lua'
shared_script 'locales/nl.lua'
shared_script 'data/meos_postcodes.lua'
shared_script 'data/meos_straatnamen.lua'

client_scripts {
  'client/meos_callback_client.lua',
  'client/meos_app_register.lua',
  'client/meos_client.lua',
  'client/meos_locatie_client.lua'
}

server_scripts {
  '@oxmysql/lib/MySQL.lua',
  'server/meos_callback_server.lua',
  'server/meos_server.lua'
}

files {
  'ui/index.html',
  'ui/style.css',
  'ui/script.js',
  'ui/assets/meos.png'
}

dependencies {
  'lb-phone',
  'oxmysql'
}
