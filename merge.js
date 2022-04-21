const { loadFilesSync } = require('@graphql-tools/load-files')
const { mergeTypeDefs } = require('@graphql-tools/merge')
const { print } = require('graphql')
const fs = require('fs')

const loadedFiles = loadFilesSync(`${__dirname}/schema/**/*.gql`)
const typeDefs = mergeTypeDefs(loadedFiles)
const printedTypeDefs = print(typeDefs)
fs.writeFileSync('schema.gql', printedTypeDefs)