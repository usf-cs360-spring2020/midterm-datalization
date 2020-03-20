let createAreaChart = function(file){
	let dateParser = d3.timeParse("%m/%d/%Y");

	// Selects only the relevant fields to save
	d3.csv(file, function(d) {

		let res = {
			"call_date": dateParser(d["Call Date"]),
			"aid": +d["Aid Other Agency"],
			"chem_elec": +d["Chemical / Electrical"],
			"fire": +d["Fire"],
			"medical": +d["Medical"],
			"misc": +d["Misc Emergency"],
			"rescue": +d["Rescue"],
			"other": +d["Various Other"]

		};

		return res

	}).then(function(data) {

		console.log(data);
		// might have to group the data together by call group
		drawEverything(data);
	});
}


let drawEverything = function(data) {

	// First, let's create some constants for use latter 
	
	const fields = Object.keys(data[0]).filter( item => item != "call_group");

	const groups = ["Various Other", "Rescue", "Misc Emergency", "Medical", "Fire", "Chemical / Electrical", "Aid Other Agency"];
	const group_map = {
		"aid": "Aid Other Agency",
		"chem_elec": "Chemical / Electrical",
		"fire": "Fire",
		"medical": "Medical",
		"misc": "Misc Emergency",
		"rescue": "Rescue",
		"other": "Various Other"
	};

	const total_emergencies = findMaxEmergencies(data); // Name is a bit misleading, it's actually the most emergencies in a given year.

	const width = 1140; // ~960 for viz, ~130 for legend 
	const height = 500;

	const margin = {
		top:	30,
		right:	220, // ~130 for legend, plus a gap on either side
		bottom: 20,
		left:	40
	};

	const plotWidth = width - margin.right - margin.left;
	const plotHeight = height - margin.top - margin.bottom;

	//Need to convert the data to a series
	const series = d3.stack().keys(["aid", "chem_elec", "fire", "medical", "misc", "rescue", "other"])(data)
	console.log(series)

	// Get the SVG
	const svg = d3.select("body").select("svg#viz")
		.attr("width", width)
		.attr("height", height);
	console.assert(svg.size() == 1);

	// Create a plot
	const plot = svg.append("g").attr("id", "plot")
		.attr("transform", translate(margin.left, margin.top));

	// scalers can't be in a specific function, because they're used by all / multiple. :(

	// y scale, total count
	const y = d3.scaleLinear()
		.domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
		.range([plotHeight, 0])


	// x scale, which should be time
	const x = d3.scaleUtc()
		.range([0, plotWidth])
		.domain(d3.extent(data, d => d.call_date));


	// Area
	const area =  d3.area()
		.x(d => x(d.data.call_date))
		.y0(d => y(d[0]))
		.y1(d => y(d[1]));

	// Needs a better name
	const colorScale = d3.scaleOrdinal()
		.range(d3.schemeYlGnBu[7])
		.domain(groups);

	// Now, let's call the key functions that actually do everything 
	drawArea(data);
	drawAxes();
	drawLegend();

	// Finally, we need to actually implement those functions
	function drawArea (data) {
		console.log("In draw Area")

		let drawnArea = plot.append("g")
			.attr("id", "area")
			.selectAll("path")
			.data(series);

		drawnArea.enter().append("path")
			.join("path")
			.attr("fill", ({key}) => colorScale(group_map[key]))
			.attr("d", area);

	}

	function drawAxes() {
		console.log("In draw axes")

		let xAxis = d3.axisBottom(x);

		plot.append("g")
			.attr("id", "x-axis")
			.attr("transform", translate(0, plotHeight))
			.call(xAxis);

		let yAxis = d3.axisLeft(y)
			.tickFormat(d3.formatPrefix(".0", 1e3));

		plot.append("g")
			.attr("id", "y-axis")
			.call(yAxis);

	}

	function drawLegend () {
		console.log("In draw legend")

		// Needed to position the legend
		let legendX = width - margin.right + 60

		// Must make a scale, of the distance between each legend item
		const legendScale = d3.scalePoint()
			.range([plotHeight/3, 0])
			.domain(groups);

		let legend = svg.append("g").attr("id", "legend")
			.attr("transform", translate(legendX, 20));


		// legend title
		legend.append("text")
			.attr("class","legend-title")
			.text("Call Group");

		let legendItem = legend.selectAll("x-axis")
			.data(groups);


		// Add A colored rect for each item
		legendItem.enter().append("rect")
			.attr("class", "legend-squares")
			.attr("transform", d=> translate(0, legendScale(d)+8))
			.attr("width", 15)
			.attr("height", 15)
			.attr("fill", d => colorScale(d))

		// Label each item in the legend
		legendItem.enter().append("text")
			.attr("class", "legend-labels")
			.attr("transform", d=> translate(25, legendScale(d)+20))
			.text(d => d);
	}
};


//Helper functions, to make life easier
let translate = function(x, y) {
	return 'translate(' + x + ',' + y + ')';
}

let findMaxEmergencies = function(data){
	// This helper function simply gets the total number of emergencies for each year, and finds the max of those
	let years = {};

	for (let d of data) {
		let currYear = d.call_date.getFullYear();

		if (currYear in years) {
			years[currYear] = years[currYear] + d.aid + d.chem_elec + d.fire + d.medical + d.misc + d.rescue + d.other;
		}

		else {
			years[currYear] = d.aid + d.chem_elec + d.fire + d.medical + d.misc + d.rescue + d.other;
		}
	}

	return d3.max(Object.values(years));
}



