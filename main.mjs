import {Marinette} from "./websites/marinette.mjs";
import {PrismaClient} from '@prisma/client';
import {TwitterApi} from "twitter-api-v2";
import config from './config.json' assert {type: 'json'};
import {Fotoimpex} from "./websites/fotoimpex.mjs";

const websites = [
    new Marinette(),
    new Fotoimpex(),
];

const prisma = new PrismaClient();

const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET_KEY,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

for (const website of websites) {
    const shop = await prisma.shop.findFirst({
        where: {
            url: website.website
        }
    });
    website.scrapFilms().then(async (films) => {
        for (const film of films) {
            if (!config.bugFilm.includes(film.url)) {
                const result = await prisma.film.findFirst({
                    where: {
                        url: film.url
                    }
                })
                if (!result) {
                    // if film is not in database
                    const filmType = film.type ? await prisma.filmType.findFirst({where: {name: film.type}}) : {id: null};
                    const filmFormat = film.format ? await prisma.filmFormat.findFirst({where: {name: film.format}}) : {id: null};
                    try {
                        const createdFilm = await prisma.film.create({
                            data: {
                                name: film.name,
                                url: film.url,
                                price: film.price,
                                isInStock: film.isInStock,
                                shopId: shop.id,
                                filmTypeId: filmType.id,
                                filmFormatId: filmFormat.id,
                            }
                        });
                        console.log("pellicule créée: " + film.name);

                        await prisma.FilmHistoryRecord.create({
                            data: {
                                price: film.price,
                                isInStock: film.isInStock,
                                filmId: createdFilm.id
                            }
                        })
                        console.log("historique de la pellicule créée: " + film.name);
                    } catch (e) {
                        console.log('impossible de créer la pellicule: ' + film.name);
                    }
                    try {
                        //await client.v1.tweet(
                        //     `Le film ${film.name} est disponible sur ${shop.name} ! ${film.url}`
                        //     ).then((result) => {
                        //     console.log("tweet envoyé: " + film.name);
                        // });
                    } catch (e) {
                        console.log('erreur lors de l\'envoi du tweet');
                    }
                } else if (result.price !== film.price || result.isInStock !== film.isInStock) {
                    // if film is in database but price or stock is different
                    console.log("film updated: " + film.name);
                    try{
                        await prisma.film.update({
                            where: {
                                id: result.id
                            }, data: {
                                price: film.price, isInStock: film.isInStock
                            }
                        })
                        console.log("pellicule modifiée: " + film.name);
                    } catch (e) {
                        console.log('impossible créé la pellicule: ' + film.name);
                    }

                    try {
                        await prisma.FilmHistoryRecord.create({
                            data: {
                                price: film.price, isInStock: film.isInStock, filmId: result.id
                            }
                        })
                        console.log("historique de la pellicule créée: " + film.name);

                    } catch (e) {
                        console.log('erreur lors de la création d\'historique de la pellicule:' + film.name);
                    }
                }
                if (result && result.isInStock !== film.isInStock && film.isInStock) {
                    //if film is back in stock, send a tweet
                    try {
                        //await client.v1.tweet(
                        //     `Le film ${film.name} est de nouveau disponible sur ${website.website} ! ${film.url}`
                        // ).then((result) => {
                        //     console.log("tweet sent");
                        // });
                    } catch (e) {
                        console.log('impossible de twitter le retour du film: ' + film.name);
                    }
                }
            }
        }
    });
}

