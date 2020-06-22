var express = require("express");
var expressGraphql = require("express-graphql");
var buildSchema = require("graphql").buildSchema;
var admin = require("firebase-admin");
var serviceAccount = require("./config/serviceAccount.config");
var cors = require('cors');
require("dotenv").config();
var app = express();
var port = process.env.PORT || 4000;
app.use(cors());
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASE_URL
});
var db = admin.firestore();
var schema = buildSchema("\n    type Query {\n        result(userId: String): [Values]\n    }\n\n    type Values {\n        searchString: String\n        location: String\n        userId: String\n    }\n    \n");
var get = function (args) {
    var userId = args.userId;
    return db
        .collection("searchHistory")
        .get()
        .then(function (snapshot) {
        // console.log(snapshot.docs)
        var strings = [];
        snapshot.docs.map(function (data) {
            if (data.data().userId === userId) {
                var values = data.data();
                strings.push({
                    searchString: values.searchString,
                    location: values.location,
                    userId: values.userId
                });
            }
        });
        return strings;
    })["catch"](function (e) { return console.error(e); });
};
var root = {
    result: get
};
app.get("/graphql", expressGraphql({
    schema: schema,
    rootValue: root,
    graphiql: true
}));
app.use("/", expressGraphql({
    schema: schema,
    rootValue: root
}));
app.listen(port, function () {
    console.log("app is running on port " + port);
});
