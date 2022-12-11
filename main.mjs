import {Marinette} from "./websites/marinette.mjs";
import {PrismaClient} from '@prisma/client';
import {TwitterApi} from "twitter-api-v2";
import config from './config.json' assert { type: 'json' };
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

websites.forEach(website => {
    const shop = prisma.shop.findFirst({
        where: {
            url: website.website
        }
    }).then(shop => {
        website.scrapFilms().then((films) => {
            films.forEach(film => {
                if(!config.bugFilm.includes(film.url)) {
                    prisma.film.findFirst({
                        where: {
                            url: film.url
                        }
                    }).then(async (result) => {
                        if (!result) {
                            const filmType = film.type ? await prisma.filmType.findFirst({where: {name: film.type}}) : {id : null};
                            const filmFormat = film.format ? await prisma.filmFormat.findFirst({where: {name: film.format}}) : {id : null};
                            console.log(filmType, film.type);
                            console.log(filmFormat, film.format);
                            try {
                                prisma.film.create({
                                    data: {
                                        name: film.name,
                                        url: film.url,
                                        price: film.price,
                                        isInStock: film.isInStock,
                                        shopId: shop.id,
                                        filmTypeId: filmType.id,
                                        filmFormatId: filmFormat.id ,
                                    }
                                }).then((result) => {
                                    console.log("film created : " + film.name);
                                    try {
                                        // client.v1.tweet(
                                        //     `Le film ${film.name} est disponible sur ${shop.name} ! ${film.url}`
                                        //     ).then((result) => {
                                        //     console.log("tweet sent");
                                        // });
                                    } catch (e) {
                                        console.log( 'impossible de twitter la nouveautée du film: ' + film.name + ' : ' + e);
                                    }
                                });
                            } catch (e) {
                                console.log('impossible to create film : ' + film.name);
                            }
                        } else if (result.price !== film.price || result.isInStock !== film.isInStock) {
                            console.log("film updated : " + film.name);
                            prisma.film.update({
                                where: {
                                    id: result.id
                                }, data: {
                                    price: film.price, isInStock: film.isInStock
                                }
                            }).then((result) => {
                                console.log("film updated : " + film.name);
                                prisma.FilmHistoryRecord.create({
                                    data: {
                                        price: film.price, isInStock: film.isInStock, filmId: result.id
                                    }
                                }).then((result) => {
                                    console.log("film history record created : " + film.name);
                                });
                            });

                        }
                        //if film is back in stock, send a tweet
                        if (result && result.isInStock !== film.isInStock && film.isInStock) {
                            try {
                                // client.v1.tweet(
                                //     `Le film ${film.name} est de nouveau disponible sur ${website.website} ! ${film.url}`
                                // ).then((result) => {
                                //     console.log("tweet sent");
                                // });
                            } catch (e) {
                                console.log('impossible de twitter le retour du film: ' + film.name + ' : ' + e);
                            }
                        }
                    });
                }
            });
        });
        console.log(shop);
    });
});


