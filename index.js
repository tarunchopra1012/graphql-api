const express = require('express');

const { graphqlHTTP } = require('express-graphql');
const { GraphQLObjectType, GraphQLID, GraphQLString, GraphQLList, GraphQLSchema } = require('graphql');

const app = express();

const usersList = [
    { id: "1", name: "James", email: "james@test.com" },
    { id: "2", name: "John", email: "john@test.com" },
    { id: "3", name: "Jimmie", email: "jimmie@test.com" }
];

const UserType = new GraphQLObjectType({
    name: "UserType",
    fields: () => ({
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        email: { type: GraphQLString }
    })
});

const RootQuery = new GraphQLObjectType({
    name: "RootQuery",
    fields: {
        // to get all users
        users: {
            type: new GraphQLList(UserType),
            resolve() {
                return usersList;
            },
        },
        // to get user by id
        user: {
            type: UserType,
            args: {
                id: {
                    type: GraphQLID
                }
            },
            resolve(parent, args) {
                return usersList.find((user) => user.id === args.id)
            }
        }
    }
});

const mutations = new GraphQLObjectType({
    name: "mutations",
    fields: {
        // adding a user
        addUser: {
            type: UserType,
            args: { name: { type: GraphQLString }, email: { type: GraphQLString } },
            resolve(parent, { name, email }) {
                const newUser = { name, email, id: Date.now().toString() };
                usersList.push(newUser);
                return newUser;
            },
        }
    }
});

const schema = new GraphQLSchema({
    query: RootQuery,
    mutation: mutations
});

app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: true
}));

app.listen(5000, () => {
    console.log('Server is running on port: 5000');
})