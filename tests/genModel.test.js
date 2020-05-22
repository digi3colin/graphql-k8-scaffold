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

Person.fields = new Map([
["first_name", "String!"],
["last_name", "String!"],
["phone", "String"],
["email", "String"]
]);

Person.belongsTo = new Map([

]);

Person.hasMany = [

];

Person.belongsToMany = [

];

module.exports = Person;
`

    expect([...model.values()].join("")).toBe(target);

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

Person.fields = new Map([
["name", "String!"],
["foo", "Boolean!"],
["koo", "Boolean!"],
["bar", "String!"],
["tar", "Float!"],
["haa", "Int!"]
]);

Person.belongsTo = new Map([

]);

Person.hasMany = [

];

Person.belongsToMany = [

];

module.exports = Person;
`

    expect([...model.values()].join("")).toBe(target);

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

User.fields = new Map([
["name", "String"]
]);

User.belongsTo = new Map([

]);

User.hasMany = [
["owner_id", "Blog"]
];

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

Blog.fields = new Map([
["handle", "String"]
]);

Blog.belongsTo = new Map([
["owner_id", "User"]
]);

Blog.hasMany = [

];

Blog.belongsToMany = [

];

module.exports = Blog;
`

    expect([...model.values()].join("")).toBe(target);
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

Product.fields = new Map([
["name", "String"]
]);

Product.belongsTo = new Map([

]);

Product.hasMany = [

];

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

Collection.fields = new Map([
["name", "String"]
]);

Collection.belongsTo = new Map([

]);

Collection.hasMany = [

];

Collection.belongsToMany = [
"Product"
];

module.exports = Collection;
`;

    const model = codeGen(schema);
    expect([...model.values()].join("")).toBe(target);
  })

  test('JSON type', ()=>{
      const schema = buildSchema(schemaHeader + `
type Person {
  name: String,
  meta: JSON
}`);

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
    this.meta = null;
  }
}

Person.jointTablePrefix = 'person';
Person.tableName = 'persons';

Person.fields = new Map([
["name", "String"],
["meta", "JSON"]
]);

Person.belongsTo = new Map([

]);

Person.hasMany = [

];

Person.belongsToMany = [

];

module.exports = Person;
`


    const model = codeGen(schema);
    expect([...model.values()].join("")).toBe(target);
  })

  test('Customer, addresses and customer attribute', ()=>{
    const schema = buildSchema(schemaHeader + `
type Customers {
  username : String!
}

type Addresses {
  company : String
  belongsTo: Customers
}

type CustomerAttributes{
  value: String
  belongsTo : Customers
}
    `);

    const target =
`const {K8} = require('@komino/k8');
const ORM = K8.require('ORM');

class Customer extends ORM{
  constructor(id, options) {
    super(id, options);
    if(id)return;

    //foreignKeys


    //fields
    this.username = null;
  }
}

Customer.jointTablePrefix = 'customer';
Customer.tableName = 'customers';

Customer.fields = new Map([
["username", "String!"]
]);

Customer.belongsTo = new Map([

]);

Customer.hasMany = [
["customer_id", "Address"],
["customer_id", "CustomerAttribute"]
];

Customer.belongsToMany = [

];

module.exports = Customer;
const {K8} = require('@komino/k8');
const ORM = K8.require('ORM');

class Address extends ORM{
  constructor(id, options) {
    super(id, options);
    if(id)return;

    //foreignKeys
    this.customer_id = null;

    //fields
    this.company = null;
  }
}

Address.jointTablePrefix = 'address';
Address.tableName = 'addresses';

Address.fields = new Map([
["company", "String"]
]);

Address.belongsTo = new Map([
["customer_id", "Customer"]
]);

Address.hasMany = [

];

Address.belongsToMany = [

];

module.exports = Address;
const {K8} = require('@komino/k8');
const ORM = K8.require('ORM');

class CustomerAttribute extends ORM{
  constructor(id, options) {
    super(id, options);
    if(id)return;

    //foreignKeys
    this.customer_id = null;

    //fields
    this.value = null;
  }
}

CustomerAttribute.jointTablePrefix = 'customer_attribute';
CustomerAttribute.tableName = 'customer_attributes';

CustomerAttribute.fields = new Map([
["value", "String"]
]);

CustomerAttribute.belongsTo = new Map([
["customer_id", "Customer"]
]);

CustomerAttribute.hasMany = [

];

CustomerAttribute.belongsToMany = [

];

module.exports = CustomerAttribute;
`;

    const model = codeGen(schema);
    expect([...model.values()].join("")).toBe(target);
  })
});