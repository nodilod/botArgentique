import {PrismaClient} from "@prisma/client";
import config from '../config.json' assert { type: 'json' };

const prisma = new PrismaClient();

config.shops.forEach(shop => {
    prisma.shop.findFirst({
        where: {
            url: shop.url
        }
    }).then(async (result) => {
       if (!result) {
           prisma.shop.create({
               data: {
                   name: shop.name,
                   url: shop.url
               }
           }).then((result) => {
               console.log("shop created : " + shop.name);
           });
       }
    });
});

config.filmTypes.forEach(filmType => {
    prisma.filmType.findFirst({
        where: {
            name: filmType
        }
    }).then(async (result) => {
        if (!result) {
            prisma.filmType.create({
                data: {
                    name: filmType
                }
            }).then((result) => {
                console.log("filmType created : " + filmType);
            });
        }
    });
});

config.filmFormats.forEach(filmFormat => {
    prisma.filmFormat.findFirst({
        where: {
            name: filmFormat
        }
    }).then(async (result) => {
        if (!result) {
            prisma.filmFormat.create({
                data: {
                    name: filmFormat
                }
            }).then((result) => {
                console.log("filmFormat created : " + filmFormat);
            });
        }
    });
});