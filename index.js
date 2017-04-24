const request = require('request-promise');
const cheerio = require('cheerio');

const getDaysBetween = (start, end) => {
	const days = [];
	while (start <= end) {
		days.push(start);
		const nextDay = new Date(start);
		nextDay.setDate(start.getDate() + 1);
		start = nextDay;
	}
	return days;
}
const fetchAirCourtHTML = (date) => {
	const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
	const url = `http://www.aircourts.com/index.php/site/ophelia_view_club/139/${dateString}`;
	console.log(`Requesting ${url}`);
	return request(url);
}
const getAirCourtTermsFor = (date) => {
	return fetchAirCourtHTML(date)
		.then((html) => {
			const $ = cheerio.load(html);
			const times = $('[date-type=available] span')
					.toArray()
					.filter((el) => $(el).closest('tr').next().find('[date-type=available]').length > 0)
					.map((el) => $(el).text());
			return { date, times }; 
		});
}
const buildDoodleURI = (terms) => {
	return terms.reduce((url, { date, times }) => {
		const year = date.getFullYear();
		const month = `0${date.getMonth() + 1}`.slice(-2);
		const day = `0${date.getDate()}`.slice(-2);

		const paramKey = `${year}${month}${day}`;
		const paramValue = times.reduce((val, time) => `${val}${time}||`, '');

		return `${url}&${paramKey}=${paramValue}`;	
	}, 'http://doodle.com/create?type=date');
}

const startDate = new Date(process.argv[2]);
const endDate = new Date(process.argv[3]);
const daysBetween = getDaysBetween(startDate, endDate);

Promise
	.all(daysBetween.map(getAirCourtTermsFor))
	.then(buildDoodleURI)
	.then(console.log)
	.catch(console.error);
