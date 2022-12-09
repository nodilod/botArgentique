import {Marinette} from "./websites/marinette.mjs";
import {databaseConnection} from "./databaseConnection.mjs";

const websites = [
    new Marinette(),
]

const database = await databaseConnection();

websites.forEach(website => {
    website.scrapFilm().then((films) => {
        console.log(films);
    });
});

database.end();
