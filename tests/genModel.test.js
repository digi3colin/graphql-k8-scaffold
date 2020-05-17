const { buildSchema } = require('graphql');
const {schemaHeader} = require('@komino/graphql-sqlite-ddl');
const {codeGen} = require('../index');

describe('test schema to model', () => {
  test('simple schema', () => {
    const schema = buildSchema(`
type Persons {
    first_name: String!
    last_name: String!
    phone: String
    email: String
}`);

    const model = codeGen(schema);
    const target =
`const {K8} = require('@komino/k8');
const ORM = K8.require('ORM');

class Person extends ORM{
  constructor(id, options) {
    super(id, options);
    if(id)return;

    //foreignKeys


    //fields
    this.first_name = null;
    this.last_name = null;
    this.phone = null;
    this.email = null;
  }
}

Person.jointTablePrefix = 'person';
Person.tableName = 'persons';

Person.fields = [
"first_name", "last_name", "phone", "email"
];

Person.belongsTo = new Map([

]);

Person.hasMany = new Map([

]);

Person.belongsToMany = [

];

module.exports = Person;
`

    expect(model.join("")).toBe(target);

  })

  test('default value', () => {
    const schema = buildSchema(schemaHeader + `
type Persons {
    name: String!
    foo: Boolean! @default(value: true)
    koo: Boolean! @default(value: false)
    bar: String! @default(value: "yoo")
    tar: Float! @default(value: 0.5)
    haa: Int! @default(value: 100)
}`);

    const model = codeGen(schema);
    const target =
      `const {K8} = require('@komino/k8');
const ORM = K8.require('ORM');

class Person extends ORM{
  constructor(id, options) {
    super(id, options);
    if(id)return;

    //foreignKeys


    //fields
    this.name = null;
    this.foo = true;
    this.koo = false;
    this.bar = "yoo";
    this.tar = 0.5;
    this.haa = 100;
  }
}

Person.jointTablePrefix = 'person';
Person.tableName = 'persons';

Person.fields = [
"name", "foo", "koo", "bar", "tar", "haa"
];

Person.belongsTo = new Map([

]);

Person.hasMany = new Map([

]);

Person.belongsToMany = [

];

module.exports = Person;
`

    expect(model.join("")).toBe(target);

  })

  test('foreign Keys', ()=>{
    const schema = buildSchema(schemaHeader + `
type Users{
    name: String
}

type Blogs{
    handle: String 
    belongsTo: Users @foreignKey(value: "owner_id")
    
}
 `);

    const model = codeGen(schema);
    const target =
`const {K8} = require('@komino/k8');
const ORM = K8.require('ORM');

class User extends ORM{
  constructor(id, options) {
    super(id, options);
    if(id)return;

    //foreignKeys


    //fields
    this.name = null;
  }
}

User.jointTablePrefix = 'user';
User.tableName = 'users';

User.fields = [
"name"
];

User.belongsTo = new Map([

]);

User.hasMany = new Map([
["owner_id", "Blog"]
]);

User.belongsToMany = [

];

module.exports = User;
const {K8} = require('@komino/k8');
const ORM = K8.require('ORM');

class Blog extends ORM{
  constructor(id, options) {
    super(id, options);
    if(id)return;

    //foreignKeys
    this.owner_id = null;

    //fields
    this.handle = null;
  }
}

Blog.jointTablePrefix = 'blog';
Blog.tableName = 'blogs';

Blog.fields = [
"handle"
];

Blog.belongsTo = new Map([
["owner_id", "User"]
]);

Blog.hasMany = new Map([

]);

Blog.belongsToMany = [

];

module.exports = Blog;
`

    expect(model.join("")).toBe(target);
  })

  test('hasAndBelongsToMany', ()=>{
    const schema = buildSchema(schemaHeader + `
type Product{
    name: String
}

type Collections{
    name: String 
    hasAndBelongsToMany: Product
}
 `);

    const target =
`const {K8} = require('@komino/k8');
const ORM = K8.require('ORM');

class Product extends ORM{
  constructor(id, options) {
    super(id, options);
    if(id)return;

    //foreignKeys


    //fields
    this.name = null;
  }
}

Product.jointTablePrefix = 'product';
Product.tableName = 'products';

Product.fields = [
"name"
];

Product.belongsTo = new Map([

]);

Product.hasMany = new Map([

]);

Product.belongsToMany = [

];

module.exports = Product;
const {K8} = require('@komino/k8');
const ORM = K8.require('ORM');

class Collection extends ORM{
  constructor(id, options) {
    super(id, options);
    if(id)return;

    //foreignKeys


    //fields
    this.name = null;
  }
}

Collection.jointTablePrefix = 'collection';
Collection.tableName = 'collections';

Collection.fields = [
"name"
];

Collection.belongsTo = new Map([

]);

Collection.hasMany = new Map([

]);

Collection.belongsToMany = [
"Product"
];

module.exports = Collection;
`;

    const model = codeGen(schema);
    expect(model.join("")).toBe(target);
  })
});