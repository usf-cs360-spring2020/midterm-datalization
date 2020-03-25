let createAreaChart = function(file){
	let dateParser = d3.timeParse("%m/%d/%Y");

	// Selects only the relevant fields to save
	d3.csv(file, function(d) {

		let res = {
			"call_date": dateParser(d["Call Date"]),
			"call_group": d["Custom Grouping"],
			"count": +d["counts"]

		};

		return res

	}).then(function(data) {

		console.log(data);

		// Must sort the data by call date before we can do anything
		data.sort(function(x, y){
			return d3.ascending(x.call_date, y.call_date);
		})

		drawEverything(data);
	});
}


let drawEverything = function(data) {

	// First, let's create some constants for use latter 
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

	// Get the SVG
	const svg = d3.select("body").select("svg#viz")
		.attr("width", width)
		.attr("height", height);
	console.assert(svg.size() == 1);

	// Create a plot
	const plot = svg.append("g").attr("id", "plot")
		.attr("transform", translate(margin.left, margin.top));

	const values = Array.from(d3.rollup(data, ([d]) => d.count, d => +d.call_date, d => d.call_group));
	const groups = ["Various Other", "Rescue", "Misc Emergency", "Medical", "Fire", "Chemical / Electrical", "Aid Other Agency"];

	// convert the data to a series
	const series = d3.stack()
		.keys(groups)
		.value(function([, values], key) {
			if (isNaN(values.get(key))) {
			 	return 0;
			}
			return values.get(key);
		})
		.order(d3.stackOrderNone)
		(values);

	// scalers can't be in a specific function, because they're used by all / multiple. :(
	// x scale, which should be time
	const x = d3.scaleUtc()
		.domain(d3.extent(data, d => d.call_date))
		.range([0, plotWidth]);

	// y scale, total count
	const y = d3.scaleLinear()
		.domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
		.range([plotHeight, 0])

	// Area
	let area = d3.area()
		.x(d => x(d.data[0]))
		.y0(d => y(d[0]))
		.y1(d => y(d[1]));

	// Needs a better name
	const color = d3.scaleOrdinal()
		.range(d3.schemeSpectral[7].reverse())
		.domain(groups);


	// // Now, let's call the key functions that actually do everything 
	drawArea();
	drawAxes();
	drawLegend();
	addInteractivity();

	// Finally, we need to actually implement those functions
	function drawArea () {
		console.log("In draw Area")

		let drawnArea = plot.append("g")
			.attr("id", "area")
			.selectAll("path")
			.data(series);

		drawnArea.enter().append("path")
			.join("path")
			.attr("fill", ({key}) => color(key))
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
			// .tickFormat(d3.formatPrefix(".0", 1e3));

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
			.attr("fill", d => color(d))

		// Label each item in the legend
		legendItem.enter().append("text")
			.attr("class", "legend-labels")
			.attr("transform", d=> translate(25, legendScale(d)+20))
			.text(d => d);
	}

	function addInteractivity(){

		let area = svg.select("g#area").selectAll("path");

		area.on("mouseover.hover", function(d) {
			// console.log("on hover, with data: ", d)

			let me = d3.select(this);

			let div = d3.select("body").select("div.site").append("div")
				.attr("id", "details")
				.attr("class", "tooltip")
				.style("display", "inline-block");

			let tmp_data = {
				"Call Group": "Medical",
				"Call Date": "3/24/15",
				"count": 9
			}

			// I can't get the table to show up, over everything else. 
			// Probably due to it's positioning, but I'm not sure.

			let rows = div.append("table")
				.selectAll("tr")
				.data(Object.keys(tmp_data))
				.enter()
				.append("tr");

			rows.append("th").text(key => key);
			rows.append("td").text(key => tmp_data[key]);

		});

		area.on("mousemove.hover", function(d) {
			console.log("In mousemove")

			let div = d3.select("div#details");

			// get height of tooltip
			let bbox = div.node().getBoundingClientRect();

			console.log(d3.event.clientX, (d3.event.clientY - bbox.height))


			div.style("left", d3.event.clientX + "px")
			div.style("top",  (d3.event.clientY - bbox.height) + "px");
		});

		area.on("mouseout.hover", function(d) {
			d3.selectAll("div#details").remove();
		});
	}
};


//Helper functions, to make life easier
let translate = function(x, y) {
	return 'translate(' + x + ',' + y + ')';
}



