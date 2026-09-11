# MEOS - Mobiel Effectiever Op Straat - Gemaakt door DryCrusader

Politie-app voor FiveM, gebouwd als custom app voor lb-phone. Ondersteunt zowel ESX als Qbox/QB-Core. Het MEOS valt het beste te gebruiken met crusader-karakter. Daar zit een ID/Rijbewijs/Paspoort systeem in verwerkt. Crusader MEOS gebruikt exports voor het opzoeken van persoonsgegevens van crusader-karakter. Je dient deze exports in crusader-meos zelf aan te passen als je daar geen gebruik van wilt maken.

Voor vragen kan je DryCrusader een DM sturen op Discord.

## Features

- Persoon opzoeken (naam, BSN, persoonsnummer) en persoonsdossier met mutaties/bekeuringen
- Vervoermiddel opzoeken
- Documentscanning (ID-kaart, paspoort, rijbewijs, kentekenbewijs) via `nederland-character`
- Locatie/Bluespot met automatische locatiebepaling en postcode-zoek
- Digibon, Mutatie en Combibon afhandelen, gekoppeld aan persoonsdossiers
- Feitcodes ingedeeld op maatschappelijke klasse
- Meldingen/dispatch

## Vereisten

- ESX Legacy of Qbox/QB-Core
- oxmysql
- lb-phone, of sd-phone met lb-phone-compatibiliteitslaag
- Een postcode-resource die `getNearest()` exporteert (optioneel, met fallback)
- `nederland-character` voor documentscanning (optioneel, scanknoppen falen anders netjes af)

## Installatie

1. Plaats de map `meos` in je `resources`-map.
2. Voer `sql/meos_schema.sql` uit op je database.
3. Pas `config.lua` aan naar je eigen server (toegestane jobs, tabel-/kolomnamen, postcode-resource).
4. Zet `ensure meos` in je `server.cfg`, na `oxmysql` en je framework.

## Configuratie

Alle instellingen staan in `config.lua`. Kolomnamen voor `users`/`owned_vehicles` (ESX) en `players`/`player_vehicles` (Qbox) zijn los instelbaar, voor het geval je database afwijkt.

## Externe exports
 
MEOS exporteert zelf niets voor andere scripts - het roept alleen exports van andere resources aan. Dit zijn ze, en waar je ze aanpast als jouw resource anders heet:
 
| Resource | Export | Waar aan te passen |
|---|---|---|
| `lb-phone` | `AddCustomApp`, `RemoveCustomApp` | `client/meos_app_register.lua` (resourcenaam hardcoded) |
| `es_extended` | `getSharedObject` | `client/meos_app_register.lua`, `server/meos_server.lua` (resourcenaam hardcoded) |
| `qbx_core` / `qb-core` | `GetPlayerData`, `GetCoreObject` | `client/meos_app_register.lua`, `server/meos_server.lua` (resourcenaam hardcoded) |
| Postcode-resource | `getNearest` | `Config.PostalResource` in `config.lua` |
| `crusader-character` | `GetCurrentlyShownDocument` | `server/meos_server.lua`, regel met `exports['nederland-character']` (resourcenaam hardcoded) |

## Licentie

Vrij te gebruiken en aan te passen. Bij publicatie dien je dit open source te houden onder de GNU Lesser General Public License v2.1

