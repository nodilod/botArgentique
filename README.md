# botArgentique
## Installation

- [ OPTIONAL ] execute `docker-compose up -d` to start a mariaDb database
- execute `npm install` to install the dependencies
- complete the `.env` file with your credentials
- execute `npx prisma migrate dev --name init` to create the database
- execute `node ./prisma/fixtures.mjs` to add some data to the database
- execute `forever start discord.mjs` to start the bot
- execute `node start.mjs` to start scraping

## Run

run `node main.mjs` to add some data to the database


## TODO List :

- [ ] Fix a README.md
- [X] Add a .env.example
- [X] Add a Fixtures
- [ ] Add a random messages
- [ ] date out of stock in message
- [X] Add a instant film in fotoimpex