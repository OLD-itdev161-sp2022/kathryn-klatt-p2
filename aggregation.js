const {MongoClient} = require('mongodb');

async function main(){
    const uri =
      "mongodb+srv://admin:itdev161@cluster0ne.lebva.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

      const client  = new MongoClient(uri);
      try{
      await client.connect();
      await printCheapestSuburbs(client,"Australia", "Sydney", 10);
      }catch(e){
          console.error(e);
      } finally {
          await client.close();
      }
}

main().catch(console.error);

// Call Aggregation

async function printCheapestSuburbs(client, country, market, max){
  //Create pipeline
  const pipeline = [
    
      {
        $match: {
          'bedrooms': 1,
          "address.country": country,
          "address.market": market,
          "address.suburb": {
            $exists: 1,
            $ne: "",
          },
          room_type: "Entire home/apt",
        },
      },
      {
        '$group': {
          '_id': "$address.suburb",
          'averagePrice': {
            '$avg': "$price",
          }
        }
      },
      {
        '$sort': {
          'averagePrice': 1,
        },
      },
      {
        '$limit': max,
      }
    ];

  const aggCursor = client.db("sample_airbnb").collection("listingsAndReviews").aggregate(pipeline);

  await aggCursor.forEach(airbnbListing =>{console.log(`${airbnbListing._id}: ${airbnbListing.averagePrice}`);
})
}

// Update listing by Name

async function updateListingByName(client, nameOfListing, updatedListing){
    const result= await client.db("sample_airbnb").collection("listingsAndReviews").updateOne({name:nameOfListing}, {$set:updatedListing});
console.log(`${result.matchedCount} documents matched query.`);
console.log(`${result.modifiedCount} documents updated.`);
}

// Read Listing: min bed, bath, and recent reviews
async function findListingsMinBathBedAndRecRev(client, {
    minimumNumberBedrooms = 2,
    minimumNumberBathrooms = 2,
    maximumNumberOfResults = Number.MAX_SAFE_INTEGER

} ={}) {
    const cursor = client.db("sample_airbnb").collection("listingsAndReviews").find({
        bedrooms:{$gte: minimumNumberBedrooms},
        bathrooms: {$gte: minimumNumberBathrooms}
    }).sort({last_review:-1})
    .limit(maximumNumberOfResults);

    const results = await cursor.toArray();

     if (results.length > 0) {
       console.log(
         `Found listing(s) with at least ${minimumNumberBedrooms} bedrooms and ${minimumNumberBathrooms} bathrooms:`
       );

       results.forEach((result, i) => {
         date = new Date(result.last_review).toDateString();

         console.log();

         console.log(`${i + 1}. name: ${result.name}`);

         console.log(`   _id: ${result._id}`);

         console.log(`   bedrooms: ${result.bedrooms}`);

         console.log(`   bathrooms: ${result.bathrooms}`);

         console.log(
           `   most recent review date: ${new Date(
             result.last_review
           ).toDateString()}`
         );
       });
     } else {
       console.log(
         `No listings found with at least ${minimumNumberBedrooms} bedrooms and ${minimumNumberBathrooms} bathrooms`
       );
     }
}

// Read Listing
async function findListingbyName(client, nameOfListing){
    // nameOfListing must be exact
    const result = await client.db("sample_airbnb").collection("listingsAndReviews").findOne({name:nameOfListing});

    if(result){
        console.log(`Found listings in the collection with '${nameOfListing}'`);
        console.log(result);
    }else {
        console.log(`No listings found with '${nameOfListing}'`);
    }
}

// Create Multiple Listings
async function createMultiListings(client, newListings){
    const result = await client.db("sample_airbnb").collection("listingsAndReviews").insertMany(newListings);
    console.log(`${result.insertedCount} new listings created with the following id(s):`);
    console.log(result.insertedIds);
}

// Create One Listing
async function createListing(client, newListing){
const result = await client.db("sample_airbnb").collection("listingsAndReviews").insertOne(newListing);
console.log(`New listing created with the following id: ${result.insertedID}`);
}

async function listDatabases(client) {
    const databasesList = await client.db().admin().listDatabases();

    console.log("Databases: ");
    databasesList.databases.forEach(db => {
        console.log(`-${db.name}`);
    })
}