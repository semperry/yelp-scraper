/* 
TODO:
Duplicate entries occasionally
Captcha occasionally
Count of how many freebies per restaurant
Generate Report
*/
const HTMLParser = require("node-html-parser");
const axios = require("axios");
const readline = require("readline");

const startTime = Date.now();
let zip;
let totalPages = 0;
let start = 0;
let currentResults = [];
const freebies = [];

const getSearchResults = (startNum) => {
	return axios.get(
		`https://www.yelp.com/search?find_desc=Restaurants+-+Takeout&find_loc=${zip}&ns=1&attrs=RestaurantsTakeOut&start=${startNum}`
	);
};

function loadingProgress() {
	setInterval(function () {
		if (start <= totalPages * 10) {
			readline.cursorTo(process.stdout, 0, 0);
			readline.clearScreenDown(process.stdout);
			console.log("Progress: ", ((start / totalPages) * 10).toFixed(2), "%");
		} else {
			clearInterval(this);
		}
	}, 500);
}

async function startSearch() {
	loadingProgress();
	while (start <= totalPages * 10) {
		await getSearchResults(start)
			.then(async (data) => {
				const root = HTMLParser.parse(data.data);
				const a = root.querySelectorAll("a[class='css-166la90']");

				if (totalPages < 1) {
					let span = root.querySelectorAll("span.css-e81eai");

					span.forEach((s) => {
						if (s.rawText.includes("1 of ")) {
							let splitString = s.rawText.split("of");
							totalPages = parseInt(splitString[1]);
						}
					});
				}

				a.forEach((link) => {
					currentResults.push(link.rawAttributes);
				});

				// Fetch Menu
				currentResults.forEach(async (result) => {
					if (result.href.includes("/biz/")) {
						const menuRl = result.href.split("?")[0].replace("/biz", "/menu");

						await axios
							.get(`https://www.yelp.com${menuRl}`)
							.then((data) => {
								const menuPage = HTMLParser.parse(data.data);
								const prices = menuPage.querySelectorAll(
									".menu-item-price-amount"
								);

								const orderButton = menuPage
									.querySelectorAll("span")
									.filter((btn) => {
										return btn.rawText === "Start Order";
									});

								if (orderButton.length) {
									for (let price in prices) {
										if (prices[price].rawText?.trim() == "$0.00") {
											freebies.push({
												[result.name]: `https://www.yelp.com${menuRl}`,
											});
											break;
										}
									}
								}
							})
							.catch((err) => err);
					}
				});

				start += 10;
				currentResults = [];
			})
			.catch((err) => err);
	}

	freebies.forEach((freebie) => {
		console.log(freebie);
	});

	const stopTime = Date.now();
	console.log("Search Time: ", (stopTime - startTime) / 1000, "seconds");
}

if (process.argv[2]) {
	zip = process.argv[2];
	startSearch();
} else {
	throw Error("Must enter a zip code as an argument in the command line:");
}
