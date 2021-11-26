const app = require("express")();
const TerminusDBClient = require("@terminusdb/terminusdb-client")
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
        const query = {
            "type": "Polity",
            "count" : 1
        }
        client.queryDocument(query, { as_list : true } )
            .then(result=>{
                console.log(result)
                res.send('<pre id="json">' + JSON.stringify(result, null, 4) + '</pre>')
            })
    }).catch((err)=>{
        console.error(err);
    });
});

app.listen(PORT, () => {
  console.log(`App up at port ${PORT}`)
});
