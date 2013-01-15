var posts,        //content
    next,         //next page
    o,            //opacity scale
    r,            //radius scale
    z,            //color scale
    w = 960,      //width
    h = 600,      //height
    m = 20,       //margin
    t = {         //time factors
        minutes : 1,
        hour    : 60,
        hours   : 60,
        day     : 1440,
        days    : 1440
    },
    svg = d3.select("body article")
        .append("svg")
        .attr("height", h + "px")
        .attr("width", w + "px"),
    tooltip = CustomTooltip( "gates_tooltip", 240 );


// Get data and start visualization.
// "http://hndroidapi.appspot.com/newest/format/json/page/?appid=vishna"
d3.json("data.json", function(error, data){

    posts = data.items;
    next = posts.pop();

    posts.map( function(d) {
        var comments = parseInt( d.comments ),
            score    = parseInt( d.score ),
            time     = d.time.split(" ");

        d.comments = comments ? comments : 0;
        d.score = score ? score : 0;
        d.time = time[ 0 ] * t[ time[ 1 ] ];

        return d;

        });

    // Defining the scales
    r = d3.scale.linear()
        .domain([ d3.min(posts, function(d) { return d.score; }),
                  d3.max(posts, function(d) { return d.score; }) ])
        .range([ 10, 130 ]);

    z = d3.scale.linear()
        .domain([ d3.min(posts, function(d) { return d.comments; }),
                  d3.max(posts, function(d) { return d.comments; }) ])
        .range([ '#ff7f0e', '#ff7f0e' ]);

    o = d3.scale.linear()
        .domain([ d3.min(posts, function(d) { return d.time; }),
                  d3.max(posts, function(d) { return d.time; }) ])
        .range([ 1, 0.2 ]);


    launch();
    legend();

});

function launch() {

    var gravity = -0.03,
        damper = 0.1,
        center = {
            x : ( w - m ) / 2,
            y : ( h - m ) / 2
        },
        friction = 0.9,
        force = d3.layout.force()
            .size([ w - m, h - m ]);

    force
        .nodes(posts);

    var circles = svg
            .append("g")
            .attr("id", "circles")
            .selectAll("a")
            .data(force.nodes());

    // Init all circles at random places on the canvas
    force.nodes().forEach( function(d, i) {
        d.x = Math.random() * w;
        d.y = Math.random() * h;
    });

    var node = circles
            .enter()
            .append("a")
            .attr("xlink:href", function(d) { return d.url; })
            .append("circle")
            .attr("r", 0)
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            .attr("fill", function(d) { return z( d.comments ); })
            .attr("stroke-width", 2)
            .attr("stroke", function(d) { return d3.rgb(z( d.comments )).darker(); })
            .attr("id", function(d) { return "post_#" + d.item_id; })
            .attr("title", function(d) { return d.title; })
            .style("opacity", function(d) { return o( d.time ); })
            .on("mouseover", function(d, i) { force.resume(); showDetails( d, i, this ); })
            .on("mouseout", function(d, i) { hideDetails( d, i, this ); });

    d3.selectAll("circle")
        .transition()
        .delay(function(d, i) { return i * 10; })
        .duration( 1000 )
        .attr("r", function(d) { return r( d.score ); });

    loadGravity( moveCenter );

    //Register onChange function
    d3.selectAll("[name='source']").on("change", function change() {
        var filter;
        switch(this.value){
        case("frontpage"): ; break;
        }

        loadGravity( filter );
    });

    //Loads gravity
    function loadGravity( generator ) {
        force
            .gravity(gravity)
            .charge( function(d) { return -d.score * 2; })
            .friction(friction)
            .on("tick", function(e) {
                generator(e.alpha);
                node
                    .attr("cx", function(d) { return d.x; })
                    .attr("cy", function(d) { return d.y; });
            }).start();
    }

    // Generates a gravitational point in the middle
    function moveCenter( alpha ) {
        force.nodes().forEach(function(d) {
            d.x = d.x + (center.x - d.x) * (damper + 0.02) * alpha;
            d.y = d.y + (center.y - d.y) * (damper + 0.02) * alpha;
        });
    }

}

function legend() {

    var linearGradient = svg.append("defs")
            .append("linearGradient")
            .attr("id", "legendGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%")
            .attr("spreadMethod", "pad");

    linearGradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#ff7f0c")
        .attr("stop-opacity", "0.1");

    linearGradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#ff7f0c")
        .attr("stop-opacity", "1");


    var legend = svg.append("g")
            .attr("id", "legend");

    legend
        .append("rect")
        .attr("x", "20")
        .attr("y", "20")
        .attr("width", "20")
        .attr("height", "200")
        .attr("style", "fill:url(#legendGradient);");

    legend
        .append("text")
        .attr("x", 45)
        .attr("y", 30)
        .text("Oldest");

    legend
        .append("text")
        .attr("x", 45)
        .attr("y", 220)
        .text("Newest");

}

function showDetails( data, i, element ) {
    d3.select( element ).attr( "stroke", "black" );
    var content = '<span class=\"name\">' + data.title + '</span><br/>';
    content += '<a href=\"http://news.ycombinator.com/item?id='+ data.item_id +'\">' + data.description + '</a>';

    tooltip.showTooltip(content, d3.event);
}


function hideDetails(data, i, element) {
    d3.select(element).attr("stroke", function(d) { return d3.rgb( z( d.comments )).darker(); });
    //tooltip.hideTooltip();
}