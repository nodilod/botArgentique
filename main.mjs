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
        website.scrapFilm().then((films) => {
            films.forEach(film => {
                prisma.film.findFirst({
                    where: {
                        url: film.url
                    }
                }).then((result) => {
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
                });
            });
        });
        console.log(shop);
    });
});


