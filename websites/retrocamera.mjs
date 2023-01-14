import got from "got";
import * as cheerio from "cheerio";
export class Retrocamera {
    website = 'https://www.retrocamera.be/';

    path = 'fr/';

    paramsFilmType = {
        "colorNegative": "?type-de-film=negatif-couleur",
        "colorSlide": "?type-de-film=diapo-couleur",
        "blackAndWhite": "??type-de-film=negatif-noir-et-blanc",
        "blackAndWhiteSlide": "?ype-de-film=diapo-noir-et-blanc",
    }

    paramsFilmFormat = {
        "135": "26-film-35mm", "120": "30-film-120", "large": "107-films-plans",
    }

    async scrapFilms() {
        console.log('Scraping ' + this.website + '...');

        return new Promise(async function (resolve, reject) {
            const films = [];
            const retrocamera = new Retrocamera();
            let firstProductOfPage = null ;

            for (const valueFormat of Object.entries(retrocamera.paramsFilmFormat)) {
                const formatName = valueFormat[0];
                const formatValue = valueFormat[1];
                for (const valueType of Object.entries(retrocamera.paramsFilmType)) {
                    const typeName = valueType[0];
                    const typeValue = valueType[1];
                    const url = retrocamera.website + retrocamera.path + formatValue + typeValue;

                    let page = 1;
                    let isError = false;

                    while (!isError) {
                        console.log("recuperation de la page " + page + "pour le format" + formatName + " pour le type " + typeName);
                        const response = await got(url + '&page=' + page);

                        const $ = cheerio.load(response.body);

                        const products = $('.ajax_block_product');

                        if (products.length === 0) {
                            isError = true;
                        } else {
                            let firstProduct = $(products.first()).find('.product-title a').attr('href');
                            if (firstProductOfPage === firstProduct) {
                                isError = true;
                            } else {
                                firstProductOfPage = firstProduct;
                            }

                            products.each((i, product) => {
                                const $film = $(product);
                                const film = {}
                                film.name = $film.find('.product-title').text().trim();
                                film.url = $film.find('.product-title a').attr('href');
                                film.price = $film.find('.price').text().trim().replace(/[^0-9,]/g, '');
                                film.isInStock = !!$film.find('.add_to_cart:not(.disabled)');
                                film.type = typeName;
                                film.format = formatName;
                                films.push(film);
                            });
                        }
                        page++;
                    }
                }
            }
            resolve(films);
        });
    }
}