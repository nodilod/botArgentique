import got from "got";
import * as cheerio from "cheerio";

export class SafeLight {
    website = 'https://safelightberlin.com/';
    websiteForURL = 'https://safelightberlin.com';

    path = 'collections/film';


    async scrapFilms() {
        console.log('Scraping ' + this.website + '...');

        return new Promise(async function (resolve, reject) {
            const films = [];
            const safeLight = new SafeLight();


            const url = safeLight.website + safeLight.path;
            let page = 1;
            let isError = false;
            while (!isError) {
                // console.log("recuperation de la page " + page);
                const response = await got(url + '?page=' + page);

                const $ = cheerio.load(response.body);
                const products = $('.grid-product__content');
                if (products.length === 0) {
                    isError = true;
                } else {
                    products.each(async (i, product) => {
                        const $film = $(product);
                        const film = {
                            name: $film.find('.grid-product__title').text().trim(),
                            url: safeLight.websiteForURL + $film.find('a').attr('href'),
                            price: $film.find('.grid-product__price').text().trim().replace('.',',').replace(/[^0-9,]/g, ''),
                            isInStock: $film.find('.grid-product__tag.grid-product__tag--sold-out').text().trim() !== 'Sold Out',
                        };
                        films.push(film);
                    });
                }
                page++;
            }
            resolve(films);
        });
    }
}