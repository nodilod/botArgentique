import {Marinette} from "./websites/marinette.mjs";
import {PrismaClient} from '@prisma/client';

const websites = [
    new Marinette(),
];

const prisma = new PrismaClient();

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
                    }
                    else if (result.price !== film.price || result.isInStock !== film.isInStock) {
                        prisma.film.update({
                            where: {
                                id: result.id
                            },
                            data: {
                                price: film.price,
                                isInStock: film.isInStock
                            }
                        }).then((result) => {
                            console.log("film updated : " + film.name);
                            prisma.FilmHistoryRecord.create({
                                data: {
                                    price: result.price,
                                    isInStock: result.isInStock,
                                    filmId: result.id
                                }
                            }).then((result) => {
                                console.log("film history record created : " + film.name);
                            });
                        });
                    }
                });
            });
        });
        console.log(shop);
    });
});


