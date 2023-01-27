import got from "got";
import * as cheerio from "cheerio";

export class NationPhoto {
    website = 'https://www.nationphoto.com/';

    path = 'fr/';

    paramsFilmFormat = {
        "135": "132-films-135",
        "120": "64-films-120",
        "110": "71-films-110",
        "instant": "72-films-instantanes",
        "large": "92-plans-films-4x5",
    }

    async scrapFilms() {
        console.log('Scraping ' + this.website + '...');

        return new Promise(async function (resolve, reject) {
            const films = [];
            const nationPhoto = new NationPhoto();

            for (const valueFormat of Object.entries(nationPhoto.paramsFilmFormat)) {
                const formatName = valueFormat[0];
                const formatValue = valueFormat[1];

                const url = nationPhoto.website + nationPhoto.path + formatValue;

                let page = 1;
                let isError = false;

                while (!isError) {
                    //console.log("recuperation de la page " + page + "pour le format" + formatName);
                    const response = await got(url + '?page=' + page);

                    const $ = cheerio.load(response.body);
                    const products = $('.product-miniature');
                    if (products.length === 0) {
                        isError = true;
                    } else {
                        products.each((i, product) => {
                            const $film = $(product);
                            const film = {}
                            film.name = $film.find('.product-title').text().trim();
                            film.url = $film.find('.product-title a').attr('href');
                            film.price = $film.find('.price').text().trim().replace(/[^0-9,]/g, '');
                            film.isInStock = !$film.find('.add-to-cart').hasClass('disabled');
                            film.format = formatName;
                            films.push(film);
                        });
                    }
                    page++;
                }
            }
            resolve(films);
        });
    }
}