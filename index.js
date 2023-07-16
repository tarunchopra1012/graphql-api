const express = require('express');

const { graphqlHTTP } = require('express-graphql');
const { GraphQLObjectType, GraphQLID, GraphQLString, GraphQLList, GraphQLSchema } = require('graphql');

const app = express();

let usersList = [
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
        },
        // update a user
        updateUser: {
            type: UserType,
            args: { 
                id: { type: GraphQLID }, 
                email: { type: GraphQLString }, 
                name: { type: GraphQLString } 
            },
            resolve(parent, { id, name, email }) {
                const user = usersList.find((u) => u.id === id);
                user.email = email;
                user.name = name;
                return user;
            }
        },
        // delete user
        deleteUser: {
            type: UserType,
            args: { 
                id: { type: GraphQLID }
            },
            resolve(parent, { id }) {
                const user = usersList.find((u) => u.id === id);
                usersList = usersList.filter((u) => u.id !== id);
                return user;
            }
        },
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