import {Marinette} from "./websites/marinette.mjs";
import {PrismaClient} from '@prisma/client';
import {TwitterApi} from "twitter-api-v2";


const client = new TwitterApi({
    appKey: 'process.env.TWITTER_API_KEY',
    appSecret: 'process.env.TWITTER_API_SECRET_KEY',
    accessToken: 'process.env.TWITTER_ACCESS_TOKEN',
    accessSecret: 'process.env.TWITTER_ACCESS_TOKEN_SECRET',
});

const websites = [new Marinette(),];

const prisma = new PrismaClient();


client.v1.tweet('Hello World!').then((val) => {
    console.log("tweeted");
}).catch((err) => {
    console.log(err)
})
websites.forEach(website => {
    const shop = prisma.shop.findFirst({
        where: {
            url: website.website
        }
    }).then(shop => {
        website.scrapFilms().then((films) => {
            films.forEach(film => {
                prisma.film.findFirst({
                    where: {
                        url: film.url
                    }
                }).then(async (result) => {
                    if (!result) {
                        prisma.film.create({
                            data: {
                                name: film.name,
                                url: film.url,
                                price: film.price,
                                isInStock: film.isInStock,
                                shopId: shop.id
                            }
                        }).then((result) => {
                            console.log("film created : " + film.name);
                        });
                    } else if (result.price !== film.price || result.isInStock !== film.isInStock) {
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
                                    price: film.price, isInStock: film.isInStock, filmId: film.id
                                }
                            }).then((result) => {
                                console.log("film history record created : " + film.name);
                            });
                        });
                        if (film.isInStock) {
                            // send tweet
                            // get key in the .env file
                        }
                    }
                });
            });
        });
        console.log(shop);
    });
});


