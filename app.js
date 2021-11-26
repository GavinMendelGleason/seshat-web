const app = require("express")();
const TerminusDBClient = require("@terminusdb/terminusdb-client")
const team = process.env.TERMINUSDB_TEAM
const key = process.env.TERMINUSDB_ACCESS_TOKEN
const url = `https://cloud.terminusdb.com/${team}/`
const client = new TerminusDBClient.WOQLClient(url,
                    {user:"user@email.com", organization:team})

const PORT = process.env.PORT || 3000;

app.get("", (req, res) => {
    const query = {
        "type": "Polity",
        "query" : { "@id" : "AfDurrn" }
    }
    result = await client.queryDocument(query, { as_list : true } );
    res.send(JSON.stringify(result))
});

app.listen(PORT, () => {
  console.log(`App up at port ${PORT}`)
});
