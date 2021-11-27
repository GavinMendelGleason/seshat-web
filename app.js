const app = require("express")();
const TerminusDBClient = require("@terminusdb/terminusdb-client")
const Mustache = require('mustache');
const fs = require('fs')

const team = process.env.TERMINUSDB_TEAM
const key = process.env.TERMINUSDB_ACCESS_TOKEN
const url = `https://cloud.terminusdb.com/${team}/`
const client = new TerminusDBClient.WOQLClient(url,
                                               {user:"jacobian@gmail.com",
                                                organization:team})
client.setApiKey(key)

const PORT = process.env.PORT || 3000;


app.get("", (req, res) => {
    client.connect().then(()=>{
        client.db('seshat')
        const preq = {
            "type": "PrecedingPolity",
        }
        pre_results_promise = client.queryDocument(preq, { as_list : true } )
        const sucq = {
            "type": "SuccedingPolity",
        }
        post_results_promise = client.queryDocument(sucq, { as_list : true } )

        Promise.all([pre_results_promise, post_results_promise])
            .then(response => {
                var links = []
                var nodes = []
                pre_result = response[0];
                suc_result = response[1];

                for (i = 0; i < pre_result.length; i++) {
                    links.push( { 'source' : pre_result[i]['preceding'],
                                  'target' : pre_result[i]['polity'],
                                  'weight' : 90})
                }
                for (i = 0; i < suc_result.length; i++) {
                    links.push( { 'source' : suc_result[i]['polity'],
                                  'target' : suc_result[i]['succeding'],
                                  'weight' : 90 })
                }
                for (i = 0; i < links.length; i++) {
                    var source = links[i]['source'];
                    var target = links[i]['target'];
                    nodes.push( {'@id' : source, 'name' : source, '@type' : 'Polity' })
                    nodes.push( {'@id' : target, 'name' : target, '@type' : 'Polity' })
                }
                link_string = JSON.stringify([...new Set(links)]);
                node_string = JSON.stringify([...new Set(nodes)]);
                var js = `{ 'nodes' : ${node_string}, 'links' : ${link_string} }`

                var template = fs.readFileSync('./views/graph.mustache', 'utf-8')

                var output = Mustache.render(template, {json : js});
                res.send(output)
            })
    }).catch((err)=>{
        console.error(err);
    });
});

app.listen(PORT, () => {
  console.log(`App up at port ${PORT}`)
});

