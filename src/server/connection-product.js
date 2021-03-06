const elasticsearch = require('elasticsearch')

// Core ES variables for this project
const index = 'smart-tv'
const type = 'smart-tv'
const port = 9200
const host = process.env.ES_HOST || 'localhost'

console.log("host"+host);
const client = new elasticsearch.Client({ host: { host, port } })

/** Check the ES connection status */
async function checkConnection() {
  let isConnected = false
  while (!isConnected) {
    console.log('Connecting to ES')
    try {
      const health = await client.cluster.health({})
      console.log(health)
      isConnected = true
    } catch (err) {
      console.log('Connection Failed, Retrying...', err)
    }
  }
}


/** Clear the index, recreate it, and add mappings */
async function resetIndex() {

  const settings = {
    "settings": {
      "analysis": {
        "analyzer": {
          "my_analyzer": {
            "tokenizer": "my_tokenizer"
          }
        },
        "tokenizer": {
          "my_tokenizer": {
            "type": "path_hierarchy",
            "delimiter": "|",
            "replacement": "/",
            "reverse": true
          }
        }
      }
    }
  };
  if (await client.indices.exists({ index })) {
    await client.indices.delete({ index })
  }

  /*
  
  await client.indices.create({ index }).then(
    function(){
      await client.indices.putSettings({ index, ignoreUnavailable:true,  body: settings })
    }
  );
  */





  await client.indices.create({ index })


  await client.indices.close({ index })
  await client.indices.putSettings({ index, body: settings })
  await client.indices.open({ index })
  await putMappingForSmartTV()
}

/** Add book section schema mapping to ES */
async function putMappingForSmartTV() {

  /*
  const ret = {
    "id": id, 
    "modelname":modelname,
    "modelnumber": modelnumber,
    "brand": brand, 
    "productname" :productname, 
    "shortlabel":shortlabel, 
    "longdescription":longdescription
  };
  */
  /*
    const schema = {
      id:  { type: 'text' },
      modelname: { type: 'text' },
      modelnumber: { type: 'text' },
      brand: { type: 'text' },
      productname: { type: 'text' },
      shortlabel: { type: 'text' },
      longdescription: { type: 'text' },
      currentprice: { type: 'text' }
      
    }
    */
  /*
  const schema = {
    brand: { type: 'text' }      
  }
  */

  const schema = {
    "id": { type: 'keyword' },
    "modelname": { type: 'keyword' },
    "modelnumber": { type: 'keyword' },
    "brand": { type: 'keyword' },
    "productname": {
      type: 'text',
      "copy_to": "product_suggest"
    },
    "product_suggest": {
      "type": "completion"
    },
    "shortlabel": { type: 'text',
    "copy_to": "product_suggest"
    },
    "displayname": {
      type: 'text',
      "copy_to": "product_suggest"
    },
    "ean": { type: 'keyword' },
    "currentprice": { type: 'float' },
    "customerrating": { type: 'float' },
    "category_list": {
      "type": "nested",
      "properties": {
        "categoryName": { "type": "keyword" }
      }
    },
    "categories": {
      "type": 'text',
      "analyzer": "my_analyzer"
    },
    "text": { type: 'text' }
  };

  return client.indices.putMapping({ index, type, body: { properties: schema } })
}

module.exports = {
  client, index, type, checkConnection, resetIndex
}