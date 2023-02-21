import {Marinette} from "./websites/marinette.mjs";
import config from './config.json' assert {type: 'json'};
import {Fotoimpex} from "./websites/fotoimpex.mjs";
import Twitter from "twit";
import {PrismaClient} from "@prisma/client";
import {Retrocamera} from "./websites/retrocamera.mjs";
import {NationPhoto} from "./websites/nationphoto.mjs";
import {Mori} from "./websites/mori.mjs";

export async function main(tweet) {

    const messages = [];

    const websites = [
        new Marinette(),
        new Fotoimpex(),
        new Retrocamera(),
        new NationPhoto(),
        new Mori()
    ];

    const prisma = new PrismaClient();

    const client = new Twitter({
        consumer_key: process.env.TWITTER_API_KEY,
        consumer_secret: process.env.TWITTER_API_SECRET_KEY,
        access_token: process.env.TWITTER_ACCESS_TOKEN,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    // check si le dernier scan a été fait il y a plus de 1h
    const lastScan = await prisma.Execution.findFirst({
        orderBy: {
            date: 'desc'
        }
    });
    if (lastScan && lastScan.date > new Date(new Date().getTime() - 60 * 60 * 1000)) {
        messages.push("Le dernier scan a été fait il y a moins d'une heure !");
        return messages;
    } else {
        // boucle principal fetch tout les sites en simultané
        await Promise.all(websites.map(website => website.scrapFilms().then(
            async (films) => {
                const shop = await prisma.shop.findFirst({
                    where: {
                        url: website.website
                    }
                });
                const shopAsFilms = await prisma.film.findFirst({
                    where: {
                        shopId: shop.id
                    }
                })

                for (const film of films) {
                    // certaines pellicules sont bugger, pour eviter de tweet a chaque lancement on les ignores
                    if (!config.bugFilm.includes(film.url)) {
                        const result = await prisma.film.findFirst({
                            where: {
                                url: film.url
                            }
                        })
                        if (!result) {
                            // si la pellicule n'est pas en bd : création et tweet
                            const filmType = film.type ? await prisma.filmType.findFirst({where: {name: film.type}}) : {id: null};
                            const filmFormat = film.format ? await prisma.filmFormat.findFirst({where: {name: film.format}}) : {id: null};
                            try {
                                //création de la pellicule
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

                                // création de son historique
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

                            // verification si le vendeur as deja des pellicules en bd : sécuritée si c'est la premiere execution du sript sur ce site pour eviter le span de tweet
                            if (shopAsFilms && film.isInStock) {
                                const message = `Le film ${film.name} est disponible sur ${shop.name} ! Au prix de ${film.price}€  ${film.url}`;
                                messages.push(message);
                                if (tweet) {
                                    try {
                                        await client.post('/statuses/update', {
                                            status: message
                                        });
                                        console.log("tweet envoyé: " + film.name);
                                    } catch (e) {
                                        console.log('erreur lors de l\'envoi du tweet');
                                    }
                                }
                            }
                        } else if (result.price !== film.price || result.isInStock !== film.isInStock) {
                            // si la pellicule existe mais a changer de prix ou de statut de stock (en stock ou pas) : création d'une ligne à son historique
                            console.log("film updated: " + film.name);
                            // modificationd es information de la pellicule
                            try {
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

                            // création d'une ligne d'historique
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
                            const message = `Le film ${film.name} est de nouveau disponible sur ${shop.name} ! Au prix de ${film.price}€  ${film.url}`;
                            messages.push(message);
                            if (tweet) {
                                try {
                                    await client.post('/statuses/update', {
                                        status: message
                                    });
                                    console.log("tweet envoyé: " + film.name);
                                } catch (e) {
                                    console.log('impossible de twitter le retour du film: ' + film.name);
                                }
                            }

                        }
                    }
                }
            }
        )));

        // création d'une ligne d'historique c'execution pour garder un historique
        prisma.Execution.create({
            data: {}
        }).then(() => {
            console.log("execution créée");
        })

        // etre sur que tout les sites sont fetch avant de retourner les messages
        return messages;
    }
}