import {Marinette} from "./websites/marinette.mjs";
import {PrismaClient} from '@prisma/client';
import {TwitterApi} from "twitter-api-v2";
import config from './config.json' assert { type: 'json' };

const websites = [new Marinette(),];

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
                            prisma.filmType.findFirst({
                                where: {
                                    name: film.type
                                }
                            }).then(async (filmType) => {
                                prisma.film.create({
                                    data: {
                                        name: film.name,
                                        url: film.url,
                                        price: film.price,
                                        isInStock: film.isInStock,
                                        shopId: shop.id,
                                        filmTypeId: filmType.id
                                    }
                                }).then((result) => {
                                    console.log("film created : " + film.name);
                                });
                            });
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
                        if (result.isInStock !== film.isInStock && film.isInStock) {
                            client.v1.tweet(
                                `/!\\ ceci est un test !!!!! ce n'est pas réel(déso). Le film ${film.name} est de nouveau disponible sur ${website.website} ! ${film.url}`
                            ).then((result) => {
                                console.log("tweet sent");
                            });
                        }
                    });
                }
            });
        });
        console.log(shop);
    });
});


