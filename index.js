const { ApolloServer, gql } = require('apollo-server');
const TokenGenerator = require('uuid-token-generator');
const _ = require('lodash');
const tokGen = new TokenGenerator(256, TokenGenerator.BASE62);

const randomNum = () => Math.round(Math.random() * 100000);

const typeDefs = gql`
  type User {
    id: ID!
    username: String
    isLoggedIn: Boolean!
    token: String!
    purchases: [Purchase!]
  }

  type Purchase {
    id: ID!
    items: [ID!]
  }

  type Item {
    id: ID!
    name: String!
    quantity: Int!
  }

  input ItemInput {
    id: ID!
    quantity: Int!
  }

  input Order {
    id: ID!
    items: [ItemInput!]
  }
  
  type Query {
    userProfile(token: String!): User
    items: [Item!]!
  }

  type Mutation {
    login(username: String!, password: String!): User
    logout(token: String!): Boolean!
    register(username: String!, password: String!): User
    purchase(token: String!, order: Order!): Boolean
  }
`;

const users = {};
const itemList = {
  12345: {
    name: 'Apple',
    quantity: 100
  },
  67890: {
    name: 'Grapes',
    quantity: 75,
  },
  35653: {
    name: 'Chicken Breast',
    quantity: 25
  },
  74523: {
    name: 'Bread',
    quantity: 32
  },
  59272: {
    name: 'Cheese',
    quantity: 15,
  }
};

const resolvers = {
  Query: {
    userProfile: (parent, args) => {
      const token = args.token;
      return _.find(users, { token: token });
    },
    items: (parent) => {
      return _.map(_.keys(itemList), itemId => {
        const name = itemList[itemId].name;
        const quantity = itemList[itemId].quantity;
        return {
          id: itemId,
          name,
          quantity
        }
      });
    },
  },
  Mutation: {
    login: (parent, args) => {
      const username = args.username;
      const password = args.password;
      const user = users[username];
      if (user && user.password === password) {
        user.isLoggedIn = true;
        user.token = tokGen.generate();
        return user;
      }
      return null;
    },
    logout: (parent, args) => {
      const token = args.token;
      const user = _.find(users, { token: token });
      user.isLoggedIn = false;
      user.token = null;
      return true;
    },
    register: (parent, args) => {
      const username = args.username;
      const password = args.password;
      users[username] = {
        username,
        password,
        token: tokGen.generate(),
        isLoggedIn: true,
        purchases: [],
        id: randomNum()
      }
      return users[username];
    },
    purchase: (parent, args) => {
      const items = args.order.items;
      const token = args.token;
      const itemIds = [];
      _.forEach(items, item => {
        const itemId = item.id;
        const quantity = item.quantity;
        const currentQuant = itemList[itemId].quantity;
        itemList[itemId].quantity = currentQuant - quantity;
        itemIds.push(itemId);
      });
      const user = _.find(users, { token: token });
      user.purchases.push({
        id: randomNum(),
        items: itemIds,
      });
      return true;
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
