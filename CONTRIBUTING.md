# Contributing to Rotom'Pau

Thanks for your interest in the project. This repository supports the Pokémon GO
community of Pau; contributions are welcome, whether code, documentation, or usage
feedback.

## Before you start

The project is in the design phase. The technology stack (language, map-rendering
library) is not yet fixed: proposals on these choices are useful and expected.

## Reporting an issue or suggesting an idea

- Open an issue with a clear description of the need, the context, and an example if
  possible.
- For a feature, explain the player-facing use case before the technical aspect.

## Proposing a change

1. Create a dedicated branch from `main`.
2. Make clear, atomic commits with explicit messages.
3. Make sure no secret is included (Discord token, credentials). Secrets go in a local
   `.env` file, never in the repository.
4. Open a pull request describing the change and its value.

## Security

The bot token and any sensitive information must never be committed. The `.env` file
is ignored by git; always start from `.env.example`. If a secret is accidentally
exposed, regenerate it immediately from the Discord developer portal.

## Project spirit

Rotom'Pau aims to strengthen local connections without ever exposing personal
information. Every contribution must respect this principle: no geolocation, no
address, only declarative and aggregated data.
