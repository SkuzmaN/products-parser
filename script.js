var fs = require("fs"),
    byline = require("byline"),
    path = require("path");
const Json2csvParser = require("json2csv").Parser;

const INDEXES = {
    PLU: 0,
    NAME: 1,
    VAT: 2,
    PRICE: 8
};

const CSV_HEADERS = ["PLU", "Nazwa", "Vat", "Cena"];
const INPUT_FILE = "TOWARY.txt";
const OUTPUT_FILE = "output.csv";

const outputPath = path.join(__dirname, OUTPUT_FILE);

fs.unlink(outputPath, function(err) {});

var stream = fs.createReadStream(INPUT_FILE);
stream = byline.createStream(stream, { encoding: "utf8" });

function parsePLU(data) {
    const regex = /\$(0*)(\d+)/g;
    const [, , plu] = regex.exec(data);
    return plu;
}

function parseName(data) {
    return data.trim();
}

function parseVat(data) {
    switch (parseInt(data.trim(), 10)) {
        case 1:
            return "23%";
        case 2:
            return "8%";
        case 4:
            return "5%";
        default:
            return "";
    }
}

function parsePrice(data) {
    return (parseInt(data.trim(), 10) / 100).toFixed(2);
}

const parsedData = [];
stream.on("data", function(line) {
    if (line[0] === "$") {
        const splittedRow = line.split(/\t+/);
        const parsedRow = {
            [CSV_HEADERS[0]]: parsePLU(splittedRow[INDEXES.PLU]),
            [CSV_HEADERS[1]]: parseName(splittedRow[INDEXES.NAME]),
            [CSV_HEADERS[2]]: parseVat(splittedRow[INDEXES.VAT]),
            [CSV_HEADERS[3]]: parsePrice(splittedRow[INDEXES.PRICE])
        };

        parsedData.push(parsedRow);
    }
});

stream.on("end", function() {
    try {
        const parser = new Json2csvParser({
            fields: CSV_HEADERS
        });
        const csv = parser.parse(parsedData);
        fs.writeFile(outputPath, csv, function(err) {
            if (err) {
                console.error("Błąd zapisu");
            }
        });
    } catch (err) {
        console.error(err);
    }
});
