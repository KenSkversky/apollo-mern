const {ApolloServer, gql} = require('apollo-server');
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcryptjs');

const dotenv = require('dotenv');
dotenv.config();

const {DB_URI, DB_NAME} = process.env;

const typeDefs = gql`
    type Query {
        myTaskLists: [TaskList!]!
    }
    type Mutation {
        signUp(input: SignUpInput!): AuthUser! 
        signIn(input: SignInInput!): AuthUser!
    }
    input SignUpInput {
        email: String!
        password: String!
        name: String!
        avtar: String
    }
    input SignInInput {
        email: String!
        password: String!
    }
    type AuthUser {
        user: User!
        token: String!
    }
    type User {
        id: ID!
        name: String!
        email: String!
        avatar: String
    }
    type TaskList {
        id: ID!
        createdAt: String!
        title: String!
        progress: Float!

        users: [User!]!
        todos: [ToDo!]!
    }
    type ToDo {
        id: ID!
        content: String!
        isCompleted: Boolean!

        taskList: TaskList!
    }
`;

// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
const resolvers = {
    Query: {
     myTaskLists: () => []
    },
    Mutation: {
        signUp: async (_,{input}, {db}) => {
            const hashedPassword = bcrypt.hashSync(input.password);
            const newUser = {
                ...input,
                password: hashedPassword
            }
            const result = await db.collection('Users').insertOne(newUser);
            const user = result.ops[0]
            return {
                user,
                token: 'TOKEN',
            }
        },
        signIn:  async ( _, { input }, { db }) => {
            const user =  await db.collection('Users').findOne({ email: input.email });
            if (!user) {
                throw new Error('Invalid credentials!');
              }
              const isPasswordCorrect = await bcrypt.compareSync(input.password, user.password);
              if (!isPasswordCorrect) {
                throw new Error('Invalid credentials!');
              }
            //   console.log(user);
            return {
                user,
                token: 'TOKEN'
            }
        }
    },
    User: {
        id: ({ _id, id }) => _id || id
    }
  }

const start = async () => {
    const client = new MongoClient(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  const db = client.db(DB_NAME);
  console.log(`Database: ${DB_NAME} Connection`)
  const context = {
      db
  }
 
const server = new ApolloServer({ typeDefs, resolvers, context });

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});

}
start();


  
