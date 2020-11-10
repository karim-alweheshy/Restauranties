const functions = require("firebase-functions")
const admin = require("firebase-admin")
const userUtilities = require("./../utilities/user_utilities")
const restaurantUtilities = require("./../utilities/restaurant_utilities")

exports.myRestaurants = functions.https.onCall(async (data, context) => {
    userUtilities.verifyAuth(context)
    await userUtilities.verifyIsRestaurantOwnerUser(admin, context.auth.uid)
    const restaurantsCollection = db.collection("restaurants").orderBy("modificationDate")
    const snapshot = await restaurantsCollection.where('ownerID', '==', context.auth.uid).get()
    if (snapshot.empty) { return [] }
    return snapshot.docs.map(doc => rewriteTimestampToISO(doc.data()))
});
  
exports.allRestaurants = functions.https.onCall(async (data, context) => {
    userUtilities.verifyAuth(context)
    await userUtilities.verifyIsRaterUser(admin, context.auth.uid)
    const restaurantsCollection = db.collection("restaurants")
    const filteredRestaurantsCollection = applyRatingFilterOnDocReferenceIfPossible(restaurantsCollection, data)
    const snapshot = await filteredRestaurantsCollection.orderBy("modificationDate").get()
    if (snapshot.empty) { return [] }
    return snapshot.docs.map(doc => restaurantUtilities.rewriteTimestampToISO(doc.data()))
});
  
exports.addRestaurant = functions.https.onCall(async (data, context) => {
    userUtilities.verifyAuth(context)
    await userUtilities.verifyIsRestaurantOwnerUser(admin, context.auth.uid)
    restaurantUtilities.verifyRestaurantKeysAndValues(data)
    const restaurantsCollection = db.collection("restaurants")
  
    const restaurantWithSameNameSnapshot = await restaurantsCollection.where('name', '==', data.name).get()
    if (!restaurantWithSameNameSnapshot.empty) {
      throw new functions.https.HttpsError('failed-precondition', 'Owner already has restaurant with same name');  
    }
    
    let restaurant = {
      name: data.name,
      phone: data.phoneNumber,
      imageURL: data.imageURL,
      categories: data.categories,
      ownerID: context.auth.uid,
      totalRatings: 0,
      averageRating: 0,
      creationDate: admin.firestore.Timestamp.fromDate(new Date()),
      modificationDate: admin.firestore.Timestamp.fromDate(new Date()),
    }
    const docReference = await restaurantsCollection.add(restaurant)
    const documentSnapshot = await docReference.get()
    return documentSnapshot.data
});

function applyRatingFilterOnDocReferenceIfPossible(docReference, data) {
    if (!data || !data.filter) {
      return docReference
    }
    if (!parseInt(data.filter)) {
      throw new functions.https.HttpsError('failed-precondition', 'Filter must be a whole number e.g. 1');  
    }
    if (parseInt(data.filter) > 5 || parseInt(data.filter) < 1) {
      throw new functions.https.HttpsError('failed-precondition', 'Filter must be between 1 (included) and 5 (included)');  
    }
    const filterRating = parseInt(data.filter)
    docReference = docReference.where('averageRating', '<=', filterRating)
    if (filterRating > 1) {
      docReference = docReference.where('averageRating', '>=', filterRating - 1)
    } else {
      // To exclude restaurants without ratings
      docReference = docReference.where('averageRating', '>', 0)
    }
    return docReference.orderBy('averageRating')
}