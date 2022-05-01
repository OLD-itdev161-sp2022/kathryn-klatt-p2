const {MongoClient} = require('mongodb');

async function main(){
    const uri =
      "mongodb+srv://admin:itdev161@cluster0ne.lebva.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

      const client  = new MongoClient(uri);
      try{
        await client.connect();

        // Create a single listing
          /* await createListing(client, {
          name: "A Cozy Apartment in Franklin",
          summary: "A charming 2BR apartment with a woodsy back porch view.",
          bedrooms: 2,
          bathrooms: 2
          }) */

        // Create multiple listings
          /*       await createMultiListings(client, [{
          name: "Beautiful Beach House",
          summary: "Enjoy relaxed beach living in this house with a private beach.",
          bedrooms: 4,
          bathrooms: 2.5,
          last_review: new Date()
           }, {
          name: "It's Cheap. It's Available!",
          summary: "This inexpensive bedroom rental is perfect for a temporary budget stay. Quiet neighbors (retirement home across the street). Convenient shopping (liquor and convenience store next door).",
          description: "The property is a private home. You will have access to a shared bathroom.",
          bedrooms: 1,
          bathrooms: 1,
          price: 18.00
          }]) */

        // Read listing by Name
          // await findListingbyName(client, "Cozy Cottage");

        // Read listings (limiting to 10 results) with at least 2BR/2BA
          // await findListingsMinBathBedAndRecRev(client, {minimumNumberBathrooms: 2, minimumNumberBedrooms: 2, maximumNumberOfResults:10});

        // Read the area name and price of the 10 cheapest listings in Sydney Australia
         // await printCheapestSuburbs(client,"Sydney", "Australia", 10); // client, country, city, max results shown

        // Update listing by name
         // await updateListingByName(client, "A Cozy Apartment in Franklin", {beds:1});

        // Update listing using Upsert; upsert updates a document if it exists, or inserts a document if it does not
          // await upsertListingByName(client, "Cozy Cottage", { name: "Cozy Cottage", bedrooms:2, bathrooms:2});

        // Update all listings with property type
         // await updateListingswithPropertyType(client);

        // Delete one listing by name
         //await deleteListing(client, ""); // client, ExactNameOfListing

        //Delete old listings based on last update
          //await deleteOldListings(client, new Date("2019-02-15")); // Delete listings last updated before Feb 25, 2019.

        //Displays all databases available
          await listDatabases(client);

      }catch(e){
          console.error(e);
      } finally {
          await client.close();
      }
}

main().catch(console.error);

// FUNCTIONS

// Create One Listing
async function createListing(client, newListing){
const result = await client.db("sample_airbnb").collection("listingsAndReviews").insertOne(newListing);
console.log(`New listing created with the following id: ${result.insertedId}`);
}

// Create Multiple Listings
async function createMultiListings(client, newListings){
    const result = await client.db("sample_airbnb").collection("listingsAndReviews").insertMany(newListings);
    console.log(`${result.insertedCount} new listings created with the following id(s):`);
    console.log(result.insertedIds);
}

// Read Specific Listing by Name
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

// Read Listings with at least 2BR/2BA (Display a maximum of __ listings)
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

// Read Cheapest Listings (Aggregated data)
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

// Update using Upsert
async function upsertListingByName(client, nameOfListing, updatedListing) {
  const result = await client
    .db("sample_airbnb")
    .collection("listingsAndReviews")
    .updateOne({ name: nameOfListing }, { $set: updatedListing }, {upsert:true});
  console.log(`${result.matchedCount} documents matched query.`);
  if(result.upsertedCount > 0){
  console.log(`One document was inserted with the id ${result.upsertedId}.`);
  } else{
    console.log(`${result.modifiedCount} document(s) was/were updated.`);
  }
}

// Update many listings
async function updateListingswithPropertyType (client){
  const result = await client.db("sample_airbnb").collection("listingsAndReviews").updateMany({
    property_type:{$exists:false}},
    {$set:{property_type:"Unknown"}});

    console.log(`${result.matchedCount} document(s) matched the query criteria.`);
    console.log(`${result.modifiedCount} document(s) were updated.`);
}

// Delete listing
async function deleteListing(client, listingName){
  client.db("sample_airbnb").collection("listingAndReviews").deleteOne({ name: nameOfListing });
  console.log(`${result.deletedCount} document(s) were deleted.`);
}

// Delete old listings
async function deleteOldListings(client, date){
  const result = await client.db("sample_airbnb").collection("listingsAndReviews").deleteMany({"last_scraped":{$lt:date}});
  console.log(`${result.deletedCount} document(s) were deleted.`)
}

// Display list of Databases
async function listDatabases(client) {
    const databasesList = await client.db().admin().listDatabases();

    console.log("Databases: ");
    databasesList.databases.forEach(db => {
        console.log(`-${db.name}`);
    })
}