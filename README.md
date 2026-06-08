# Rotom'Pau

A Discord bot for the Pokémon GO community of Pau, France.

It serves two goals: letting each player see that they are not isolated in their area,
and making it easy to organize outings, without ever revealing any personal
information.

## Planned features

### Area map
- Displays the play areas of Pau (Beaumont, Pesquidoux, Lons, etc.) with a player
  count per area.
- A `/map` command returns an image (PNG) directly in Discord, with no external
  website required.
- Data comes from the Discord roles that players assign to themselves through
  "Channels & Roles". No extra input, no duplicates.
- No location or address is ever exposed: only the area a player voluntarily selected
  is counted.
- An area only shows its counter once at least three players have joined it, to
  preserve anonymity.

### Meetups
- A command creates a temporary thread for an outing: place, time, and sign-ups by
  reaction.
- The thread is archived or deleted automatically after the event.
- A reminder is sent automatically before the meetup.

## Design principle

The bot relies on a single source of truth: the players' "area" roles.

```
Player on Discord
   |  (selects their area through "Channels & Roles")
   v
Rotom'Pau  --- reads roles --->  "Area" roles (permanent)
   |
   |-- /map   -> generates a PNG of the areas with counters
   '-- /rdv   -> creates a temporary thread for an outing
```

| Element            | Purpose                     | Form                     | Lifetime  |
|--------------------|-----------------------------|--------------------------|-----------|
| "Area" roles       | Feed the map                | "Channels & Roles" roles | Permanent |
| Meetup threads     | Organize an outing          | Threads created by the bot | Ephemeral |

## Privacy

- No geolocation, no address, no individual position.
- The area is declarative and voluntary: the player selects their own role.
- The map only shows aggregated counts per area, never an isolated player (minimum
  threshold of three players).

## Project status

The project is in the design phase. Implementation will come later. The technology
stack (language, map-rendering library) is still to be decided.

## Roadmap

- [ ] Define the list of Pau areas and create the matching roles
- [ ] Prepare the base map (background image with the areas drawn)
- [ ] Prototype: `/map` command generating a PNG with counters
- [ ] `/rdv` command: temporary thread creation and sign-ups
- [ ] Automatic reminders before outings
- [ ] Optional interactive web app to complement the PNG

## License

Released under the MIT License. See the `LICENSE` file.

---

Community project, not affiliated with Niantic or The Pokémon Company.
Pokémon is a trademark of Nintendo, Creatures Inc. and GAME FREAK inc.
