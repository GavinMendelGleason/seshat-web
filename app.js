const app = require("express")()
const TerminusDBClient = require("@terminusdb/terminusdb-client")
const WOQL=TerminusDBClient.WOQL
const Mustache = require('mustache')
const fs = require('fs')

const team = process.env.TERMINUSDB_TEAM
const key = process.env.TERMINUSDB_ACCESS_TOKEN
const url = `https://cloud.terminusdb.com/${team}/`
const client = new TerminusDBClient.WOQLClient(url,
                                               {user:"jacobian@gmail.com",
                                                organization:team})
client.setApiKey(key)

const PORT = process.env.PORT || 3000;

function Var(name) { this.name = name }

const TEMPL = `
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Seshat Polity Graph</title>
</head>
<body>


<div id="svgcontainer">
</div>

<script src="https://d3js.org/d3.v7.min.js"></script>

<script>

var run = function(response){
    var data = {{{json}}}

    // Copyright 2021 Observable, Inc.
    // Released under the ISC license.
    // https://observablehq.com/@d3/force-directed-graph
    function ForceGraph({
        nodes, // an iterable of node objects (typically [{id}, …])
        links // an iterable of link objects (typically [{source, target}, …])
    }, {
        nodeId = d => d.id, // given d in nodes, returns a unique identifier (string)
        nodeGroup, // given d in nodes, returns an (ordinal) value for color
        nodeGroups, // an array of ordinal values representing the node groups
        nodeTitle, // given d in nodes, a title string
        nodeFill = "currentColor", // node stroke fill (if not using a group color encoding)
        nodeStroke = "#fff", // node stroke color
        nodeStrokeWidth = 1.5, // node stroke width, in pixels
        nodeStrokeOpacity = 1, // node stroke opacity
        nodeRadius = 15, // node radius, in pixels
        nodeStrength,
        linkSource = ({source}) => source, // given d in links, returns a node identifier string
        linkTarget = ({target}) => target, // given d in links, returns a node identifier string
        linkStroke = "#999", // link stroke color
        linkStrokeOpacity = 0.6, // link stroke opacity
        linkStrokeWidth = 2.5, // given d in links, returns a stroke width in pixels
        linkStrokeLinecap = "round", // link stroke linecap
        linkStrength = .05,
        colors = d3.schemeTableau10, // an array of color strings, for the node groups
        width = 640, // outer width, in pixels
        height = 400, // outer height, in pixels
        invalidation // when this promise resolves, stop the simulation
    } = {}) {
        // Compute values.
        const N = d3.map(nodes, nodeId).map(intern);
        const LS = d3.map(links, linkSource).map(intern);
        const LT = d3.map(links, linkTarget).map(intern);
        if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
        const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
        const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
        const W = typeof linkStrokeWidth !== "function" ? null : d3.map(links, linkStrokeWidth);

        // Replace the input nodes and links with mutable objects for the simulation.
        nodes = d3.map(nodes, (_, i) => ({id: N[i]}));
        links = d3.map(links, (_, i) => ({source: LS[i], target: LT[i]}));

        // Compute default domains.
        if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);

        // Construct the scales.
        const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

        // Construct the forces.
        const forceNode = d3.forceManyBody();
        const forceLink = d3.forceLink(links).id(({index: i}) => N[i]);
        if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
        if (linkStrength !== undefined) forceLink.strength(linkStrength);

        const simulation = d3.forceSimulation(nodes)
              .force("link", forceLink)
              .force("charge", forceNode)
              .force("center",  d3.forceCenter())
              .on("tick", ticked);

        const svg = d3.create("svg")
              .attr("width", width)
              .attr("height", height)
              .attr("viewBox", [-width / 2, -height / 2, width, height])
              .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

        const link = svg.append("g")
              .attr("stroke", linkStroke)
              .attr("stroke-opacity", linkStrokeOpacity)
              .attr("stroke-width", typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null)
              .attr("stroke-linecap", linkStrokeLinecap)
              .selectAll("line")
              .data(links)
              .join("line");

        const node = svg.append("g")
              .attr("fill", nodeFill)
              .attr("stroke", nodeStroke)
              .attr("stroke-opacity", nodeStrokeOpacity)
              .attr("stroke-width", nodeStrokeWidth)
              .selectAll("circle")
              .data(nodes)
              .join("circle")
              .attr("r", nodeRadius)
              .call(drag(simulation));

        if (W) link.attr("stroke-width", ({index: i}) => W[i]);
        if (G) node.attr("fill", ({index: i}) => color(G[i]));
        if (T) node.append("title").text(({index: i}) => T[i]);
        if (invalidation != null) invalidation.then(() => simulation.stop());

        function intern(value) {
            return value !== null && typeof value === "object" ? value.valueOf() : value;
        }

        function ticked() {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
        }

        function drag(simulation) {
            function dragstarted(event) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }

            function dragged(event) {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }

            function dragended(event) {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }

            return d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        }

        return Object.assign(svg.node(), {scales: {color}});
    }

    chart = ForceGraph(data, {
        nodeId: d => d['@id'],
        nodeGroup: d => d['@type'],
        nodeTitle: d => \`\${d.name}\`,
        linkStrokeWidth: l => Math.sqrt(l.weight),
        width : 1900,
        height: 1200,
        invalidation : null // a promise to stop the simulation when the cell is re-run
    })

    var svg = document.getElementById("svgcontainer").append(chart)

};

run();
</script>
</body>
`

app.get("", (req, res) => {
    client.connect().then(()=>{
        client.db('seshat')
        const preq = {
            "type": "PrecedingPolity",
        }
        pre_results_promise = client.queryDocument(preq, { as_list : true } )
        const nodes = WOQL.path("v:@id",'general_variables,original_name,known,value', "v:name", "v:path")
        pre_node_results = client.query(nodes);
        Promise.all([pre_results_promise, pre_node_results])
            .then(response => {
                var links = []
                var nodes = []
                pre_result = response[0];
                pre_nodes = response[1]['bindings'];

                for (i = 0; i < pre_result.length; i++) {
                    links.push( { 'source' : pre_result[i]['preceding'],
                                  'target' : pre_result[i]['polity'],
                                  'weight' : 90})
                }
                var nodes = []
                for (i = 0; i < pre_nodes.length; i++) {
                    var node = {}
                    node['name'] = pre_nodes[i]['name']['@value']
                    node['@id'] = pre_nodes[i]['@id']
                    nodes.push(node)
                }
                link_string = JSON.stringify([...new Set(links)]);
                node_string = JSON.stringify([...new Set(nodes)]);
                var js = `{ 'nodes' : ${node_string}, 'links' : ${link_string} }`

                var output = Mustache.render(TEMPL, {json : js});
                res.send(output)
            })
    }).catch((err)=>{
        console.error(err);
    });
});

app.listen(PORT, () => {
  console.log(`App up at port ${PORT}`)
});

