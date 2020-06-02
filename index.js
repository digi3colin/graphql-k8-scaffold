const {
  getFieldType,
  getTypeMap
} = require('@komino/graphql-sqlite-ddl');

const pluralize = require('pluralize');
pluralize.addPluralRule('person', 'persons');
const {snakeCase} = require('snake-case');

function getDefaultValue(value, type){
  switch(type){
    case 'Boolean':
      return value ? "true" : "false";
    case 'String':
      return `"${value}"`;
    case 'Int':
    case 'Float':
    default:
      return value;
  }
}


const typeToFields = (type)  =>{
  const defaultValues = new Map();

  type.fields.forEach(field => {
    const name = field.name.value;

    const isORMFields = /^(id|created_at|updated_at)$/.test(name);
    const isBelongs = /^belongsTo/.test(name);
    const isAssoicateTo = /^associateTo/.test(name);
    const isHasAndBelongsToMany = /^hasAndBelongsToMany/.test(name);
    if ( isORMFields || isBelongs || isAssoicateTo || isHasAndBelongsToMany) return;

    const fieldType = getFieldType(field.type);

    field.directives.map( directive => {
      switch( directive.name.value ){
        case "default":
          defaultValues.set(name, getDefaultValue(directive.arguments[0].value.value, fieldType))
          break;
      }
    });

    defaultValues.set(name, defaultValues.get(name) || "null")
  });


  return defaultValues;
}

const typeToFieldTypes = (type)  =>{
  const fieldTypes = new Map();

  type.fields.forEach(field => {
    const name = field.name.value;

    const isORMFields = /^(id|created_at|updated_at)$/.test(name);
    const isBelongs = /^belongsTo/.test(name);
    const isAssoicateTo = /^associateTo/.test(name);
    const isHasAndBelongsToMany = /^hasAndBelongsToMany/.test(name);
    if ( isORMFields || isBelongs || isAssoicateTo || isHasAndBelongsToMany) return;

    const fieldType = getFieldType(field.type);
    const isNonNullType = field.type.kind === 'NonNullType';

    fieldTypes.set(name, fieldType + (isNonNullType ? '!' : ''));
  });


  return fieldTypes;
}

const typeToForeignKeys = (type) =>{
  const result = new Map();

  type.fields.forEach(field => {
    const name = field.name.value;

    const isBelongs = /^belongsTo/.test(name);
    const isAssoicateTo = /^associateTo/.test(name);
    if( isBelongs || isAssoicateTo){
      const model = snakeCase(field.type.name.value);
      let fk = pluralize.singular(model) + '_id'

      //check custom foreign key rather than model_id
      field.directives.forEach( directive => {
        switch (directive.name.value) {
          case "foreignKey":
            fk = directive.arguments[0].value.value;
            break;
        }
      });
      result.set(fk, pluralize.singular(field.type.name.value))
    }
  });

  return result;
}

const typeToBelongsToMany = (type) =>{
  const result = [];

  type.fields.forEach(field => {
    const name = field.name.value;

    const isHasAndBelongsToMany = /^hasAndBelongsToMany/.test(name);
    if( isHasAndBelongsToMany ){
      result.push(pluralize.singular(field.type.name.value))
    }
  });

  return result;
}

const parseType = (type) =>{
  const tableName = snakeCase(pluralize(type.name.value));
  const className = pluralize.singular(type.name.value);
  const defaultValues = typeToFields(type);
  const fieldTypes = typeToFieldTypes(type);

  const belongsTo = type.belongsTo;
  const hasMany = type.hasMany || [];
  const belongsToMany = typeToBelongsToMany(type);

  return `const {K8} = require('@komino/k8');
const ORM = K8.require('ORM');

class ${className} extends ORM{
  constructor(id, options) {
    super(id, options);
    if(id)return;

    //foreignKeys
${Array.from(belongsTo.keys()).map(x => `    this.${x} = null;`).join('\n')}

    //fields
${Array.from(defaultValues).map((x ) => `    this.${x[0]} = ${x[1]};`).join('\n')}
  }
}

${className}.jointTablePrefix = '${snakeCase(className)}';
${className}.tableName = '${tableName}';

${className}.fields = new Map([
${Array.from(fieldTypes).map(x => `["${x[0]}", "${x[1]}"]`).join(',\n')}
]);

${className}.belongsTo = new Map([
${Array.from(belongsTo).map(x => `["${x[0]}", "${x[1]}"]`).join(',\n')}
]);

${className}.hasMany = [
${Array.from(hasMany).map(x => `["${x[0]}", "${x[1]}"]`).join(',\n')}
];

${className}.belongsToMany = [
${Array.from(belongsToMany).map(x => `"${x}"`).join(',\n')}
];

module.exports = ${className};
`;
}

const codeGen = (schema) =>{
  const codes = new Map();
  const typeMap = getTypeMap(schema);

//revserse belongs to and associate to create hasMany
  typeMap.forEach((type, key) =>{
    type.belongsTo = typeToForeignKeys(type);

    type.belongsTo.forEach((v, k) => {
      const t = typeMap.get(v) || typeMap.get(pluralize(v));
      t.hasMany = t.hasMany || [];
      t.hasMany.push([k, pluralize.singular(key)]);
    })
  });

  typeMap.forEach((type, key) =>{
    codes.set(key, parseType(type));
  })

  return codes;
}

module.exports = {
  codeGen : codeGen,
}