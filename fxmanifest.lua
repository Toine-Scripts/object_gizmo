fx_version 'cerulean'
game 'gta5'
lua54 'yes'

description 'NUI Version of object gizmo maintained by Toine Scripts'
version '1.0.1'
author 'Toine, DemiAutomatic (Original)'

ui_page 'web/dist/index.html'
--ui_page 'http://localhost:5173'

client_scripts {
    "client/*.lua"
}

shared_scripts {
    'config.lua',
    '@ox_lib/init.lua',
    '@ts-lib/import.lua',
}

files {
    'web/dist/index.html',
    'web/dist/**/*',
}

dependencies {
    'ox_lib'
}
