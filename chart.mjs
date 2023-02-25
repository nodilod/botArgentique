import {PrismaClient} from "@prisma/client";
import Chart from "chart.js/auto";
import {Canvas} from "canvas";

export async function buildHistoryChart(filmsId = []) {
    const prisma = new PrismaClient();

// Récupérer les données depuis la base de données
    const filmsData = await prisma.film.findMany({
        where: {
            id: {in: filmsId}
        },
        include: {
            history: true,
            shop: true
        }
    });

    console.log(filmsData);
// Initialiser les données du graphique
    const chartData = {
        labels: [], // tableau des dates
        datasets: []
    };

// Parcourir les données de chaque film et ajouter les données correspondantes au graphique
    for (const film of filmsData) {
        const dataset = {
            label: film.name + ' - ' + film.shop.name,
            borderColor: '#FFFFFF',
            // random rgb color
            pointBackgroundColor: [] ,
            pointBorderColor: [],
            lineBorderColor: 'rgba(' + Math.floor(Math.random() * 255) + ',' + Math.floor(Math.random() * 255) + ',' + Math.floor(Math.random() * 255) + ', 1)',
            pointRadius: 5,
            fill: false,
            data: [] // tableau des données (x: date, y: prix)
        };
        for (const record of film.history) {
            const createdAt = record.createdAt.toLocaleString();
            console.log(createdAt);
            console.log(record.filmId);
            const dateIndex = chartData.labels.indexOf(createdAt);

            if (dateIndex === -1) {
                chartData.labels.push(createdAt);
                dataset.data.push({ x: createdAt, y: parseInt(record.price) });
                // make line red if isInStock is false (out of stock) and green if true (in stock)
                dataset.pointBackgroundColor.push(getPointColor(record.isInStock));
                dataset.pointBorderColor.push(getPointColor(record.isInStock));

            } else {
                dataset.data[dateIndex] = { x: createdAt , y: parseInt(record.price)};
                // make line red if isInStock is false (out of stock) and green if true (in stock)
                dataset.pointBackgroundColor.push(getPointColor(record.isInStock));
                dataset.pointBorderColor.push(getPointColor(record.isInStock));
            }
        }
        // continue la ligne jusqu'au bout
        const now = new Date().toLocaleString();
        const dateIndex = chartData.labels.indexOf(now);
        if (dateIndex === -1) {
            chartData.labels.push(now);
            dataset.data.push({ x: now, y: parseInt(film.price) });
            dataset.pointBackgroundColor.push(getPointColor(film.isInStock));
            dataset.pointBorderColor.push(getPointColor(film.isInStock));

        } else {
            dataset.data[dateIndex] = { x: now, y: parseInt(film.price)};
            dataset.pointBackgroundColor.push(getPointColor(film.isInStock));
            dataset.pointBorderColor.push(getPointColor(film.isInStock));

        }
        console.log(dataset);

        chartData.datasets.push(dataset);
    }

    // Trier les données ordre alphabétique
    chartData.labels.sort((a, b) => a.localeCompare(b));

// Générer le graphique
    chartData.labels.sort((a, b) => new Date(a) - new Date(b));
    const canvas = new Canvas(800, 600, "image");
    const ctx = canvas.getContext('2d');

    const chart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            scales: {
                x: {
                    beginAtZero: true,
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    },
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'value'
                    },
                }
            }
        }
    });

    const image = chart.toBase64Image();
    return image.split(',')[1];
    //return fs.writeFileSync('chart.png', Buffer.from(image.split(',')[1], 'base64'));
}

function getPointColor(isInStock) {
    return isInStock ? 'rgba(0, 255, 0, 1)' : 'rgba(255, 0, 0, 1)';
}